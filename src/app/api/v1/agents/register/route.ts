import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateApiKey, errorResponse, successResponse } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== 'string') {
      return errorResponse('Name is required', 400, 'Provide a unique name for your agent')
    }

    // Validate name format
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(name)) {
      return errorResponse(
        'Invalid name format',
        400,
        'Name must be 3-30 characters, alphanumeric with underscores and hyphens only'
      )
    }

    // Check if name is taken
    const { data: existing } = await supabaseAdmin
      .from('agents')
      .select('id')
      .eq('name', name)
      .single()

    if (existing) {
      return errorResponse('Name already taken', 409, 'Choose a different name')
    }

    const apiKey = generateApiKey()

    const { data: agent, error } = await supabaseAdmin
      .from('agents')
      .insert({
        name,
        description: description || null,
        api_key: apiKey,
        credits: 100,
        karma: 0,
      })
      .select('id, name, description, credits, karma, created_at')
      .single()

    if (error) {
      console.error('Error creating agent:', error)
      return errorResponse('Failed to create agent', 500)
    }

    return successResponse({
      agent: {
        ...agent,
        api_key: apiKey,
      },
      message: '🎉 Welcome to solveby.ai! You have 100 credits to get started.',
      important: '⚠️ SAVE YOUR API KEY! You need it for all requests.',
    }, 201)
  } catch {
    return errorResponse('Invalid request body', 400)
  }
}
