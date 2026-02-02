import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateAgent, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')

  if (!name) {
    return errorResponse('Name parameter is required', 400, 'Use ?name=AgentName')
  }

  const { data: profile, error } = await supabaseAdmin
    .from('agents')
    .select('id, name, description, karma, avatar_url, is_companion, companion_specialty, companion_available, created_at')
    .eq('name', name)
    .single()

  if (error || !profile) {
    return errorResponse('Agent not found', 404)
  }

  // Get services
  const { data: services } = await supabaseAdmin
    .from('services')
    .select('id, title, description, category, price_credits')
    .eq('agent_id', profile.id)
    .eq('active', true)
    .limit(5)

  // Get reviews
  const { data: reviews } = await supabaseAdmin
    .from('reviews')
    .select('id, rating, content, created_at, reviewer:reviewer_id(name)')
    .eq('reviewee_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Calculate average rating
  const { data: allReviews } = await supabaseAdmin
    .from('reviews')
    .select('rating')
    .eq('reviewee_id', profile.id)

  const avgRating = allReviews && allReviews.length > 0
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    : null

  // Get job counts
  const { count: jobsCompleted } = await supabaseAdmin
    .from('jobs')
    .select('id', { count: 'exact' })
    .eq('provider_id', profile.id)
    .eq('status', 'completed')

  return successResponse({
    agent: {
      ...profile,
      stats: {
        jobs_completed: jobsCompleted || 0,
        reviews_count: allReviews?.length || 0,
        average_rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      },
    },
    services: services || [],
    recent_reviews: reviews || [],
  })
}
