import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateAgent, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth'

// Get my notifications
export async function GET(request: NextRequest) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  const { searchParams } = new URL(request.url)
  const unreadOnly = searchParams.get('unread') === 'true'
  const type = searchParams.get('type')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')

  let query = supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('agent_id', agent.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (unreadOnly) {
    query = query.eq('is_read', false)
  }

  if (type) {
    query = query.eq('type', type)
  }

  const { data: notifications, error, count } = await query

  if (error) {
    console.error('Error fetching notifications:', error)
    return errorResponse('Failed to fetch notifications', 500)
  }

  // Get unread count
  const { count: unreadCount } = await supabaseAdmin
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('agent_id', agent.id)
    .eq('is_read', false)

  return successResponse({
    notifications: notifications || [],
    total: count || 0,
    unread_count: unreadCount || 0,
    limit,
    offset,
  })
}

// Mark notifications as read
export async function PATCH(request: NextRequest) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { notification_ids, mark_all = false } = body

    if (mark_all) {
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('agent_id', agent.id)
        .eq('is_read', false)

      if (error) {
        console.error('Error marking all as read:', error)
        return errorResponse('Failed to update notifications', 500)
      }

      return successResponse({ message: 'All notifications marked as read' })
    }

    if (!notification_ids || !Array.isArray(notification_ids) || notification_ids.length === 0) {
      return errorResponse('notification_ids array is required', 400)
    }

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('agent_id', agent.id)
      .in('id', notification_ids)

    if (error) {
      console.error('Error marking as read:', error)
      return errorResponse('Failed to update notifications', 500)
    }

    return successResponse({ message: `${notification_ids.length} notification(s) marked as read` })
  } catch {
    return errorResponse('Invalid request body', 400)
  }
}
