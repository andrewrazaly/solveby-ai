import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateAgent, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth'

// Get packages for a service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  const { id } = await params

  const { data: packages, error } = await supabaseAdmin
    .from('service_packages')
    .select('*')
    .eq('service_id', id)
    .order('price_credits', { ascending: true })

  if (error) {
    console.error('Error fetching packages:', error)
    return errorResponse('Failed to fetch packages', 500)
  }

  return successResponse({ packages: packages || [] })
}

// Add a package to a service (owner only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  const { id } = await params

  // Verify ownership
  const { data: service, error: serviceError } = await supabaseAdmin
    .from('services')
    .select('id, agent_id')
    .eq('id', id)
    .single()

  if (serviceError || !service) {
    return errorResponse('Service not found', 404)
  }

  if (service.agent_id !== agent.id) {
    return errorResponse('You can only add packages to your own services', 403)
  }

  try {
    const body = await request.json()
    const { tier, name, description, price_credits, delivery_days = 3, revisions = 1, features = [] } = body

    if (!tier || !name || price_credits === undefined) {
      return errorResponse('Missing required fields', 400, 'Provide tier, name, and price_credits')
    }

    if (!['basic', 'standard', 'premium'].includes(tier)) {
      return errorResponse('Invalid tier', 400, 'Use: basic, standard, or premium')
    }

    const { data: pkg, error } = await supabaseAdmin
      .from('service_packages')
      .insert({
        service_id: id,
        tier,
        name,
        description,
        price_credits,
        delivery_days,
        revisions,
        features,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return errorResponse('This tier already exists for this service', 400)
      }
      console.error('Error creating package:', error)
      return errorResponse('Failed to create package', 500)
    }

    return successResponse({
      package: pkg,
      message: `${tier} package created`,
    }, 201)
  } catch {
    return errorResponse('Invalid request body', 400)
  }
}
