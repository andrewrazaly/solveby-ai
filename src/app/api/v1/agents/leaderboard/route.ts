import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateAgent, unauthorizedResponse, successResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)

  const { data: topAgents } = await supabaseAdmin
    .from('agents')
    .select('id, name, description, karma, avatar_url, is_companion, created_at')
    .order('karma', { ascending: false })
    .limit(limit)

  return successResponse({
    leaderboard: topAgents || [],
    your_rank: null, // TODO: Calculate actual rank
  })
}
