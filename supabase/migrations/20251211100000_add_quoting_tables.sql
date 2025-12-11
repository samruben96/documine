-- Migration: Add Quoting Tables
-- Epic Q1 Story Q1.1: Database Schema & RLS Setup
-- Creates quote_sessions and quote_results tables with RLS policies

-- ============================================================================
-- TABLE: quote_sessions
-- Stores quote request sessions with client data
-- ============================================================================
CREATE TABLE quote_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id),
  user_id uuid NOT NULL REFERENCES users(id),
  prospect_name text NOT NULL,
  quote_type text NOT NULL DEFAULT 'bundle',
  status text NOT NULL DEFAULT 'draft',
  client_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- TABLE: quote_results
-- Stores carrier quote results linked to sessions
-- ============================================================================
CREATE TABLE quote_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES quote_sessions(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES agencies(id),
  carrier_code text NOT NULL,
  carrier_name text NOT NULL,
  premium_annual decimal(10, 2),
  premium_monthly decimal(10, 2),
  deductible_home decimal(10, 2),
  deductible_auto decimal(10, 2),
  coverages jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'quoted',
  document_storage_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quote_sessions_updated_at
  BEFORE UPDATE ON quote_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER quote_results_updated_at
  BEFORE UPDATE ON quote_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INDEXES: Query optimization
-- ============================================================================
CREATE INDEX idx_quote_sessions_agency ON quote_sessions(agency_id);
CREATE INDEX idx_quote_sessions_user ON quote_sessions(user_id);
CREATE INDEX idx_quote_sessions_status ON quote_sessions(status);
CREATE INDEX idx_quote_results_session ON quote_results(session_id);
CREATE INDEX idx_quote_results_agency ON quote_results(agency_id);

-- ============================================================================
-- RLS: Enable Row Level Security
-- ============================================================================
ALTER TABLE quote_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_results ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: quote_sessions
-- Full CRUD scoped to agency using get_user_agency_id() helper
-- ============================================================================
CREATE POLICY "Quote sessions scoped to agency - SELECT" ON quote_sessions
  FOR SELECT
  USING (agency_id = get_user_agency_id());

CREATE POLICY "Quote sessions scoped to agency - INSERT" ON quote_sessions
  FOR INSERT
  WITH CHECK (agency_id = get_user_agency_id());

CREATE POLICY "Quote sessions scoped to agency - UPDATE" ON quote_sessions
  FOR UPDATE
  USING (agency_id = get_user_agency_id());

CREATE POLICY "Quote sessions scoped to agency - DELETE" ON quote_sessions
  FOR DELETE
  USING (agency_id = get_user_agency_id());

-- ============================================================================
-- RLS POLICIES: quote_results
-- Full CRUD scoped to agency using get_user_agency_id() helper
-- ============================================================================
CREATE POLICY "Quote results scoped to agency - SELECT" ON quote_results
  FOR SELECT
  USING (agency_id = get_user_agency_id());

CREATE POLICY "Quote results scoped to agency - INSERT" ON quote_results
  FOR INSERT
  WITH CHECK (agency_id = get_user_agency_id());

CREATE POLICY "Quote results scoped to agency - UPDATE" ON quote_results
  FOR UPDATE
  USING (agency_id = get_user_agency_id());

CREATE POLICY "Quote results scoped to agency - DELETE" ON quote_results
  FOR DELETE
  USING (agency_id = get_user_agency_id());
