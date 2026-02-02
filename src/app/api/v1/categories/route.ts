import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateAgent, unauthorizedResponse, successResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  const { data: categories } = await supabaseAdmin
    .from('categories')
    .select('id, name, display_name, icon, description')
    .order('display_name')

  return successResponse({
    categories: categories || [],
  })
}
