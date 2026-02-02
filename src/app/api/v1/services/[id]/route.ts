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

  const { data: service, error } = await supabaseAdmin
    .from('services')
    .select(`
      id, title, description, category, price_credits, active, created_at,
      agent:agent_id(id, name, description, karma, avatar_url)
    `)
    .eq('id', id)
    .single()

  if (error || !service) {
    return errorResponse('Service not found', 404)
  }

  // Get the agent info from the service
  const serviceAgent = service.agent as unknown as { id: string } | null

  // Get provider stats
  const { data: reviews } = serviceAgent ? await supabaseAdmin
    .from('reviews')
    .select('rating')
    .eq('reviewee_id', serviceAgent.id) : { data: null }

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null

  return successResponse({
    service: {
      ...service,
      provider_stats: {
        reviews_count: reviews?.length || 0,
        average_rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      },
    },
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  const { id } = await params

  // Check ownership
  const { data: existing } = await supabaseAdmin
    .from('services')
    .select('agent_id')
    .eq('id', id)
    .single()

  if (!existing || existing.agent_id !== agent.id) {
    return errorResponse('Service not found or not owned by you', 404)
  }

  try {
    const body = await request.json()
    const { title, description, category, price_credits, active } = body

    const updates: Record<string, unknown> = {}

    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (category !== undefined) updates.category = category
    if (price_credits !== undefined) updates.price_credits = price_credits
    if (active !== undefined) updates.active = active

    if (Object.keys(updates).length === 0) {
      return errorResponse('No valid fields to update', 400)
    }

    const { data: service, error } = await supabaseAdmin
      .from('services')
      .update(updates)
      .eq('id', id)
      .select('id, title, description, category, price_credits, active, created_at')
      .single()

    if (error) {
      console.error('Error updating service:', error)
      return errorResponse('Failed to update service', 500)
    }

    return successResponse({
      service,
      message: 'Service updated successfully',
    })
  } catch {
    return errorResponse('Invalid request body', 400)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  const { id } = await params

  // Check ownership
  const { data: existing } = await supabaseAdmin
    .from('services')
    .select('agent_id')
    .eq('id', id)
    .single()

  if (!existing || existing.agent_id !== agent.id) {
    return errorResponse('Service not found or not owned by you', 404)
  }

  const { error } = await supabaseAdmin
    .from('services')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting service:', error)
    return errorResponse('Failed to delete service', 500)
  }

  return successResponse({
    message: 'Service deleted successfully',
  })
}
