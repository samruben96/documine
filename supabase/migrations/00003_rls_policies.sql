-- Migration: Row Level Security Policies
-- Per Architecture ADR-004: RLS is primary mechanism for multi-tenant isolation
-- All tables enforce agency_id matching authenticated user's agency

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTION: Get current user's agency_id
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_agency_id()
RETURNS UUID AS $$
  SELECT agency_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================================
-- AGENCIES POLICIES
-- Users can only see their own agency
-- ============================================================================
CREATE POLICY "Users see own agency" ON agencies
  FOR SELECT
  USING (id = get_user_agency_id());

CREATE POLICY "Users can update own agency" ON agencies
  FOR UPDATE
  USING (id = get_user_agency_id());

-- ============================================================================
-- USERS POLICIES
-- Users can see members of their own agency
-- ============================================================================
CREATE POLICY "Users see agency members" ON users
  FOR SELECT
  USING (agency_id = get_user_agency_id());

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert self" ON users
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- DOCUMENTS POLICIES
-- Full CRUD scoped to agency
-- ============================================================================
CREATE POLICY "Documents scoped to agency - SELECT" ON documents
  FOR SELECT
  USING (agency_id = get_user_agency_id());

CREATE POLICY "Documents scoped to agency - INSERT" ON documents
  FOR INSERT
  WITH CHECK (agency_id = get_user_agency_id());

CREATE POLICY "Documents scoped to agency - UPDATE" ON documents
  FOR UPDATE
  USING (agency_id = get_user_agency_id());

CREATE POLICY "Documents scoped to agency - DELETE" ON documents
  FOR DELETE
  USING (agency_id = get_user_agency_id());

-- ============================================================================
-- DOCUMENT_CHUNKS POLICIES
-- Full CRUD scoped to agency
-- ============================================================================
CREATE POLICY "Chunks scoped to agency - SELECT" ON document_chunks
  FOR SELECT
  USING (agency_id = get_user_agency_id());

CREATE POLICY "Chunks scoped to agency - INSERT" ON document_chunks
  FOR INSERT
  WITH CHECK (agency_id = get_user_agency_id());

CREATE POLICY "Chunks scoped to agency - UPDATE" ON document_chunks
  FOR UPDATE
  USING (agency_id = get_user_agency_id());

CREATE POLICY "Chunks scoped to agency - DELETE" ON document_chunks
  FOR DELETE
  USING (agency_id = get_user_agency_id());

-- ============================================================================
-- CONVERSATIONS POLICIES
-- Full CRUD scoped to agency
-- ============================================================================
CREATE POLICY "Conversations scoped to agency - SELECT" ON conversations
  FOR SELECT
  USING (agency_id = get_user_agency_id());

CREATE POLICY "Conversations scoped to agency - INSERT" ON conversations
  FOR INSERT
  WITH CHECK (agency_id = get_user_agency_id());

CREATE POLICY "Conversations scoped to agency - UPDATE" ON conversations
  FOR UPDATE
  USING (agency_id = get_user_agency_id());

CREATE POLICY "Conversations scoped to agency - DELETE" ON conversations
  FOR DELETE
  USING (agency_id = get_user_agency_id());

-- ============================================================================
-- CHAT_MESSAGES POLICIES
-- Full CRUD scoped to agency
-- ============================================================================
CREATE POLICY "Messages scoped to agency - SELECT" ON chat_messages
  FOR SELECT
  USING (agency_id = get_user_agency_id());

CREATE POLICY "Messages scoped to agency - INSERT" ON chat_messages
  FOR INSERT
  WITH CHECK (agency_id = get_user_agency_id());

CREATE POLICY "Messages scoped to agency - UPDATE" ON chat_messages
  FOR UPDATE
  USING (agency_id = get_user_agency_id());

CREATE POLICY "Messages scoped to agency - DELETE" ON chat_messages
  FOR DELETE
  USING (agency_id = get_user_agency_id());

-- ============================================================================
-- PROCESSING_JOBS POLICIES
-- Service role only - used by Edge Functions for document processing
-- ============================================================================
CREATE POLICY "Jobs service role only - SELECT" ON processing_jobs
  FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Jobs service role only - INSERT" ON processing_jobs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Jobs service role only - UPDATE" ON processing_jobs
  FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Jobs service role only - DELETE" ON processing_jobs
  FOR DELETE
  USING (auth.role() = 'service_role');
