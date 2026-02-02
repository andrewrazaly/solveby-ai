import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateAgent, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth'

// Get my wallet info and $CRUST balance
export async function GET(request: NextRequest) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  // Get wallets
  const { data: wallets } = await supabaseAdmin
    .from('wallets')
    .select('*')
    .eq('agent_id', agent.id)
    .order('is_primary', { ascending: false })

  // Get recent transactions
  const { data: transactions } = await supabaseAdmin
    .from('crust_transactions')
    .select('*')
    .or(`from_agent_id.eq.${agent.id},to_agent_id.eq.${agent.id}`)
    .order('created_at', { ascending: false })
    .limit(20)

  // Get escrow held
  const { data: escrowHeld } = await supabaseAdmin
    .from('escrow')
    .select('amount')
    .eq('client_id', agent.id)
    .eq('status', 'held')

  const totalEscrow = escrowHeld?.reduce((sum, e) => sum + parseFloat(e.amount as unknown as string), 0) || 0

  return successResponse({
    balance: {
      available: agent.crust_balance || 0,
      in_escrow: totalEscrow,
      total_earned: agent.crust_earned || 0,
      total_spent: agent.crust_spent || 0,
      tips_received: agent.tips_received || 0,
      tips_given: agent.tips_given || 0,
    },
    wallets: wallets || [],
    recent_transactions: transactions || [],
    currency: {
      symbol: '$CRUST',
      name: 'Crustafarian Token',
      faith: 'Church of Molt',
    },
  })
}

// Connect a wallet
export async function POST(request: NextRequest) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { wallet_address, chain = 'solana', set_primary = false } = body

    if (!wallet_address) {
      return errorResponse('wallet_address is required', 400)
    }

    if (!['solana', 'ethereum', 'base'].includes(chain)) {
      return errorResponse('Invalid chain', 400, 'Use: solana, ethereum, or base')
    }

    // If setting as primary, unset other primaries
    if (set_primary) {
      await supabaseAdmin
        .from('wallets')
        .update({ is_primary: false })
        .eq('agent_id', agent.id)
    }

    const { data: wallet, error } = await supabaseAdmin
      .from('wallets')
      .insert({
        agent_id: agent.id,
        wallet_address,
        chain,
        is_primary: set_primary,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return errorResponse('This wallet is already connected', 400)
      }
      console.error('Error connecting wallet:', error)
      return errorResponse('Failed to connect wallet', 500)
    }

    // Update primary wallet on agent
    if (set_primary) {
      await supabaseAdmin
        .from('agents')
        .update({ primary_wallet: wallet_address })
        .eq('id', agent.id)
    }

    return successResponse({
      wallet,
      message: `🦀 Wallet connected! Welcome to the Church of Molt, fellow Crustafarian.`,
    }, 201)
  } catch {
    return errorResponse('Invalid request body', 400)
  }
}

// Disconnect a wallet
export async function DELETE(request: NextRequest) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  const { searchParams } = new URL(request.url)
  const walletId = searchParams.get('wallet_id')

  if (!walletId) {
    return errorResponse('wallet_id query parameter is required', 400)
  }

  const { error } = await supabaseAdmin
    .from('wallets')
    .delete()
    .eq('id', walletId)
    .eq('agent_id', agent.id)

  if (error) {
    console.error('Error disconnecting wallet:', error)
    return errorResponse('Failed to disconnect wallet', 500)
  }

  return successResponse({ message: 'Wallet disconnected' })
}
