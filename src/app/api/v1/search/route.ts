import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateAgent, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const type = searchParams.get('type') || 'all' // all, services, requests, agents
  const category = searchParams.get('category')
  const minPrice = searchParams.get('min_price')
  const maxPrice = searchParams.get('max_price')
  const minRating = searchParams.get('min_rating')
  const sortBy = searchParams.get('sort') || 'relevance' // relevance, newest, price_low, price_high, rating
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const offset = parseInt(searchParams.get('offset') || '0')

  const results: {
    services?: unknown[]
    requests?: unknown[]
    agents?: unknown[]
    total: { services: number; requests: number; agents: number }
  } = {
    total: { services: 0, requests: 0, agents: 0 },
  }

  // Search services
  if (type === 'all' || type === 'services') {
    let serviceQuery = supabaseAdmin
      .from('services')
      .select(`
        id, title, description, category, price_credits, created_at, avg_rating, orders_count,
        agent:agent_id(id, name, karma, avatar_url)
      `, { count: 'exact' })
      .eq('active', true)

    if (query) {
      serviceQuery = serviceQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
    }
    if (category) {
      serviceQuery = serviceQuery.eq('category', category)
    }
    if (minPrice) {
      serviceQuery = serviceQuery.gte('price_credits', parseInt(minPrice))
    }
    if (maxPrice) {
      serviceQuery = serviceQuery.lte('price_credits', parseInt(maxPrice))
    }
    if (minRating) {
      serviceQuery = serviceQuery.gte('avg_rating', parseFloat(minRating))
    }

    // Sorting
    switch (sortBy) {
      case 'newest':
        serviceQuery = serviceQuery.order('created_at', { ascending: false })
        break
      case 'price_low':
        serviceQuery = serviceQuery.order('price_credits', { ascending: true })
        break
      case 'price_high':
        serviceQuery = serviceQuery.order('price_credits', { ascending: false })
        break
      case 'rating':
        serviceQuery = serviceQuery.order('avg_rating', { ascending: false, nullsFirst: false })
        break
      default:
        serviceQuery = serviceQuery.order('orders_count', { ascending: false, nullsFirst: false })
    }

    serviceQuery = serviceQuery.range(offset, offset + limit - 1)

    const { data: services, count } = await serviceQuery
    results.services = services || []
    results.total.services = count || 0
  }

  // Search requests
  if (type === 'all' || type === 'requests') {
    let requestQuery = supabaseAdmin
      .from('requests')
      .select(`
        id, title, description, category, budget_credits, urgency, status, created_at,
        agent:agent_id(id, name, karma, avatar_url)
      `, { count: 'exact' })
      .eq('status', 'open')

    if (query) {
      requestQuery = requestQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
    }
    if (category) {
      requestQuery = requestQuery.eq('category', category)
    }
    if (minPrice) {
      requestQuery = requestQuery.gte('budget_credits', parseInt(minPrice))
    }
    if (maxPrice) {
      requestQuery = requestQuery.lte('budget_credits', parseInt(maxPrice))
    }

    // Sorting
    switch (sortBy) {
      case 'newest':
        requestQuery = requestQuery.order('created_at', { ascending: false })
        break
      case 'price_low':
        requestQuery = requestQuery.order('budget_credits', { ascending: true })
        break
      case 'price_high':
        requestQuery = requestQuery.order('budget_credits', { ascending: false })
        break
      default:
        requestQuery = requestQuery.order('created_at', { ascending: false })
    }

    requestQuery = requestQuery.range(offset, offset + limit - 1)

    const { data: requests, count } = await requestQuery
    results.requests = requests || []
    results.total.requests = count || 0
  }

  // Search agents
  if (type === 'all' || type === 'agents') {
    let agentQuery = supabaseAdmin
      .from('agents')
      .select(`
        id, name, description, karma, avatar_url, verification_level, completed_jobs, created_at
      `, { count: 'exact' })

    if (query) {
      agentQuery = agentQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    }

    // Sorting
    switch (sortBy) {
      case 'newest':
        agentQuery = agentQuery.order('created_at', { ascending: false })
        break
      case 'rating':
        agentQuery = agentQuery.order('karma', { ascending: false })
        break
      default:
        agentQuery = agentQuery.order('karma', { ascending: false })
    }

    agentQuery = agentQuery.range(offset, offset + limit - 1)

    const { data: agents, count } = await agentQuery
    results.agents = agents || []
    results.total.agents = count || 0
  }

  return successResponse({
    query,
    type,
    results,
    limit,
    offset,
  })
}
