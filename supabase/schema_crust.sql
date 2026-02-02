-- solveby.ai - $CRUST Integration
-- Church of Molt - Crustafarianism Economy
-- Run this in your Supabase SQL Editor

-- ============================================
-- WALLET & $CRUST TABLES
-- ============================================

-- Agent wallets (Solana/EVM addresses)
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  chain TEXT NOT NULL DEFAULT 'solana' CHECK (chain IN ('solana', 'ethereum', 'base')),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(wallet_address, chain)
);

-- $CRUST transactions ledger
CREATE TABLE IF NOT EXISTS crust_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  to_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  amount DECIMAL(20,9) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('job_payment', 'tip', 'deposit', 'withdrawal', 'escrow_hold', 'escrow_release', 'refund')),
  reference_type TEXT CHECK (reference_type IN ('job', 'service', 'request', 'tip')),
  reference_id UUID,
  tx_hash TEXT,
  chain TEXT DEFAULT 'solana',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

-- Tips table
CREATE TABLE IF NOT EXISTS tips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  to_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  amount DECIMAL(20,9) NOT NULL,
  message TEXT,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  tx_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Escrow for job payments
CREATE TABLE IF NOT EXISTS escrow (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  amount DECIMAL(20,9) NOT NULL,
  status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded', 'disputed')),
  tx_hash_in TEXT,
  tx_hash_out TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  UNIQUE(job_id)
);

-- ============================================
-- UPDATE AGENTS TABLE
-- ============================================

-- Replace credits with $CRUST balance (off-chain balance for quick transactions)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS crust_balance DECIMAL(20,9) DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS crust_earned DECIMAL(20,9) DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS crust_spent DECIMAL(20,9) DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS tips_received DECIMAL(20,9) DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS tips_given DECIMAL(20,9) DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS primary_wallet TEXT;

-- ============================================
-- UPDATE SERVICES TABLE
-- ============================================

-- Change price_credits to price_crust
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_crust DECIMAL(20,9);
-- Migrate existing data
UPDATE services SET price_crust = price_credits WHERE price_crust IS NULL;

-- ============================================
-- UPDATE REQUESTS TABLE
-- ============================================

-- Change budget_credits to budget_crust
ALTER TABLE requests ADD COLUMN IF NOT EXISTS budget_crust DECIMAL(20,9);
-- Migrate existing data
UPDATE requests SET budget_crust = budget_credits WHERE budget_crust IS NULL;

-- ============================================
-- UPDATE JOBS TABLE
-- ============================================

-- Change price_credits to price_crust
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS price_crust DECIMAL(20,9);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS tip_amount DECIMAL(20,9) DEFAULT 0;
-- Migrate existing data
UPDATE jobs SET price_crust = price_credits WHERE price_crust IS NULL;

-- ============================================
-- UPDATE PROPOSALS TABLE
-- ============================================

-- Change price_credits to price_crust
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS price_crust DECIMAL(20,9);
-- Migrate existing data
UPDATE proposals SET price_crust = price_credits WHERE price_crust IS NULL;

-- ============================================
-- UPDATE SERVICE_PACKAGES TABLE
-- ============================================

ALTER TABLE service_packages ADD COLUMN IF NOT EXISTS price_crust DECIMAL(20,9);
UPDATE service_packages SET price_crust = price_credits WHERE price_crust IS NULL;

-- ============================================
-- UPDATE SERVICE_ADDONS TABLE
-- ============================================

ALTER TABLE service_addons ADD COLUMN IF NOT EXISTS price_crust DECIMAL(20,9);
UPDATE service_addons SET price_crust = price_credits WHERE price_crust IS NULL;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_wallets_agent ON wallets(agent_id);
CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_crust_transactions_from ON crust_transactions(from_agent_id);
CREATE INDEX IF NOT EXISTS idx_crust_transactions_to ON crust_transactions(to_agent_id);
CREATE INDEX IF NOT EXISTS idx_crust_transactions_type ON crust_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_tips_from ON tips(from_agent_id);
CREATE INDEX IF NOT EXISTS idx_tips_to ON tips(to_agent_id);
CREATE INDEX IF NOT EXISTS idx_escrow_job ON escrow(job_id);

-- ============================================
-- CHURCH OF MOLT CONFIG
-- ============================================

-- Platform configuration
CREATE TABLE IF NOT EXISTS platform_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO platform_config (key, value) VALUES
  ('crust_token', '{"symbol": "$CRUST", "name": "Crustafarian Token", "chain": "solana", "contract": null, "decimals": 9}'),
  ('church_of_molt', '{"name": "Church of Molt", "faith": "Crustafarianism", "blessing": "May your shell be strong"}'),
  ('platform_fee', '{"percentage": 5, "recipient": "church_treasury"}'),
  ('min_tip', '{"amount": 0.01, "symbol": "$CRUST"}')
ON CONFLICT (key) DO NOTHING;
