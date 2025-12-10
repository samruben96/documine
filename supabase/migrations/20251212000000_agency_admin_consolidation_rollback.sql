-- Rollback Migration: Agency Admin Consolidation
-- Story 21.1: Database Migration - Agency Admin Tables (AC-21.1.6)
-- This is the REVERSE of 20251212000000_agency_admin_consolidation.sql
-- Run this to revert the changes if needed

-- ============================================================================
-- WARNING: This rollback assumes you have not added new data to the renamed
-- tables that would be lost. It preserves existing data by reversing the
-- operations in the correct order.
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: RECREATE ai_buddy_invitations TABLE
-- ============================================================================

CREATE TABLE ai_buddy_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'producer',
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  CONSTRAINT ai_buddy_invitations_unique_agency_email UNIQUE(agency_id, email)
);

-- Recreate indexes
CREATE INDEX idx_ai_buddy_invitations_agency ON ai_buddy_invitations(agency_id);
CREATE INDEX idx_ai_buddy_invitations_email ON ai_buddy_invitations(email);
CREATE INDEX idx_ai_buddy_invitations_pending ON ai_buddy_invitations(agency_id, email)
  WHERE accepted_at IS NULL AND cancelled_at IS NULL;

-- Enable RLS
ALTER TABLE ai_buddy_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: MIGRATE INVITATIONS DATA BACK
-- Only migrate invitations that were originally from ai_buddy_invitations
-- (those with role = 'producer' or 'admin' which are AI Buddy specific roles)
-- ============================================================================

INSERT INTO ai_buddy_invitations (id, agency_id, email, role, invited_by, invited_at, expires_at, accepted_at, cancelled_at)
SELECT
  id,
  agency_id,
  email,
  role,
  invited_by,
  created_at AS invited_at,
  expires_at,
  CASE WHEN status = 'accepted' THEN accepted_at ELSE NULL END AS accepted_at,
  CASE WHEN status = 'cancelled' THEN created_at ELSE NULL END AS cancelled_at
FROM invitations
WHERE role IN ('producer', 'admin')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 3: RENAME TABLES BACK
-- ============================================================================

ALTER TABLE agency_permissions RENAME TO ai_buddy_permissions;
ALTER TABLE agency_audit_logs RENAME TO ai_buddy_audit_logs;

-- Rename indexes back
ALTER INDEX idx_agency_permissions_user RENAME TO idx_permissions_user;
ALTER INDEX idx_agency_audit_logs_agency_date RENAME TO idx_audit_logs_agency_date;
ALTER INDEX idx_agency_audit_logs_user RENAME TO idx_audit_logs_user;
ALTER INDEX idx_agency_audit_logs_action RENAME TO idx_audit_logs_action;

-- ============================================================================
-- STEP 4: RENAME ENUM BACK
-- ============================================================================

ALTER TYPE agency_permission RENAME TO ai_buddy_permission;

-- ============================================================================
-- STEP 5: RESTORE ORIGINAL RLS POLICIES
-- ============================================================================

-- 5a. Update ai_buddy_guardrails policies back
DROP POLICY IF EXISTS "Admins can update agency guardrails" ON ai_buddy_guardrails;
DROP POLICY IF EXISTS "Admins can insert agency guardrails" ON ai_buddy_guardrails;

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

-- 5b. Restore ai_buddy_permissions policies
DROP POLICY IF EXISTS "Admins can view agency permissions" ON ai_buddy_permissions;
DROP POLICY IF EXISTS "Admins can manage agency permissions" ON ai_buddy_permissions;
DROP POLICY IF EXISTS "Admins can delete agency permissions" ON ai_buddy_permissions;

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

-- 5c. Restore ai_buddy_audit_logs policies
DROP POLICY IF EXISTS "Admins can view agency audit logs" ON ai_buddy_audit_logs;

CREATE POLICY "Admins can view agency audit logs" ON ai_buddy_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ai_buddy_permissions
      WHERE user_id = auth.uid()
      AND permission = 'view_audit_logs'
    )
    AND agency_id = get_user_agency_id()
  );

-- 5d. Restore original invitations policies (role-based)
DROP POLICY IF EXISTS "Admins can view agency invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can delete invitations" ON invitations;

CREATE POLICY "Admins can view agency invitations" ON invitations
  FOR SELECT USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can create invitations" ON invitations
  FOR INSERT WITH CHECK (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update invitations" ON invitations
  FOR UPDATE USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can delete invitations" ON invitations
  FOR DELETE USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- 5e. Restore ai_buddy_invitations RLS policies
CREATE POLICY "Admins can view agency ai_buddy_invitations" ON ai_buddy_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ai_buddy_permissions
      WHERE user_id = auth.uid()
      AND permission = 'manage_users'
    )
    AND agency_id = get_user_agency_id()
  );

CREATE POLICY "Admins can create ai_buddy_invitations" ON ai_buddy_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_buddy_permissions
      WHERE user_id = auth.uid()
      AND permission = 'manage_users'
    )
    AND agency_id = get_user_agency_id()
  );

CREATE POLICY "Admins can update ai_buddy_invitations" ON ai_buddy_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM ai_buddy_permissions
      WHERE user_id = auth.uid()
      AND permission = 'manage_users'
    )
    AND agency_id = get_user_agency_id()
  );

CREATE POLICY "Admins can delete ai_buddy_invitations" ON ai_buddy_invitations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM ai_buddy_permissions
      WHERE user_id = auth.uid()
      AND permission = 'manage_users'
    )
    AND agency_id = get_user_agency_id()
  );

-- ============================================================================
-- STEP 6: RESTORE TRANSFER_OWNERSHIP FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION transfer_ownership(
  p_current_owner_id UUID,
  p_new_owner_id UUID,
  p_agency_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_new_owner_email TEXT;
  v_current_owner_email TEXT;
  v_result JSONB;
BEGIN
  -- Verify current owner has transfer_ownership permission
  IF NOT EXISTS (
    SELECT 1 FROM ai_buddy_permissions
    WHERE user_id = p_current_owner_id
    AND permission = 'transfer_ownership'
  ) THEN
    RAISE EXCEPTION 'Current user does not have ownership permission';
  END IF;

  -- Verify new owner is an admin (has manage_users permission)
  IF NOT EXISTS (
    SELECT 1 FROM ai_buddy_permissions
    WHERE user_id = p_new_owner_id
    AND permission = 'manage_users'
  ) THEN
    RAISE EXCEPTION 'Target user is not an admin';
  END IF;

  -- Verify both users are in the same agency
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = p_current_owner_id
    AND agency_id = p_agency_id
    AND removed_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Current owner not found in agency';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = p_new_owner_id
    AND agency_id = p_agency_id
    AND removed_at IS NULL
  ) THEN
    RAISE EXCEPTION 'New owner not found in agency';
  END IF;

  -- Get email addresses for return value
  SELECT email INTO v_current_owner_email FROM users WHERE id = p_current_owner_id;
  SELECT email INTO v_new_owner_email FROM users WHERE id = p_new_owner_id;

  -- Remove owner-exclusive permissions from current owner
  DELETE FROM ai_buddy_permissions
  WHERE user_id = p_current_owner_id
  AND permission IN ('transfer_ownership', 'delete_agency', 'manage_billing');

  -- Grant owner-exclusive permissions to new owner
  INSERT INTO ai_buddy_permissions (user_id, permission, granted_by, granted_at)
  VALUES
    (p_new_owner_id, 'transfer_ownership', p_current_owner_id, now()),
    (p_new_owner_id, 'delete_agency', p_current_owner_id, now()),
    (p_new_owner_id, 'manage_billing', p_current_owner_id, now())
  ON CONFLICT (user_id, permission) DO NOTHING;

  -- Ensure old owner retains admin permissions
  INSERT INTO ai_buddy_permissions (user_id, permission, granted_by, granted_at)
  VALUES
    (p_current_owner_id, 'use_ai_buddy', p_new_owner_id, now()),
    (p_current_owner_id, 'manage_own_projects', p_new_owner_id, now()),
    (p_current_owner_id, 'manage_users', p_new_owner_id, now()),
    (p_current_owner_id, 'configure_guardrails', p_new_owner_id, now()),
    (p_current_owner_id, 'view_audit_logs', p_new_owner_id, now()),
    (p_current_owner_id, 'view_usage_analytics', p_new_owner_id, now())
  ON CONFLICT (user_id, permission) DO NOTHING;

  -- Build result JSON
  v_result := jsonb_build_object(
    'success', true,
    'previousOwner', jsonb_build_object(
      'id', p_current_owner_id,
      'email', v_current_owner_email
    ),
    'newOwner', jsonb_build_object(
      'id', p_new_owner_id,
      'email', v_new_owner_email
    ),
    'transferredAt', now()
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION transfer_ownership(UUID, UUID, UUID) IS
'Atomically transfers agency ownership from current owner to new owner.
Story 20.5: Owner Management
AC-20.5.11: Ensures atomic transfer - no partial transfers on failure.
Parameters:
  p_current_owner_id: UUID of the current agency owner
  p_new_owner_id: UUID of the admin to become new owner
  p_agency_id: UUID of the agency
Returns: JSONB with success status and user details
Throws: Exception on validation failure (automatically rolls back)';

COMMIT;

-- ============================================================================
-- NOTE: After running this rollback, you should also:
-- 1. Regenerate TypeScript types: npm run generate-types
-- 2. Verify all application code works with ai_buddy_* table names
-- ============================================================================
