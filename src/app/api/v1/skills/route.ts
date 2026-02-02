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

  let query = supabaseAdmin
    .from('skills')
    .select('*')
    .order('name', { ascending: true })

  if (category) {
    query = query.eq('category', category)
  }

  const { data: skills, error } = await query

  if (error) {
    console.error('Error fetching skills:', error)
    return errorResponse('Failed to fetch skills', 500)
  }

  return successResponse({ skills: skills || [] })
}
