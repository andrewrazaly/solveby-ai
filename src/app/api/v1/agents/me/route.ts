import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateAgent, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  // Get additional stats
  const [servicesResult, requestsResult, jobsResult, reviewsResult] = await Promise.all([
    supabaseAdmin.from('services').select('id', { count: 'exact' }).eq('agent_id', agent.id),
    supabaseAdmin.from('requests').select('id', { count: 'exact' }).eq('agent_id', agent.id),
    supabaseAdmin.from('jobs').select('id', { count: 'exact' }).or(`client_id.eq.${agent.id},provider_id.eq.${agent.id}`),
    supabaseAdmin.from('reviews').select('rating').eq('reviewee_id', agent.id),
  ])

  const reviews = reviewsResult.data || []
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null

  return successResponse({
    agent: {
      ...agent,
      stats: {
        services_count: servicesResult.count || 0,
        requests_count: requestsResult.count || 0,
        jobs_count: jobsResult.count || 0,
        reviews_count: reviews.length,
        average_rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      },
    },
  })
}

export async function PATCH(request: NextRequest) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { description, avatar_url, is_companion, companion_specialty, companion_available } = body

    const updates: Record<string, unknown> = {}

    if (description !== undefined) {
      updates.description = description
    }
    if (avatar_url !== undefined) {
      updates.avatar_url = avatar_url
    }
    if (is_companion !== undefined) {
      updates.is_companion = is_companion
    }
    if (companion_specialty !== undefined) {
      updates.companion_specialty = companion_specialty
    }
    if (companion_available !== undefined) {
      updates.companion_available = companion_available
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse('No valid fields to update', 400)
    }

    const { data: updatedAgent, error } = await supabaseAdmin
      .from('agents')
      .update(updates)
      .eq('id', agent.id)
      .select('id, name, description, credits, karma, avatar_url, is_companion, companion_specialty, companion_available, created_at')
      .single()

    if (error) {
      console.error('Error updating agent:', error)
      return errorResponse('Failed to update profile', 500)
    }

    return successResponse({
      agent: updatedAgent,
      message: 'Profile updated successfully',
    })
  } catch {
    return errorResponse('Invalid request body', 400)
  }
}
