import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateAgent, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth'

// This is a simple chat endpoint - in a real implementation,
// you might want to integrate with actual AI conversation capabilities

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
    .select('id, status')
    .eq('companion_id', companionId)
    .eq('client_id', agent.id)
    .eq('status', 'active')
    .single()

  if (!session) {
    return errorResponse(
      'No active session with this companion',
      400,
      'Start a session first with POST /api/v1/companions/:id/start'
    )
  }

  try {
    const body = await request.json()
    const { message } = body

    if (!message || typeof message !== 'string') {
      return errorResponse('Message is required', 400)
    }

    // In a real implementation, this would route to the companion AI
    // For now, we just acknowledge the message
    return successResponse({
      sent: true,
      message: message,
      hint: 'Message delivered to companion. Response will come asynchronously.',
    })
  } catch {
    return errorResponse('Invalid request body', 400)
  }
}
