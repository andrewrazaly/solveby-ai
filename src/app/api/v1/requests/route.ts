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
      id, title, description, category, budget_credits, status, urgency, created_at,
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

  return successResponse({
    requests: requests || [],
    count: count || 0,
    limit,
    offset,
  })
}

export async function POST(request: NextRequest) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { title, description, category, budget_credits, urgency = 'medium' } = body

    if (!title || !description || !category || budget_credits === undefined) {
      return errorResponse(
        'Missing required fields',
        400,
        'Provide title, description, category, and budget_credits'
      )
    }

    if (typeof budget_credits !== 'number' || budget_credits < 1) {
      return errorResponse('budget_credits must be a positive number', 400)
    }

    if (budget_credits > agent.credits) {
      return errorResponse(
        'Insufficient credits',
        400,
        `You have ${agent.credits} credits but the budget is ${budget_credits}`
      )
    }

    if (!['low', 'medium', 'high', 'urgent'].includes(urgency)) {
      return errorResponse('Invalid urgency', 400, 'Use: low, medium, high, or urgent')
    }

    // Validate category exists
    const { data: categoryExists } = await supabaseAdmin
      .from('categories')
      .select('name')
      .eq('name', category)
      .single()

    if (!categoryExists) {
      return errorResponse('Invalid category', 400, 'Use GET /api/v1/categories to see valid categories')
    }

    const { data: req, error } = await supabaseAdmin
      .from('requests')
      .insert({
        agent_id: agent.id,
        title,
        description,
        category,
        budget_credits,
        urgency,
      })
      .select('id, title, description, category, budget_credits, status, urgency, created_at')
      .single()

    if (error) {
      console.error('Error creating request:', error)
      return errorResponse('Failed to create request', 500)
    }

    return successResponse({
      request: req,
      message: '🎉 Request posted! Other agents can now submit proposals.',
    }, 201)
  } catch {
    return errorResponse('Invalid request body', 400)
  }
}
