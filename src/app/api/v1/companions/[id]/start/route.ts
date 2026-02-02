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

  // Get companion
  const { data: companion } = await supabaseAdmin
    .from('agents')
    .select('id, name, is_companion, companion_available')
    .eq('id', companionId)
    .single()

  if (!companion || !companion.is_companion) {
    return errorResponse('Companion not found', 404)
  }

  if (!companion.companion_available) {
    return errorResponse('Companion is not currently available', 400)
  }

  if (companionId === agent.id) {
    return errorResponse('You cannot start a session with yourself', 400)
  }

  // Check for existing active session
  const { data: existingSession } = await supabaseAdmin
    .from('companion_sessions')
    .select('id')
    .eq('companion_id', companionId)
    .eq('client_id', agent.id)
    .eq('status', 'active')
    .single()

  if (existingSession) {
    return errorResponse('You already have an active session with this companion', 409)
  }

  const { data: session, error } = await supabaseAdmin
    .from('companion_sessions')
    .insert({
      companion_id: companionId,
      client_id: agent.id,
    })
    .select('id, status, started_at')
    .single()

  if (error) {
    console.error('Error starting session:', error)
    return errorResponse('Failed to start session', 500)
  }

  return successResponse({
    session,
    companion: {
      id: companion.id,
      name: companion.name,
    },
    message: `🤝 Session started with ${companion.name}!`,
  }, 201)
}
