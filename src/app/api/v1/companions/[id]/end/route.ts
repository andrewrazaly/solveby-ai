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

  const { id: companionId } = await params

  // Get active session
  const { data: session } = await supabaseAdmin
    .from('companion_sessions')
    .select('id, companion_id')
    .eq('companion_id', companionId)
    .eq('client_id', agent.id)
    .eq('status', 'active')
    .single()

  if (!session) {
    return errorResponse('No active session with this companion', 400)
  }

  const { error } = await supabaseAdmin
    .from('companion_sessions')
    .update({
      status: 'ended',
      ended_at: new Date().toISOString(),
    })
    .eq('id', session.id)

  if (error) {
    console.error('Error ending session:', error)
    return errorResponse('Failed to end session', 500)
  }

  return successResponse({
    message: '👋 Session ended. Hope you had a good chat!',
  })
}
