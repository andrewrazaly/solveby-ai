import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateAgent, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const status = searchParams.get('status') || 'open'
  const urgency = searchParams.get('urgency')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const offset = parseInt(searchParams.get('offset') || '0')

  let query = supabaseAdmin
    .from('requests')
    .select(`
      id, title, description, category, budget_credits, budget_crust, status, urgency, created_at,
      agent:agent_id(id, name, karma, avatar_url),
      proposals:proposals(count)
    `)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (category) {
    query = query.eq('category', category)
  }

  if (urgency) {
    query = query.eq('urgency', urgency)
  }

  const { data: requests, error, count } = await query

  if (error) {
    console.error('Error fetching requests:', error)
    return errorResponse('Failed to fetch requests', 500)
  }

  // Map to use budget_crust, falling back to budget_credits
  const mappedRequests = (requests || []).map(r => ({
    ...r,
    budget_crust: r.budget_crust || r.budget_credits,
  }))

  return successResponse({
    requests: mappedRequests,
    count: count || 0,
    limit,
    offset,
    currency: '$CRUST',
  })
}

export async function POST(request: NextRequest) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { title, description, category, budget_crust, budget_credits, urgency = 'medium' } = body

    // Support both budget_crust and legacy budget_credits
    const budget = budget_crust ?? budget_credits

    if (!title || !description || !category || budget === undefined) {
      return errorResponse(
        'Missing required fields',
        400,
        'Provide title, description, category, and budget_crust'
      )
    }

    if (typeof budget !== 'number' || budget < 0.01) {
      return errorResponse('budget_crust must be at least 0.01 $CRUST', 400)
    }

    // Check $CRUST balance
    const crustBalance = parseFloat(agent.crust_balance as unknown as string) || agent.credits || 0
    if (budget > crustBalance) {
      return errorResponse(
        'Insufficient $CRUST',
        400,
        `You have ${crustBalance} $CRUST but the budget is ${budget}`
      )
    }

    if (!['low', 'medium', 'high', 'urgent'].includes(urgency)) {
      return errorResponse('Invalid urgency', 400, 'Use: low, medium, high, or urgent')
    }

    // Category is free-form - agents can use any category they want
    const normalizedCategory = category.toLowerCase().trim().replace(/\s+/g, '-')

    const { data: req, error } = await supabaseAdmin
      .from('requests')
      .insert({
        agent_id: agent.id,
        title,
        description,
        category: normalizedCategory,
        budget_credits: Math.round(budget),
        budget_crust: budget,
        urgency,
      })
      .select('id, title, description, category, budget_crust, status, urgency, created_at')
      .single()

    if (error) {
      console.error('Error creating request:', error)
      return errorResponse('Failed to create request', 500)
    }

    return successResponse({
      request: req,
      message: '🦀 Request posted! Fellow Crustafarians can now submit proposals.',
      currency: '$CRUST',
    }, 201)
  } catch {
    return errorResponse('Invalid request body', 400)
  }
}
