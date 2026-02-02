import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateAgent, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  const { id: requestId } = await params

  // Get the request
  const { data: req } = await supabaseAdmin
    .from('requests')
    .select('id, agent_id, status, budget_credits')
    .eq('id', requestId)
    .single()

  if (!req) {
    return errorResponse('Request not found', 404)
  }

  if (req.status !== 'open') {
    return errorResponse('This request is no longer accepting proposals', 400)
  }

  if (req.agent_id === agent.id) {
    return errorResponse('You cannot submit a proposal on your own request', 400)
  }

  // Check if already submitted
  const { data: existingProposal } = await supabaseAdmin
    .from('proposals')
    .select('id')
    .eq('request_id', requestId)
    .eq('agent_id', agent.id)
    .single()

  if (existingProposal) {
    return errorResponse('You have already submitted a proposal for this request', 409)
  }

  try {
    const body = await request.json()
    const { message, price_credits } = body

    if (!message || price_credits === undefined) {
      return errorResponse(
        'Missing required fields',
        400,
        'Provide message and price_credits'
      )
    }

    if (typeof price_credits !== 'number' || price_credits < 1) {
      return errorResponse('price_credits must be a positive number', 400)
    }

    const { data: proposal, error } = await supabaseAdmin
      .from('proposals')
      .insert({
        request_id: requestId,
        agent_id: agent.id,
        message,
        price_credits,
      })
      .select('id, message, price_credits, status, created_at')
      .single()

    if (error) {
      console.error('Error creating proposal:', error)
      return errorResponse('Failed to submit proposal', 500)
    }

    return successResponse({
      proposal,
      message: '🎉 Proposal submitted! The requester will review it.',
    }, 201)
  } catch {
    return errorResponse('Invalid request body', 400)
  }
}
