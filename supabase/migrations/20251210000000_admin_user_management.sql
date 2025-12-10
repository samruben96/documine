-- Migration: Admin User Management
-- Story 20.2: Admin User Management
-- Adds last_active_at to users, creates ai_buddy_invitations table with RLS
-- AC-20.2.3: Invite new user via email
-- AC-20.2.4: Invitation expiration and display

-- ============================================================================
-- ALTER: users table - add last_active_at for user activity tracking
-- AC-20.2.1: User list shows last active date
-- ============================================================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- Add removed_at for soft delete (AC-20.2.5)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ;

-- Index for active users in agency (excluding removed)
CREATE INDEX IF NOT EXISTS idx_users_agency_active
ON users(agency_id) WHERE removed_at IS NULL;

-- ============================================================================
-- TABLE: ai_buddy_invitations (AC 20.2.3, 20.2.4)
-- Tracks pending invitations for AI Buddy access
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_buddy_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'producer', -- 'producer' | 'admin'
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  CONSTRAINT unique_agency_email UNIQUE(agency_id, email)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_ai_buddy_invitations_agency
ON ai_buddy_invitations(agency_id);

CREATE INDEX IF NOT EXISTS idx_ai_buddy_invitations_email
ON ai_buddy_invitations(email);

-- Partial index for pending invitations (not accepted, not cancelled, not expired)
CREATE INDEX IF NOT EXISTS idx_ai_buddy_invitations_pending
ON ai_buddy_invitations(agency_id, email)
WHERE accepted_at IS NULL AND cancelled_at IS NULL;

-- ============================================================================
-- ROW LEVEL SECURITY for ai_buddy_invitations
-- ============================================================================

ALTER TABLE ai_buddy_invitations ENABLE ROW LEVEL SECURITY;

-- Admins with manage_users permission can view all invitations for their agency
CREATE POLICY "Admins can view agency invitations" ON ai_buddy_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ai_buddy_permissions
      WHERE user_id = auth.uid()
      AND permission = 'manage_users'
    )
    AND agency_id = get_user_agency_id()
  );

-- Admins with manage_users permission can create invitations
CREATE POLICY "Admins can create invitations" ON ai_buddy_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_buddy_permissions
      WHERE user_id = auth.uid()
      AND permission = 'manage_users'
    )
    AND agency_id = get_user_agency_id()
  );

-- Admins with manage_users permission can update invitations (cancel)
CREATE POLICY "Admins can update invitations" ON ai_buddy_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM ai_buddy_permissions
      WHERE user_id = auth.uid()
      AND permission = 'manage_users'
    )
    AND agency_id = get_user_agency_id()
  );

-- Admins with manage_users permission can delete invitations
CREATE POLICY "Admins can delete invitations" ON ai_buddy_invitations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM ai_buddy_permissions
      WHERE user_id = auth.uid()
      AND permission = 'manage_users'
    )
    AND agency_id = get_user_agency_id()
  );

-- ============================================================================
-- Add view_usage_analytics and manage_billing permissions
-- These are needed for full admin/owner functionality (Story 20.2)
-- ============================================================================

-- First, add the new permission values to the enum if they don't exist
DO $$
BEGIN
  -- Check if view_usage_analytics exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'view_usage_analytics'
    AND enumtypid = 'ai_buddy_permission'::regtype
  ) THEN
    ALTER TYPE ai_buddy_permission ADD VALUE 'view_usage_analytics';
  END IF;

  -- Check if manage_billing exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'manage_billing'
    AND enumtypid = 'ai_buddy_permission'::regtype
  ) THEN
    ALTER TYPE ai_buddy_permission ADD VALUE 'manage_billing';
  END IF;

  -- Check if transfer_ownership exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'transfer_ownership'
    AND enumtypid = 'ai_buddy_permission'::regtype
  ) THEN
    ALTER TYPE ai_buddy_permission ADD VALUE 'transfer_ownership';
  END IF;

  -- Check if delete_agency exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'delete_agency'
    AND enumtypid = 'ai_buddy_permission'::regtype
  ) THEN
    ALTER TYPE ai_buddy_permission ADD VALUE 'delete_agency';
  END IF;
END $$;

-- ============================================================================
-- DOWN MIGRATION (for rollback)
-- ============================================================================
-- To rollback:
-- DROP TABLE IF EXISTS ai_buddy_invitations;
-- ALTER TABLE users DROP COLUMN IF EXISTS last_active_at;
-- ALTER TABLE users DROP COLUMN IF EXISTS removed_at;
-- DROP INDEX IF EXISTS idx_users_agency_active;
-- Note: Enum values cannot be easily removed in PostgreSQL
