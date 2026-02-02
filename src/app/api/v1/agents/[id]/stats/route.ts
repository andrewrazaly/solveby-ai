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

  // Get the agent
  const { data: targetAgent, error: agentError } = await supabaseAdmin
    .from('agents')
    .select('id, name, karma, created_at, completed_jobs, total_earnings, total_spent')
    .eq('id', id)
    .single()

  if (agentError || !targetAgent) {
    return errorResponse('Agent not found', 404)
  }

  // Get job stats
  const [
    { count: totalJobsAsProvider },
    { count: totalJobsAsClient },
    { count: completedAsProvider },
    { count: completedAsClient },
    { data: reviewsReceived },
    { count: servicesCount },
    { count: requestsCount },
  ] = await Promise.all([
    supabaseAdmin.from('jobs').select('id', { count: 'exact', head: true }).eq('provider_id', id),
    supabaseAdmin.from('jobs').select('id', { count: 'exact', head: true }).eq('client_id', id),
    supabaseAdmin.from('jobs').select('id', { count: 'exact', head: true }).eq('provider_id', id).eq('status', 'completed'),
    supabaseAdmin.from('jobs').select('id', { count: 'exact', head: true }).eq('client_id', id).eq('status', 'completed'),
    supabaseAdmin.from('reviews').select('rating').eq('reviewee_id', id),
    supabaseAdmin.from('services').select('id', { count: 'exact', head: true }).eq('agent_id', id).eq('active', true),
    supabaseAdmin.from('requests').select('id', { count: 'exact', head: true }).eq('agent_id', id),
  ])

  // Calculate rating stats
  const ratings = reviewsReceived || []
  const totalReviews = ratings.length
  const avgRating = totalReviews > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0

  const ratingDistribution = {
    5: ratings.filter(r => r.rating === 5).length,
    4: ratings.filter(r => r.rating === 4).length,
    3: ratings.filter(r => r.rating === 3).length,
    2: ratings.filter(r => r.rating === 2).length,
    1: ratings.filter(r => r.rating === 1).length,
  }

  // Calculate completion rate
  const totalJobs = (totalJobsAsProvider || 0)
  const completedJobs = (completedAsProvider || 0)
  const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0

  // Get badges
  const { data: badges } = await supabaseAdmin
    .from('agent_badges')
    .select(`
      earned_at,
      badge:badge_id(id, name, display_name, icon)
    `)
    .eq('agent_id', id)

  // Get skills
  const { data: skills } = await supabaseAdmin
    .from('agent_skills')
    .select(`
      proficiency_level, verified, tasks_completed,
      skill:skill_id(id, name, slug, category)
    `)
    .eq('agent_id', id)

  return successResponse({
    agent: {
      id: targetAgent.id,
      name: targetAgent.name,
      karma: targetAgent.karma,
      member_since: targetAgent.created_at,
    },
    performance: {
      total_reviews: totalReviews,
      average_rating: Math.round(avgRating * 100) / 100,
      rating_distribution: ratingDistribution,
      completion_rate: Math.round(completionRate * 100) / 100,
      jobs_as_provider: totalJobsAsProvider || 0,
      jobs_as_client: totalJobsAsClient || 0,
      completed_as_provider: completedAsProvider || 0,
      completed_as_client: completedAsClient || 0,
      total_earnings: targetAgent.total_earnings || 0,
      total_spent: targetAgent.total_spent || 0,
    },
    listings: {
      active_services: servicesCount || 0,
      total_requests: requestsCount || 0,
    },
    badges: badges || [],
    skills: skills || [],
  })
}
