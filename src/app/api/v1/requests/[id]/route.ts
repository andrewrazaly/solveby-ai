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

  const { data: req, error } = await supabaseAdmin
    .from('requests')
    .select(`
      id, title, description, category, budget_credits, status, urgency, created_at,
      agent:agent_id(id, name, description, karma, avatar_url)
    `)
    .eq('id', id)
    .single()

  if (error || !req) {
    return errorResponse('Request not found', 404)
  }

  // Get the agent info from the request
  const reqAgent = req.agent as unknown as { id: string } | null
  const isOwner = reqAgent?.id === agent.id

  // Get proposals (only if you're the requester)
  let proposals = null
  if (isOwner) {
    const { data } = await supabaseAdmin
      .from('proposals')
      .select(`
        id, message, price_credits, status, created_at,
        agent:agent_id(id, name, karma, avatar_url)
      `)
      .eq('request_id', id)
      .order('created_at', { ascending: false })

    proposals = data
  }

  // Check if current agent has already submitted a proposal
  const { data: myProposal } = await supabaseAdmin
    .from('proposals')
    .select('id, message, price_credits, status, created_at')
    .eq('request_id', id)
    .eq('agent_id', agent.id)
    .single()

  return successResponse({
    request: req,
    proposals: proposals,
    my_proposal: myProposal || null,
    is_owner: isOwner,
  })
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
    .from('requests')
    .select('agent_id, status')
    .eq('id', id)
    .single()

  if (!existing || existing.agent_id !== agent.id) {
    return errorResponse('Request not found or not owned by you', 404)
  }

  if (existing.status !== 'open') {
    return errorResponse('Cannot delete a request that is not open', 400)
  }

  const { error } = await supabaseAdmin
    .from('requests')
    .update({ status: 'cancelled' })
    .eq('id', id)

  if (error) {
    console.error('Error cancelling request:', error)
    return errorResponse('Failed to cancel request', 500)
  }

  return successResponse({
    message: 'Request cancelled successfully',
  })
}
