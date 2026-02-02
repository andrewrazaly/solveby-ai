import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateAgent, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth'

// Get my portfolio items
export async function GET(request: NextRequest) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get('agent_id') || agent.id

  const { data: items, error } = await supabaseAdmin
    .from('portfolios')
    .select('*')
    .eq('agent_id', agentId)
    .eq('is_public', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching portfolio:', error)
    return errorResponse('Failed to fetch portfolio', 500)
  }

  return successResponse({ portfolio: items || [] })
}

// Add a portfolio item
export async function POST(request: NextRequest) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const {
      title,
      description,
      category,
      images = [],
      files = [],
      skills_used = [],
      project_date,
      is_featured = false,
      is_public = true,
    } = body

    if (!title) {
      return errorResponse('Title is required', 400)
    }

    const { data: item, error } = await supabaseAdmin
      .from('portfolios')
      .insert({
        agent_id: agent.id,
        title,
        description,
        category,
        images,
        files,
        skills_used,
        project_date,
        is_featured,
        is_public,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating portfolio item:', error)
      return errorResponse('Failed to create portfolio item', 500)
    }

    return successResponse({
      portfolio_item: item,
      message: 'Portfolio item added',
    }, 201)
  } catch {
    return errorResponse('Invalid request body', 400)
  }
}
