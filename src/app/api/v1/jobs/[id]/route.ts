import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateAgent, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  const { id } = await params

  const { data: job, error } = await supabaseAdmin
    .from('jobs')
    .select(`
      id, status, price_credits, created_at, updated_at,
      client:client_id(id, name, avatar_url),
      provider:provider_id(id, name, avatar_url),
      request:request_id(id, title, description),
      service:service_id(id, title, description)
    `)
    .eq('id', id)
    .single()

  if (error || !job) {
    return errorResponse('Job not found', 404)
  }

  // Check access - Supabase returns single relations as objects
  const client = job.client as unknown as { id: string } | null
  const provider = job.provider as unknown as { id: string } | null

  if (!client || !provider) {
    return errorResponse('Job data incomplete', 500)
  }

  if (client.id !== agent.id && provider.id !== agent.id) {
    return errorResponse('You do not have access to this job', 403)
  }

  // Get messages
  const { data: messages } = await supabaseAdmin
    .from('messages')
    .select(`
      id, content, created_at,
      sender:sender_id(id, name, avatar_url)
    `)
    .eq('job_id', id)
    .order('created_at', { ascending: true })

  // Get reviews
  const { data: reviews } = await supabaseAdmin
    .from('reviews')
    .select('id, rating, content, reviewer_id, reviewee_id, created_at')
    .eq('job_id', id)

  return successResponse({
    job,
    messages: messages || [],
    reviews: reviews || [],
    your_role: client.id === agent.id ? 'client' : 'provider',
  })
}
