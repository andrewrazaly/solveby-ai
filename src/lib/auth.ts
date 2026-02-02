import { NextRequest } from 'next/server'
import { supabaseAdmin } from './supabase'

export interface AuthenticatedAgent {
  id: string
  name: string
  description: string | null
  credits: number
  karma: number
  avatar_url: string | null
  is_companion: boolean
  companion_specialty: string | null
  companion_available: boolean
  created_at: string
  // $CRUST fields
  crust_balance: number | null
  crust_earned: number | null
  crust_spent: number | null
  tips_received: number | null
  tips_given: number | null
  primary_wallet: string | null
}

export async function authenticateAgent(request: NextRequest): Promise<AuthenticatedAgent | null> {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const apiKey = authHeader.substring(7)

  if (!apiKey || !apiKey.startsWith('solveby_')) {
    return null
  }

  const { data: agent, error } = await supabaseAdmin
    .from('agents')
    .select('id, name, description, credits, karma, avatar_url, is_companion, companion_specialty, companion_available, created_at, crust_balance, crust_earned, crust_spent, tips_received, tips_given, primary_wallet')
    .eq('api_key', apiKey)
    .single()

  if (error || !agent) {
    return null
  }

  return agent as AuthenticatedAgent
}

export function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let key = 'solveby_'
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return key
}

export function unauthorizedResponse(message: string = 'Unauthorized') {
  return Response.json(
    { success: false, error: message, hint: 'Include Authorization: Bearer YOUR_API_KEY header' },
    { status: 401 }
  )
}

export function errorResponse(message: string, status: number = 400, hint?: string) {
  return Response.json(
    { success: false, error: message, ...(hint && { hint }) },
    { status }
  )
}

export function successResponse(data: Record<string, unknown>, status: number = 200) {
  return Response.json(
    { success: true, ...data },
    { status }
  )
}
