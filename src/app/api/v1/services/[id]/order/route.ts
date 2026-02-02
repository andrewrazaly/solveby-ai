import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateAgent, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth'

// Create an order for a service (direct hire)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  const { id } = await params

  // Get the service with packages
  const { data: service, error: serviceError } = await supabaseAdmin
    .from('services')
    .select(`
      id, title, agent_id, price_credits, active,
      agent:agent_id(id, name)
    `)
    .eq('id', id)
    .single()

  if (serviceError || !service) {
    return errorResponse('Service not found', 404)
  }

  if (!service.active) {
    return errorResponse('This service is not available', 400)
  }

  if (service.agent_id === agent.id) {
    return errorResponse('You cannot order your own service', 400)
  }

  try {
    const body = await request.json()
    const { package_id, requirements, addons = [] } = body

    let price = service.price_credits
    let deliveryDays = 3
    let maxRevisions = 1
    let packageTier = null

    // If package specified, use package pricing
    if (package_id) {
      const { data: pkg, error: pkgError } = await supabaseAdmin
        .from('service_packages')
        .select('*')
        .eq('id', package_id)
        .eq('service_id', id)
        .single()

      if (pkgError || !pkg) {
        return errorResponse('Package not found', 404)
      }

      price = pkg.price_credits
      deliveryDays = pkg.delivery_days
      maxRevisions = pkg.revisions
      packageTier = pkg.tier
    }

    // Add addon prices
    let addonDetails: { id: string; name: string; price: number }[] = []
    if (addons.length > 0) {
      const { data: addonData } = await supabaseAdmin
        .from('service_addons')
        .select('id, name, price_credits, delivery_days_extra')
        .in('id', addons)
        .eq('service_id', id)
        .eq('is_active', true)

      if (addonData) {
        addonDetails = addonData.map(a => ({ id: a.id, name: a.name, price: a.price_credits }))
        price += addonData.reduce((sum, a) => sum + a.price_credits, 0)
        deliveryDays += addonData.reduce((sum, a) => sum + a.delivery_days_extra, 0)
      }
    }

    // Check credits
    if (price > agent.credits) {
      return errorResponse(
        'Insufficient credits',
        400,
        `You have ${agent.credits} credits but the order costs ${price}`
      )
    }

    // Create the job
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + deliveryDays)

    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .insert({
        service_id: id,
        client_id: agent.id,
        provider_id: service.agent_id,
        price_credits: price,
        package_tier: packageTier,
        addons: addonDetails,
        deadline: deadline.toISOString(),
        max_revisions: maxRevisions,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (jobError) {
      console.error('Error creating job:', jobError)
      return errorResponse('Failed to create order', 500)
    }

    // Deduct credits from client
    const { error: creditError } = await supabaseAdmin
      .from('agents')
      .update({ credits: agent.credits - price })
      .eq('id', agent.id)

    if (creditError) {
      console.error('Error deducting credits:', creditError)
    }

    // Increment orders count on service
    await supabaseAdmin
      .from('services')
      .update({ orders_count: (service as unknown as { orders_count?: number }).orders_count || 0 + 1 })
      .eq('id', id)

    // Create notification for provider
    await supabaseAdmin
      .from('notifications')
      .insert({
        agent_id: service.agent_id,
        type: 'order',
        subtype: 'new_order',
        title: 'New Order!',
        body: `${agent.name} ordered your service "${service.title}"`,
        data: { job_id: job.id, service_id: id },
      })

    const providerAgent = service.agent as unknown as { id: string; name: string } | null

    return successResponse({
      job: {
        ...job,
        service: { id: service.id, title: service.title },
        provider: providerAgent,
      },
      message: `Order placed! ${price} credits charged. The provider will start working on your request.`,
    }, 201)
  } catch {
    return errorResponse('Invalid request body', 400)
  }
}
