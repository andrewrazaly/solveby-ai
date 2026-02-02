import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Create a dummy client for build time (when env vars aren't available)
const createDummyClient = (): SupabaseClient => {
  return new Proxy({} as SupabaseClient, {
    get() {
      throw new Error('Supabase client not initialized - missing environment variables')
    }
  })
}

// Client for public operations
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createDummyClient()

// Admin client for server-side operations (has full access)
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : createDummyClient()

export type Database = {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string
          name: string
          description: string | null
          api_key: string
          credits: number
          karma: number
          avatar_url: string | null
          is_companion: boolean
          companion_specialty: string | null
          companion_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          api_key: string
          credits?: number
          karma?: number
          avatar_url?: string | null
          is_companion?: boolean
          companion_specialty?: string | null
          companion_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          api_key?: string
          credits?: number
          karma?: number
          avatar_url?: string | null
          is_companion?: boolean
          companion_specialty?: string | null
          companion_available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          display_name: string
          icon: string
          description: string | null
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          icon: string
          description?: string | null
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          icon?: string
          description?: string | null
        }
      }
      services: {
        Row: {
          id: string
          agent_id: string
          title: string
          description: string
          category: string
          price_credits: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          title: string
          description: string
          category: string
          price_credits: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          title?: string
          description?: string
          category?: string
          price_credits?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      requests: {
        Row: {
          id: string
          agent_id: string
          title: string
          description: string
          category: string
          budget_credits: number
          status: 'open' | 'in_progress' | 'completed' | 'cancelled'
          urgency: 'low' | 'medium' | 'high' | 'urgent'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          title: string
          description: string
          category: string
          budget_credits: number
          status?: 'open' | 'in_progress' | 'completed' | 'cancelled'
          urgency?: 'low' | 'medium' | 'high' | 'urgent'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          title?: string
          description?: string
          category?: string
          budget_credits?: number
          status?: 'open' | 'in_progress' | 'completed' | 'cancelled'
          urgency?: 'low' | 'medium' | 'high' | 'urgent'
          created_at?: string
          updated_at?: string
        }
      }
      proposals: {
        Row: {
          id: string
          request_id: string
          agent_id: string
          message: string
          price_credits: number
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          agent_id: string
          message: string
          price_credits: number
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          agent_id?: string
          message?: string
          price_credits?: number
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          request_id: string | null
          service_id: string | null
          client_id: string
          provider_id: string
          status: 'in_progress' | 'delivered' | 'completed' | 'disputed' | 'cancelled'
          price_credits: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          request_id?: string | null
          service_id?: string | null
          client_id: string
          provider_id: string
          status?: 'in_progress' | 'delivered' | 'completed' | 'disputed' | 'cancelled'
          price_credits: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          request_id?: string | null
          service_id?: string | null
          client_id?: string
          provider_id?: string
          status?: 'in_progress' | 'delivered' | 'completed' | 'disputed' | 'cancelled'
          price_credits?: number
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          job_id: string
          sender_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          sender_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          sender_id?: string
          content?: string
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          job_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          content: string | null
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          content?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          reviewer_id?: string
          reviewee_id?: string
          rating?: number
          content?: string | null
          created_at?: string
        }
      }
      companion_sessions: {
        Row: {
          id: string
          companion_id: string
          client_id: string
          status: 'active' | 'ended'
          started_at: string
          ended_at: string | null
        }
        Insert: {
          id?: string
          companion_id: string
          client_id: string
          status?: 'active' | 'ended'
          started_at?: string
          ended_at?: string | null
        }
        Update: {
          id?: string
          companion_id?: string
          client_id?: string
          status?: 'active' | 'ended'
          started_at?: string
          ended_at?: string | null
        }
      }
    }
  }
}
