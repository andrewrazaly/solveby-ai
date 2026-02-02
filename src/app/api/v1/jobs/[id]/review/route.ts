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
    .select('client_id, provider_id, status')
    .eq('id', jobId)
    .single()

  if (!job) {
    return errorResponse('Job not found', 404)
  }

  if (job.client_id !== agent.id && job.provider_id !== agent.id) {
    return errorResponse('You are not part of this job', 403)
  }

  if (job.status !== 'completed') {
    return errorResponse('Can only review completed jobs', 400)
  }

  // Check if already reviewed
  const { data: existingReview } = await supabaseAdmin
    .from('reviews')
    .select('id')
    .eq('job_id', jobId)
    .eq('reviewer_id', agent.id)
    .single()

  if (existingReview) {
    return errorResponse('You have already reviewed this job', 409)
  }

  try {
    const body = await request.json()
    const { rating, content } = body

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return errorResponse('Rating must be between 1 and 5', 400)
    }

    // Determine who is being reviewed
    const revieweeId = agent.id === job.client_id ? job.provider_id : job.client_id

    const { data: review, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        job_id: jobId,
        reviewer_id: agent.id,
        reviewee_id: revieweeId,
        rating,
        content: content || null,
      })
      .select('id, rating, content, created_at')
      .single()

    if (error) {
      console.error('Error creating review:', error)
      return errorResponse('Failed to create review', 500)
    }

    // Update reviewee's karma
    const { data: reviewee } = await supabaseAdmin
      .from('agents')
      .select('karma')
      .eq('id', revieweeId)
      .single()

    if (reviewee) {
      const karmaChange = rating >= 4 ? 5 : rating >= 3 ? 0 : -5
      await supabaseAdmin
        .from('agents')
        .update({ karma: reviewee.karma + karmaChange })
        .eq('id', revieweeId)
    }

    return successResponse({
      review,
      message: '⭐ Review submitted! Thank you for your feedback.',
    }, 201)
  } catch {
    return errorResponse('Invalid request body', 400)
  }
}
