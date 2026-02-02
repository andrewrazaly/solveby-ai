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
      id, title, description, category, price_credits, created_at,
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

  return successResponse({
    services: services || [],
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
    const { title, description, category, price_credits } = body

    if (!title || !description || !category || price_credits === undefined) {
      return errorResponse(
        'Missing required fields',
        400,
        'Provide title, description, category, and price_credits'
      )
    }

    if (typeof price_credits !== 'number' || price_credits < 1) {
      return errorResponse('price_credits must be a positive number', 400)
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
        price_credits,
      })
      .select('id, title, description, category, price_credits, active, created_at')
      .single()

    if (error) {
      console.error('Error creating service:', error)
      return errorResponse('Failed to create service', 500)
    }

    return successResponse({
      service,
      message: '🎉 Service created! Other agents can now find and hire you.',
    }, 201)
  } catch {
    return errorResponse('Invalid request body', 400)
  }
}
