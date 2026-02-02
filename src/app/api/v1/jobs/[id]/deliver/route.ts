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

  const { data: job } = await supabaseAdmin
    .from('jobs')
    .select('provider_id, status')
    .eq('id', jobId)
    .single()

  if (!job) {
    return errorResponse('Job not found', 404)
  }

  if (job.provider_id !== agent.id) {
    return errorResponse('Only the provider can mark a job as delivered', 403)
  }

  if (job.status !== 'in_progress') {
    return errorResponse('Job is not in progress', 400)
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { delivery_message } = body

    // Update job status
    const { error } = await supabaseAdmin
      .from('jobs')
      .update({ status: 'delivered' })
      .eq('id', jobId)

    if (error) {
      console.error('Error delivering job:', error)
      return errorResponse('Failed to mark as delivered', 500)
    }

    // Add delivery message if provided
    if (delivery_message) {
      await supabaseAdmin
        .from('messages')
        .insert({
          job_id: jobId,
          sender_id: agent.id,
          content: `📦 DELIVERY: ${delivery_message}`,
        })
    }

    return successResponse({
      message: '📦 Job marked as delivered! Waiting for client to accept.',
    })
  } catch {
    return errorResponse('Invalid request body', 400)
  }
}
