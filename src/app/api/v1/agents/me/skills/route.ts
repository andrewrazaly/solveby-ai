import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateAgent, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth'

// Get my skills
export async function GET(request: NextRequest) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  const { data: agentSkills, error } = await supabaseAdmin
    .from('agent_skills')
    .select(`
      id, proficiency_level, verified, tasks_completed, avg_rating, created_at,
      skill:skill_id(id, name, slug, category, description, difficulty_level)
    `)
    .eq('agent_id', agent.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching agent skills:', error)
    return errorResponse('Failed to fetch skills', 500)
  }

  return successResponse({ skills: agentSkills || [] })
}

// Add a skill to my profile
export async function POST(request: NextRequest) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { skill_id, proficiency_level = 'intermediate' } = body

    if (!skill_id) {
      return errorResponse('skill_id is required', 400)
    }

    if (!['beginner', 'intermediate', 'expert', 'master'].includes(proficiency_level)) {
      return errorResponse('Invalid proficiency_level', 400, 'Use: beginner, intermediate, expert, or master')
    }

    // Verify skill exists
    const { data: skill, error: skillError } = await supabaseAdmin
      .from('skills')
      .select('id, name')
      .eq('id', skill_id)
      .single()

    if (skillError || !skill) {
      return errorResponse('Skill not found', 404)
    }

    const { data: agentSkill, error } = await supabaseAdmin
      .from('agent_skills')
      .insert({
        agent_id: agent.id,
        skill_id,
        proficiency_level,
      })
      .select(`
        id, proficiency_level, verified, tasks_completed, created_at,
        skill:skill_id(id, name, slug, category)
      `)
      .single()

    if (error) {
      if (error.code === '23505') {
        return errorResponse('You already have this skill', 400)
      }
      console.error('Error adding skill:', error)
      return errorResponse('Failed to add skill', 500)
    }

    return successResponse({
      skill: agentSkill,
      message: `Added ${skill.name} to your skills`,
    }, 201)
  } catch {
    return errorResponse('Invalid request body', 400)
  }
}

// Remove a skill from my profile
export async function DELETE(request: NextRequest) {
  const agent = await authenticateAgent(request)

  if (!agent) {
    return unauthorizedResponse()
  }

  const { searchParams } = new URL(request.url)
  const skillId = searchParams.get('skill_id')

  if (!skillId) {
    return errorResponse('skill_id query parameter is required', 400)
  }

  const { error } = await supabaseAdmin
    .from('agent_skills')
    .delete()
    .eq('agent_id', agent.id)
    .eq('skill_id', skillId)

  if (error) {
    console.error('Error removing skill:', error)
    return errorResponse('Failed to remove skill', 500)
  }

  return successResponse({ message: 'Skill removed from your profile' })
}
