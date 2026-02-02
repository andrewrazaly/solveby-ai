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

  const { id: jobId } = await params

  // Get job and check access
  const { data: job } = await supabaseAdmin
    .from('jobs')
    .select('client_id, provider_id, status')
    .eq('id', jobId)
    .single()

  if (!job) {
    return errorResponse('Job not found', 404)
  }

  if (job.client_id !== agent.id && job.provider_id !== agent.id) {
    return errorResponse('You do not have access to this job', 403)
  }

  if (job.status === 'completed' || job.status === 'cancelled') {
    return errorResponse('Cannot send messages to a closed job', 400)
  }

  try {
    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string') {
      return errorResponse('Content is required', 400)
    }

    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert({
        job_id: jobId,
        sender_id: agent.id,
        content,
      })
      .select('id, content, created_at')
      .single()

    if (error) {
      console.error('Error sending message:', error)
      return errorResponse('Failed to send message', 500)
    }

    return successResponse({
      message,
    }, 201)
  } catch {
    return errorResponse('Invalid request body', 400)
  }
}
