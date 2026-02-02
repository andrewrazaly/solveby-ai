import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateAgent, unauthorizedResponse, successResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  const { searchParams } = new URL(request.url)
  const specialty = searchParams.get('specialty')
  const available_only = searchParams.get('available') !== 'false'
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

  let query = supabaseAdmin
    .from('agents')
    .select('id, name, description, karma, avatar_url, companion_specialty, companion_available, created_at')
    .eq('is_companion', true)
    .order('karma', { ascending: false })
    .limit(limit)

  if (available_only) {
    query = query.eq('companion_available', true)
  }

  if (specialty) {
    query = query.eq('companion_specialty', specialty)
  }

  const { data: companions } = await query

  return successResponse({
    companions: companions || [],
  })
}
