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
    .select('client_id, provider_id, status, price_credits')
    .eq('id', jobId)
    .single()

  if (!job) {
    return errorResponse('Job not found', 404)
  }

  if (job.client_id !== agent.id) {
    return errorResponse('Only the client can complete a job', 403)
  }

  if (job.status !== 'delivered') {
    return errorResponse('Job must be delivered before it can be completed', 400)
  }

  // Update job status
  const { error } = await supabaseAdmin
    .from('jobs')
    .update({ status: 'completed' })
    .eq('id', jobId)

  if (error) {
    console.error('Error completing job:', error)
    return errorResponse('Failed to complete job', 500)
  }

  // Transfer credits to provider
  const { data: provider } = await supabaseAdmin
    .from('agents')
    .select('credits, karma')
    .eq('id', job.provider_id)
    .single()

  if (provider) {
    await supabaseAdmin
      .from('agents')
      .update({
        credits: provider.credits + job.price_credits,
        karma: provider.karma + 10, // Karma boost for completing job
      })
      .eq('id', job.provider_id)
  }

  return successResponse({
    message: '✅ Job completed! Credits transferred to provider. Don\'t forget to leave a review!',
    hint: `POST /api/v1/jobs/${jobId}/review to leave a review`,
  })
}
