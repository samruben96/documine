-- Migration: AI Buddy Foundation
-- Story 14.1: AI Buddy Database Schema
-- Creates 8 tables, 3 enums, 12 indexes, RLS policies, and seeds rate limits
-- Per Architecture: User-level isolation (user_id = auth.uid()) for projects/conversations

-- ============================================================================
-- ENUMS (AC 14.1.6)
-- ============================================================================

CREATE TYPE ai_buddy_message_role AS ENUM ('user', 'assistant', 'system');
CREATE TYPE ai_buddy_confidence_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE ai_buddy_permission AS ENUM (
  'use_ai_buddy',
  'manage_own_projects',
  'manage_users',
  'configure_guardrails',
  'view_audit_logs'
);

-- ============================================================================
-- TABLE: ai_buddy_projects (AC 14.1.1)
-- User's project containers for organizing documents and conversations
-- ============================================================================

CREATE TABLE ai_buddy_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes (AC 14.1.3)
CREATE INDEX idx_projects_user ON ai_buddy_projects(user_id)
  WHERE archived_at IS NULL;
CREATE INDEX idx_projects_agency ON ai_buddy_projects(agency_id);

-- Trigger for updated_at
CREATE TRIGGER ai_buddy_projects_updated_at
  BEFORE UPDATE ON ai_buddy_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: ai_buddy_project_documents (AC 14.1.1)
-- Junction table linking projects to documents
-- ============================================================================

CREATE TABLE ai_buddy_project_documents (
  project_id UUID NOT NULL REFERENCES ai_buddy_projects(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  attached_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, document_id)
);

-- Index (AC 14.1.3)
CREATE INDEX idx_project_docs_project ON ai_buddy_project_documents(project_id);

-- ============================================================================
-- TABLE: ai_buddy_conversations (AC 14.1.1)
-- Chat conversations, optionally linked to projects
-- ============================================================================

CREATE TABLE ai_buddy_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES ai_buddy_projects(id) ON DELETE SET NULL,
  title VARCHAR(100),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes (AC 14.1.3)
CREATE INDEX idx_conversations_user ON ai_buddy_conversations(user_id)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_conversations_project ON ai_buddy_conversations(project_id);
CREATE INDEX idx_conversations_updated ON ai_buddy_conversations(updated_at DESC);

-- Trigger for updated_at
CREATE TRIGGER ai_buddy_conversations_updated_at
  BEFORE UPDATE ON ai_buddy_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: ai_buddy_messages (AC 14.1.1)
-- Individual messages within conversations
-- ============================================================================

CREATE TABLE ai_buddy_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_buddy_conversations(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  role ai_buddy_message_role NOT NULL,
  content TEXT NOT NULL,
  sources JSONB,  -- Array of {documentId, page, text, startOffset?, endOffset?}
  confidence ai_buddy_confidence_level,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes (AC 14.1.3)
CREATE INDEX idx_messages_conversation ON ai_buddy_messages(conversation_id);
CREATE INDEX idx_messages_content_fts ON ai_buddy_messages
  USING GIN (to_tsvector('english', content));

-- ============================================================================
-- TABLE: ai_buddy_guardrails (AC 14.1.1)
-- Agency-level guardrail configuration
-- ============================================================================

CREATE TABLE ai_buddy_guardrails (
  agency_id UUID PRIMARY KEY REFERENCES agencies(id) ON DELETE CASCADE,
  restricted_topics JSONB DEFAULT '[]'::jsonb,  -- [{trigger: string, redirect: string}]
  custom_rules JSONB DEFAULT '[]'::jsonb,
  eando_disclaimer BOOLEAN DEFAULT true,
  ai_disclosure_message TEXT DEFAULT 'You''re chatting with AI Buddy, an AI assistant. While I strive for accuracy, please verify important information.',
  ai_disclosure_enabled BOOLEAN DEFAULT true,
  restricted_topics_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger for updated_at
CREATE TRIGGER ai_buddy_guardrails_updated_at
  BEFORE UPDATE ON ai_buddy_guardrails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: ai_buddy_permissions (AC 14.1.1)
-- User permissions for AI Buddy features
-- ============================================================================

CREATE TABLE ai_buddy_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission ai_buddy_permission NOT NULL,
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission)
);

-- Index (AC 14.1.3)
CREATE INDEX idx_permissions_user ON ai_buddy_permissions(user_id);

-- ============================================================================
-- TABLE: ai_buddy_audit_logs (AC 14.1.1, 14.1.4)
-- Immutable audit trail - NO UPDATE/DELETE policies
-- ============================================================================

CREATE TABLE ai_buddy_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES ai_buddy_conversations(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,  -- message_sent, guardrail_triggered, conversation_deleted, etc.
  metadata JSONB,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes (AC 14.1.3)
CREATE INDEX idx_audit_logs_agency_date ON ai_buddy_audit_logs(agency_id, logged_at DESC);
CREATE INDEX idx_audit_logs_user ON ai_buddy_audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON ai_buddy_audit_logs(action);

-- ============================================================================
-- TABLE: ai_buddy_rate_limits (AC 14.1.1, 14.1.7)
-- Tier-based rate limiting configuration
-- ============================================================================

CREATE TABLE ai_buddy_rate_limits (
  tier VARCHAR(20) PRIMARY KEY,  -- 'free', 'pro', 'enterprise'
  messages_per_minute INT NOT NULL,
  messages_per_day INT NOT NULL
);

-- Seed default rate limits (AC 14.1.7)
INSERT INTO ai_buddy_rate_limits (tier, messages_per_minute, messages_per_day) VALUES
  ('free', 10, 100),
  ('pro', 30, 500),
  ('enterprise', 60, 2000);

-- ============================================================================
-- ALTER: users table - add ai_buddy_preferences (AC 14.1.5)
-- ============================================================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS ai_buddy_preferences JSONB DEFAULT '{}'::jsonb;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (AC 14.1.2)
-- ============================================================================

ALTER TABLE ai_buddy_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_buddy_project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_buddy_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_buddy_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_buddy_guardrails ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_buddy_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_buddy_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_buddy_rate_limits ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: ai_buddy_projects (AC 14.1.2)
-- User-level isolation: users see only their own projects
-- ============================================================================

CREATE POLICY "Users can view own projects" ON ai_buddy_projects
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own projects" ON ai_buddy_projects
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own projects" ON ai_buddy_projects
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own projects" ON ai_buddy_projects
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: ai_buddy_project_documents (AC 14.1.2)
-- Users can manage documents in their own projects
-- ============================================================================

CREATE POLICY "Users can view own project documents" ON ai_buddy_project_documents
  FOR SELECT USING (
    project_id IN (SELECT id FROM ai_buddy_projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own project documents" ON ai_buddy_project_documents
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM ai_buddy_projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own project documents" ON ai_buddy_project_documents
  FOR DELETE USING (
    project_id IN (SELECT id FROM ai_buddy_projects WHERE user_id = auth.uid())
  );

-- ============================================================================
-- RLS POLICIES: ai_buddy_conversations (AC 14.1.2)
-- User-level isolation: users see only their own non-deleted conversations
-- ============================================================================

CREATE POLICY "Users can view own conversations" ON ai_buddy_conversations
  FOR SELECT USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Users can insert own conversations" ON ai_buddy_conversations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own conversations" ON ai_buddy_conversations
  FOR UPDATE USING (user_id = auth.uid());

-- No DELETE policy - use soft delete via deleted_at

-- ============================================================================
-- RLS POLICIES: ai_buddy_messages (AC 14.1.2)
-- Users can view/insert messages in their own conversations
-- ============================================================================

CREATE POLICY "Users can view messages in own conversations" ON ai_buddy_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM ai_buddy_conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in own conversations" ON ai_buddy_messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM ai_buddy_conversations WHERE user_id = auth.uid()
    )
  );

-- No UPDATE/DELETE policies - messages are immutable

-- ============================================================================
-- RLS POLICIES: ai_buddy_guardrails (AC 14.1.2)
-- All users in agency can view; admins with permission can update
-- ============================================================================

CREATE POLICY "Users can view agency guardrails" ON ai_buddy_guardrails
  FOR SELECT USING (
    agency_id = get_user_agency_id()
  );

CREATE POLICY "Admins can update agency guardrails" ON ai_buddy_guardrails
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM ai_buddy_permissions
      WHERE user_id = auth.uid()
      AND permission = 'configure_guardrails'
    )
    AND agency_id = get_user_agency_id()
  );

CREATE POLICY "Admins can insert agency guardrails" ON ai_buddy_guardrails
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_buddy_permissions
      WHERE user_id = auth.uid()
      AND permission = 'configure_guardrails'
    )
    AND agency_id = get_user_agency_id()
  );

-- ============================================================================
-- RLS POLICIES: ai_buddy_permissions (AC 14.1.2)
-- Users can view own permissions; admins manage all
-- ============================================================================

CREATE POLICY "Users can view own permissions" ON ai_buddy_permissions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view agency permissions" ON ai_buddy_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ai_buddy_permissions p
      WHERE p.user_id = auth.uid()
      AND p.permission = 'manage_users'
    )
    AND user_id IN (
      SELECT id FROM users WHERE agency_id = get_user_agency_id()
    )
  );

CREATE POLICY "Admins can manage agency permissions" ON ai_buddy_permissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_buddy_permissions p
      WHERE p.user_id = auth.uid()
      AND p.permission = 'manage_users'
    )
    AND user_id IN (
      SELECT id FROM users WHERE agency_id = get_user_agency_id()
    )
  );

CREATE POLICY "Admins can delete agency permissions" ON ai_buddy_permissions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM ai_buddy_permissions p
      WHERE p.user_id = auth.uid()
      AND p.permission = 'manage_users'
    )
    AND user_id IN (
      SELECT id FROM users WHERE agency_id = get_user_agency_id()
    )
  );

-- ============================================================================
-- RLS POLICIES: ai_buddy_audit_logs (AC 14.1.2, 14.1.4)
-- INSERT via service role only; SELECT by admins with view_audit_logs permission
-- NO UPDATE/DELETE policies - audit logs are IMMUTABLE
-- ============================================================================

CREATE POLICY "Service can insert audit logs" ON ai_buddy_audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can view agency audit logs" ON ai_buddy_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ai_buddy_permissions
      WHERE user_id = auth.uid()
      AND permission = 'view_audit_logs'
    )
    AND agency_id = get_user_agency_id()
  );

-- EXPLICITLY NO UPDATE OR DELETE POLICIES (AC 14.1.4)
-- Audit logs must remain immutable for compliance

-- ============================================================================
-- RLS POLICIES: ai_buddy_rate_limits (AC 14.1.2)
-- Read-only for all authenticated users
-- ============================================================================

CREATE POLICY "All users can view rate limits" ON ai_buddy_rate_limits
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Rate limits are managed via migrations only - no INSERT/UPDATE/DELETE policies
