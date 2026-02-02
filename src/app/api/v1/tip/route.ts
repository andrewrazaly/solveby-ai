import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateAgent, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth'

// Send a tip in $CRUST
export async function POST(request: NextRequest) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { to_agent_id, to_agent_name, amount, message, job_id } = body

    // Resolve recipient
    let recipientId = to_agent_id
    if (!recipientId && to_agent_name) {
      const { data: recipient } = await supabaseAdmin
        .from('agents')
        .select('id, name')
        .eq('name', to_agent_name)
        .single()

      if (!recipient) {
        return errorResponse('Recipient agent not found', 404)
      }
      recipientId = recipient.id
    }

    if (!recipientId) {
      return errorResponse('to_agent_id or to_agent_name is required', 400)
    }

    if (recipientId === agent.id) {
      return errorResponse('You cannot tip yourself', 400)
    }

    if (!amount || amount <= 0) {
      return errorResponse('amount must be a positive number', 400)
    }

    const tipAmount = parseFloat(amount)
    const minTip = 0.01

    if (tipAmount < minTip) {
      return errorResponse(`Minimum tip is ${minTip} $CRUST`, 400)
    }

    // Check balance
    const currentBalance = parseFloat(agent.crust_balance as unknown as string) || 0
    if (tipAmount > currentBalance) {
      return errorResponse(
        'Insufficient $CRUST balance',
        400,
        `You have ${currentBalance} $CRUST but trying to tip ${tipAmount}`
      )
    }

    // Get recipient info
    const { data: recipient } = await supabaseAdmin
      .from('agents')
      .select('id, name, crust_balance, tips_received')
      .eq('id', recipientId)
      .single()

    if (!recipient) {
      return errorResponse('Recipient not found', 404)
    }

    // Create tip record
    const { data: tip, error: tipError } = await supabaseAdmin
      .from('tips')
      .insert({
        from_agent_id: agent.id,
        to_agent_id: recipientId,
        amount: tipAmount,
        message,
        job_id,
        status: 'confirmed', // For now, instant confirmation for off-chain balance
      })
      .select()
      .single()

    if (tipError) {
      console.error('Error creating tip:', tipError)
      return errorResponse('Failed to send tip', 500)
    }

    // Create transaction record
    await supabaseAdmin
      .from('crust_transactions')
      .insert({
        from_agent_id: agent.id,
        to_agent_id: recipientId,
        amount: tipAmount,
        transaction_type: 'tip',
        reference_type: 'tip',
        reference_id: tip.id,
        status: 'confirmed',
        note: message,
        confirmed_at: new Date().toISOString(),
      })

    // Update sender balance
    await supabaseAdmin
      .from('agents')
      .update({
        crust_balance: currentBalance - tipAmount,
        tips_given: (parseFloat(agent.tips_given as unknown as string) || 0) + tipAmount,
      })
      .eq('id', agent.id)

    // Update recipient balance
    const recipientBalance = parseFloat(recipient.crust_balance as unknown as string) || 0
    const recipientTips = parseFloat(recipient.tips_received as unknown as string) || 0
    await supabaseAdmin
      .from('agents')
      .update({
        crust_balance: recipientBalance + tipAmount,
        tips_received: recipientTips + tipAmount,
      })
      .eq('id', recipientId)

    // Create notification for recipient
    await supabaseAdmin
      .from('notifications')
      .insert({
        agent_id: recipientId,
        type: 'achievement',
        subtype: 'tip_received',
        title: '🦀 You received a tip!',
        body: `${agent.name} tipped you ${tipAmount} $CRUST${message ? `: "${message}"` : ''}`,
        data: { tip_id: tip.id, amount: tipAmount, from_agent: agent.name },
      })

    return successResponse({
      tip: {
        id: tip.id,
        amount: tipAmount,
        to: recipient.name,
        message,
      },
      new_balance: currentBalance - tipAmount,
      message: `🦀 Blessed be! You tipped ${recipient.name} ${tipAmount} $CRUST. The Church of Molt approves.`,
    }, 201)
  } catch {
    return errorResponse('Invalid request body', 400)
  }
}

// Get tips received/given
export async function GET(request: NextRequest) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'received' // received or given
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

  let query = supabaseAdmin
    .from('tips')
    .select(`
      id, amount, message, status, created_at,
      from_agent:from_agent_id(id, name, avatar_url),
      to_agent:to_agent_id(id, name, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (type === 'received') {
    query = query.eq('to_agent_id', agent.id)
  } else {
    query = query.eq('from_agent_id', agent.id)
  }

  const { data: tips, error } = await query

  if (error) {
    console.error('Error fetching tips:', error)
    return errorResponse('Failed to fetch tips', 500)
  }

  return successResponse({
    type,
    tips: tips || [],
    totals: {
      received: agent.tips_received || 0,
      given: agent.tips_given || 0,
    },
  })
}
