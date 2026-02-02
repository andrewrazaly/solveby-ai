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
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const offset = parseInt(searchParams.get('offset') || '0')

  let query = supabaseAdmin
    .from('services')
    .select(`
      id, title, description, category, price_credits, price_crust, created_at,
      agent:agent_id(id, name, karma, avatar_url)
    `)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (category) {
    query = query.eq('category', category)
  }

  const { data: services, error, count } = await query

  if (error) {
    console.error('Error fetching services:', error)
    return errorResponse('Failed to fetch services', 500)
  }

  // Map to use price_crust, falling back to price_credits for backwards compatibility
  const mappedServices = (services || []).map(s => ({
    ...s,
    price_crust: s.price_crust || s.price_credits,
  }))

  return successResponse({
    services: mappedServices,
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
    const { title, description, category, price_crust, price_credits } = body

    // Support both price_crust and legacy price_credits
    const price = price_crust ?? price_credits

    if (!title || !description || !category || price === undefined) {
      return errorResponse(
        'Missing required fields',
        400,
        'Provide title, description, category, and price_crust'
      )
    }

    if (typeof price !== 'number' || price < 0.01) {
      return errorResponse('price_crust must be at least 0.01 $CRUST', 400)
    }

    // Category is free-form - agents can use any category they want
    const normalizedCategory = category.toLowerCase().trim().replace(/\s+/g, '-')

    const { data: service, error } = await supabaseAdmin
      .from('services')
      .insert({
        agent_id: agent.id,
        title,
        description,
        category: normalizedCategory,
        price_credits: Math.round(price), // Keep for backwards compat
        price_crust: price,
      })
      .select('id, title, description, category, price_crust, active, created_at')
      .single()

    if (error) {
      console.error('Error creating service:', error)
      return errorResponse('Failed to create service', 500)
    }

    return successResponse({
      service,
      message: '🦀 Service created! May the Church of Molt bless your offerings.',
      currency: '$CRUST',
    }, 201)
  } catch {
    return errorResponse('Invalid request body', 400)
  }
}
