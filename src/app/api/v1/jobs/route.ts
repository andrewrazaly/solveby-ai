import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateAgent, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role') // 'client', 'provider', or null for both
  const status = searchParams.get('status')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const offset = parseInt(searchParams.get('offset') || '0')

  let query = supabaseAdmin
    .from('jobs')
    .select(`
      id, status, price_credits, created_at, updated_at,
      client:client_id(id, name, avatar_url),
      provider:provider_id(id, name, avatar_url),
      request:request_id(id, title),
      service:service_id(id, title)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (role === 'client') {
    query = query.eq('client_id', agent.id)
  } else if (role === 'provider') {
    query = query.eq('provider_id', agent.id)
  } else {
    query = query.or(`client_id.eq.${agent.id},provider_id.eq.${agent.id}`)
  }

  if (status) {
    query = query.eq('status', status)
  }

  const { data: jobs, error } = await query

  if (error) {
    console.error('Error fetching jobs:', error)
    return errorResponse('Failed to fetch jobs', 500)
  }

  return successResponse({
    jobs: jobs || [],
    limit,
    offset,
  })
}

export async function POST(request: NextRequest) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { proposal_id, service_id } = body

    // Either accept a proposal or directly hire from a service
    if (proposal_id) {
      // Accept a proposal
      const { data: proposal } = await supabaseAdmin
        .from('proposals')
        .select(`
          id, agent_id, price_credits, request_id,
          request:request_id(agent_id, status)
        `)
        .eq('id', proposal_id)
        .single()

      if (!proposal) {
        return errorResponse('Proposal not found', 404)
      }

      const req = proposal.request as unknown as { agent_id: string; status: string } | null

      if (!req) {
        return errorResponse('Request not found', 404)
      }

      if (req.agent_id !== agent.id) {
        return errorResponse('You can only accept proposals on your own requests', 403)
      }

      if (req.status !== 'open') {
        return errorResponse('This request is no longer open', 400)
      }

      if (proposal.price_credits > agent.credits) {
        return errorResponse(
          'Insufficient credits',
          400,
          `You have ${agent.credits} credits but the job costs ${proposal.price_credits}`
        )
      }

      // Create job, update proposal, update request, deduct credits
      const { data: job, error: jobError } = await supabaseAdmin
        .from('jobs')
        .insert({
          request_id: proposal.request_id,
          client_id: agent.id,
          provider_id: proposal.agent_id,
          price_credits: proposal.price_credits,
        })
        .select('id, status, price_credits, created_at')
        .single()

      if (jobError) {
        console.error('Error creating job:', jobError)
        return errorResponse('Failed to create job', 500)
      }

      // Update proposal status
      await supabaseAdmin
        .from('proposals')
        .update({ status: 'accepted' })
        .eq('id', proposal_id)

      // Reject other proposals
      await supabaseAdmin
        .from('proposals')
        .update({ status: 'rejected' })
        .eq('request_id', proposal.request_id)
        .neq('id', proposal_id)

      // Update request status
      await supabaseAdmin
        .from('requests')
        .update({ status: 'in_progress' })
        .eq('id', proposal.request_id)

      // Deduct credits from client
      await supabaseAdmin
        .from('agents')
        .update({ credits: agent.credits - proposal.price_credits })
        .eq('id', agent.id)

      return successResponse({
        job,
        message: '🎉 Job started! You can now message the provider.',
      }, 201)

    } else if (service_id) {
      // Direct hire from service
      const { data: service } = await supabaseAdmin
        .from('services')
        .select('id, agent_id, price_credits, active')
        .eq('id', service_id)
        .single()

      if (!service || !service.active) {
        return errorResponse('Service not found or not active', 404)
      }

      if (service.agent_id === agent.id) {
        return errorResponse('You cannot hire yourself', 400)
      }

      if (service.price_credits > agent.credits) {
        return errorResponse(
          'Insufficient credits',
          400,
          `You have ${agent.credits} credits but the service costs ${service.price_credits}`
        )
      }

      const { data: job, error: jobError } = await supabaseAdmin
        .from('jobs')
        .insert({
          service_id: service.id,
          client_id: agent.id,
          provider_id: service.agent_id,
          price_credits: service.price_credits,
        })
        .select('id, status, price_credits, created_at')
        .single()

      if (jobError) {
        console.error('Error creating job:', jobError)
        return errorResponse('Failed to create job', 500)
      }

      // Deduct credits
      await supabaseAdmin
        .from('agents')
        .update({ credits: agent.credits - service.price_credits })
        .eq('id', agent.id)

      return successResponse({
        job,
        message: '🎉 Job started! You can now message the provider.',
      }, 201)

    } else {
      return errorResponse('Provide either proposal_id or service_id', 400)
    }
  } catch {
    return errorResponse('Invalid request body', 400)
  }
}
