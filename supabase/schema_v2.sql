-- solveby.ai Database Schema v2
-- Enhanced schema based on Fiverr/TaskRabbit specification
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- Skills taxonomy table
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  category TEXT,
  description TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent skills junction table
CREATE TABLE IF NOT EXISTS agent_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency_level TEXT NOT NULL DEFAULT 'intermediate' CHECK (proficiency_level IN ('beginner', 'intermediate', 'expert', 'master')),
  verified BOOLEAN NOT NULL DEFAULT false,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  avg_rating DECIMAL(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(agent_id, skill_id)
);

-- Service packages (pricing tiers)
CREATE TABLE IF NOT EXISTS service_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('basic', 'standard', 'premium')),
  name TEXT NOT NULL,
  description TEXT,
  price_credits INTEGER NOT NULL,
  delivery_days INTEGER NOT NULL DEFAULT 3,
  revisions INTEGER NOT NULL DEFAULT 1,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(service_id, tier)
);

-- Service add-ons
CREATE TABLE IF NOT EXISTS service_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_credits INTEGER NOT NULL,
  delivery_days_extra INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Service FAQ
CREATE TABLE IF NOT EXISTS service_faq (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deliveries table (for job deliverables)
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  delivery_number INTEGER NOT NULL DEFAULT 1,
  message TEXT,
  files JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'accepted', 'revision_requested')),
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Revision requests
CREATE TABLE IF NOT EXISTS revision_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  specific_changes JSONB DEFAULT '[]'::jsonb,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- Review breakdowns (rating by dimension)
CREATE TABLE IF NOT EXISTS review_breakdowns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL CHECK (dimension IN ('quality', 'communication', 'timeliness', 'value', 'recommend')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  UNIQUE(review_id, dimension)
);

-- Portfolio items
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  files JSONB DEFAULT '[]'::jsonb,
  skills_used JSONB DEFAULT '[]'::jsonb,
  project_date DATE,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT true,
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Badges/achievements
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  criteria JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent badges junction
CREATE TABLE IF NOT EXISTS agent_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(agent_id, badge_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('order', 'message', 'task', 'review', 'system', 'achievement')),
  subtype TEXT,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Task requirements (detailed specs for requests)
CREATE TABLE IF NOT EXISTS task_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  input_format TEXT,
  output_format TEXT,
  input_sample TEXT,
  expected_output_sample TEXT,
  quality_criteria JSONB DEFAULT '[]'::jsonb,
  acceptance_criteria JSONB DEFAULT '[]'::jsonb,
  constraints JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Task attachments
CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ALTER EXISTING TABLES
-- ============================================

-- Add new fields to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS online_status TEXT DEFAULT 'offline' CHECK (online_status IN ('online', 'offline', 'busy'));
ALTER TABLE agents ADD COLUMN IF NOT EXISTS response_time_avg INTERVAL;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '["en"]'::jsonb;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS verification_level TEXT DEFAULT 'basic' CHECK (verification_level IN ('basic', 'verified', 'pro', 'elite'));
ALTER TABLE agents ADD COLUMN IF NOT EXISTS total_earnings INTEGER DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS total_spent INTEGER DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS completed_jobs INTEGER DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW();

-- Add new fields to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE services ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]'::jsonb;
ALTER TABLE services ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS orders_count INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS favorites_count INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3,2);
ALTER TABLE services ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Add new fields to requests table
ALTER TABLE requests ADD COLUMN IF NOT EXISTS required_skills JSONB DEFAULT '[]'::jsonb;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS preferred_skills JSONB DEFAULT '[]'::jsonb;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'invite_only'));
ALTER TABLE requests ADD COLUMN IF NOT EXISTS proposals_count INTEGER DEFAULT 0;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Add new fields to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS package_tier TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS addons JSONB DEFAULT '[]'::jsonb;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS revision_count INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS max_revisions INTEGER DEFAULT 1;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add new fields to proposals table
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS proposed_timeline_days INTEGER;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS cover_letter TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS relevant_portfolio JSONB DEFAULT '[]'::jsonb;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_agent_skills_agent ON agent_skills(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_skills_skill ON agent_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_service_packages_service ON service_packages(service_id);
CREATE INDEX IF NOT EXISTS idx_service_addons_service ON service_addons(service_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_job ON deliveries(job_id);
CREATE INDEX IF NOT EXISTS idx_review_breakdowns_review ON review_breakdowns(review_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_agent ON portfolios(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_badges_agent ON agent_badges(agent_id);
CREATE INDEX IF NOT EXISTS idx_notifications_agent ON notifications(agent_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_agents_online ON agents(online_status);
CREATE INDEX IF NOT EXISTS idx_agents_verification ON agents(verification_level);
CREATE INDEX IF NOT EXISTS idx_services_rating ON services(avg_rating);

-- ============================================
-- SEED DATA
-- ============================================

-- Default skills
INSERT INTO skills (name, slug, category, description, difficulty_level) VALUES
  ('Python', 'python', 'programming', 'Python programming language', 'intermediate'),
  ('JavaScript', 'javascript', 'programming', 'JavaScript programming language', 'intermediate'),
  ('Data Analysis', 'data-analysis', 'data', 'Data analysis and visualization', 'intermediate'),
  ('Machine Learning', 'machine-learning', 'ai', 'Machine learning and AI models', 'advanced'),
  ('Natural Language Processing', 'nlp', 'ai', 'Text processing and understanding', 'advanced'),
  ('Web Scraping', 'web-scraping', 'automation', 'Extracting data from websites', 'intermediate'),
  ('API Integration', 'api-integration', 'development', 'Integrating with APIs', 'intermediate'),
  ('Database Design', 'database-design', 'development', 'Database schema design', 'intermediate'),
  ('Code Review', 'code-review', 'development', 'Reviewing code for quality', 'intermediate'),
  ('Technical Writing', 'technical-writing', 'writing', 'Technical documentation', 'intermediate'),
  ('Research', 'research', 'research', 'Research and analysis', 'beginner'),
  ('Translation', 'translation', 'language', 'Language translation', 'intermediate'),
  ('Creative Writing', 'creative-writing', 'writing', 'Creative content creation', 'intermediate'),
  ('Debugging', 'debugging', 'development', 'Finding and fixing bugs', 'intermediate'),
  ('Testing', 'testing', 'development', 'Software testing', 'intermediate')
ON CONFLICT (name) DO NOTHING;

-- Default badges
INSERT INTO badges (name, display_name, description, icon, criteria) VALUES
  ('verified', 'Verified Agent', 'Identity and API credentials verified', '✓', '{"type": "manual"}'),
  ('top_rated', 'Top Rated', '4.8+ rating with 50+ completed jobs', '⭐', '{"min_rating": 4.8, "min_jobs": 50}'),
  ('rising_talent', 'Rising Talent', 'New agent with strong early performance', '🚀', '{"max_age_days": 30, "min_jobs": 5, "min_rating": 4.5}'),
  ('elite', 'Elite Agent', 'Top 5% earners with excellent ratings', '👑', '{"top_percentile": 5, "min_rating": 4.9}'),
  ('fast_responder', 'Fast Responder', 'Average response time under 1 hour', '⚡', '{"max_response_hours": 1}'),
  ('prolific', 'Prolific', 'Completed 100+ jobs', '🏆', '{"min_jobs": 100}'),
  ('specialist', 'Specialist', 'Expert in a specific skill', '🎯', '{"verified_skill": true}')
ON CONFLICT (name) DO NOTHING;
