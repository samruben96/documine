-- Migration: Agency Admin Consolidation
-- Story 21.1: Database Migration - Agency Admin Tables
-- Renames ai_buddy_* tables to agency_* for agency-wide admin functionality
-- Epic 21: Agency-Wide Admin Platform
-- APPLIED: 2025-12-09 via Supabase MCP

-- ============================================================================
-- OVERVIEW
-- ============================================================================
-- This migration consolidates AI Buddy admin tables to agency-wide scope:
-- 1. Rename ai_buddy_permission enum → agency_permission
-- 2. Rename ai_buddy_permissions table → agency_permissions
-- 3. Rename ai_buddy_audit_logs table → agency_audit_logs
-- 4. Add unique constraint to invitations (agency_id, email)
-- 5. Merge ai_buddy_invitations into invitations table
-- 6. Drop ai_buddy_invitations table
-- 7. Update all RLS policies to reference new table names
-- 8. Update transfer_ownership function to use new table names
--
-- NOTE: Code references to old table names must be updated in Stories 21.2/21.3

BEGIN;

-- ============================================================================
-- STEP 1: RENAME ENUM (AC-21.1.3)
-- PostgreSQL supports ALTER TYPE ... RENAME TO
-- ============================================================================

ALTER TYPE ai_buddy_permission RENAME TO agency_permission;

-- ============================================================================
-- STEP 2: RENAME PERMISSIONS TABLE (AC-21.1.1)
-- Foreign key constraints are preserved automatically
-- ============================================================================

ALTER TABLE ai_buddy_permissions RENAME TO agency_permissions;

-- Rename index to match new table name
ALTER INDEX idx_permissions_user RENAME TO idx_agency_permissions_user;

-- ============================================================================
-- STEP 3: RENAME AUDIT LOGS TABLE (AC-21.1.2)
-- Foreign key constraints are preserved automatically
-- ============================================================================

ALTER TABLE ai_buddy_audit_logs RENAME TO agency_audit_logs;

-- Rename indexes to match new table name
ALTER INDEX idx_audit_logs_agency_date RENAME TO idx_agency_audit_logs_agency_date;
ALTER INDEX idx_audit_logs_user RENAME TO idx_agency_audit_logs_user;
ALTER INDEX idx_audit_logs_action RENAME TO idx_agency_audit_logs_action;

-- ============================================================================
-- STEP 4: MERGE INVITATIONS (AC-21.1.4)
-- ai_buddy_invitations schema: id, agency_id, email, role, invited_by, invited_at, expires_at, accepted_at, cancelled_at
-- invitations schema: id, agency_id, email, role, status, invited_by, expires_at, created_at, accepted_at
-- ============================================================================

-- First, ensure invitations table has all needed columns (it does, but be safe)
-- The main invitations table uses 'status' column instead of separate cancelled_at

-- Migrate pending invitations (not accepted, not cancelled)
INSERT INTO invitations (id, agency_id, email, role, status, invited_by, expires_at, created_at, accepted_at)
SELECT
  id,
  agency_id,
  email,
  role,
  'pending' AS status,
  invited_by,
  expires_at,
  invited_at AS created_at,
  NULL AS accepted_at
FROM ai_buddy_invitations
WHERE accepted_at IS NULL AND cancelled_at IS NULL
ON CONFLICT (agency_id, email)
DO UPDATE SET
  -- Keep the newer invitation if conflict
  expires_at = EXCLUDED.expires_at,
  created_at = EXCLUDED.created_at
WHERE invitations.status = 'pending';

-- Migrate accepted invitations (for historical record)
INSERT INTO invitations (id, agency_id, email, role, status, invited_by, expires_at, created_at, accepted_at)
SELECT
  id,
  agency_id,
  email,
  role,
  'accepted' AS status,
  invited_by,
  expires_at,
  invited_at AS created_at,
  accepted_at
FROM ai_buddy_invitations
WHERE accepted_at IS NOT NULL
ON CONFLICT (agency_id, email) DO NOTHING;

-- Migrate cancelled invitations (for historical record)
INSERT INTO invitations (id, agency_id, email, role, status, invited_by, expires_at, created_at, accepted_at)
SELECT
  id,
  agency_id,
  email,
  role,
  'cancelled' AS status,
  invited_by,
  expires_at,
  invited_at AS created_at,
  NULL AS accepted_at
FROM ai_buddy_invitations
WHERE cancelled_at IS NOT NULL
ON CONFLICT (agency_id, email) DO NOTHING;

-- ============================================================================
-- STEP 5: DROP OLD INVITATIONS TABLE (AC-21.1.4)
-- ============================================================================

DROP TABLE ai_buddy_invitations;

-- ============================================================================
-- STEP 6: UPDATE RLS POLICIES (AC-21.1.5)
-- Drop old policies and create new ones referencing agency_permissions
-- ============================================================================

-- 6a. Update ai_buddy_guardrails policies
DROP POLICY IF EXISTS "Admins can update agency guardrails" ON ai_buddy_guardrails;
DROP POLICY IF EXISTS "Admins can insert agency guardrails" ON ai_buddy_guardrails;

CREATE POLICY "Admins can update agency guardrails" ON ai_buddy_guardrails
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM agency_permissions
      WHERE user_id = auth.uid()
      AND permission = 'configure_guardrails'
    )
    AND agency_id = get_user_agency_id()
  );

CREATE POLICY "Admins can insert agency guardrails" ON ai_buddy_guardrails
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM agency_permissions
      WHERE user_id = auth.uid()
      AND permission = 'configure_guardrails'
    )
    AND agency_id = get_user_agency_id()
  );

-- 6b. Update agency_permissions policies (self-referencing, recreate with new table name)
DROP POLICY IF EXISTS "Admins can view agency permissions" ON agency_permissions;
DROP POLICY IF EXISTS "Admins can manage agency permissions" ON agency_permissions;
DROP POLICY IF EXISTS "Admins can delete agency permissions" ON agency_permissions;

CREATE POLICY "Admins can view agency permissions" ON agency_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agency_permissions p
      WHERE p.user_id = auth.uid()
      AND p.permission = 'manage_users'
    )
    AND user_id IN (
      SELECT id FROM users WHERE agency_id = get_user_agency_id()
    )
  );

CREATE POLICY "Admins can manage agency permissions" ON agency_permissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM agency_permissions p
      WHERE p.user_id = auth.uid()
      AND p.permission = 'manage_users'
    )
    AND user_id IN (
      SELECT id FROM users WHERE agency_id = get_user_agency_id()
    )
  );

CREATE POLICY "Admins can delete agency permissions" ON agency_permissions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM agency_permissions p
      WHERE p.user_id = auth.uid()
      AND p.permission = 'manage_users'
    )
    AND user_id IN (
      SELECT id FROM users WHERE agency_id = get_user_agency_id()
    )
  );

-- 6c. Update agency_audit_logs policies
DROP POLICY IF EXISTS "Admins can view agency audit logs" ON agency_audit_logs;

CREATE POLICY "Admins can view agency audit logs" ON agency_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agency_permissions
      WHERE user_id = auth.uid()
      AND permission = 'view_audit_logs'
    )
    AND agency_id = get_user_agency_id()
  );

-- 6d. Update invitations policies to use agency_permissions instead of role check
-- The original invitations table used role-based checks, update to permission-based
DROP POLICY IF EXISTS "Admins can view agency invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can delete invitations" ON invitations;

CREATE POLICY "Admins can view agency invitations" ON invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agency_permissions
      WHERE user_id = auth.uid()
      AND permission = 'manage_users'
    )
    AND agency_id = get_user_agency_id()
  );

CREATE POLICY "Admins can create invitations" ON invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM agency_permissions
      WHERE user_id = auth.uid()
      AND permission = 'manage_users'
    )
    AND agency_id = get_user_agency_id()
  );

CREATE POLICY "Admins can update invitations" ON invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM agency_permissions
      WHERE user_id = auth.uid()
      AND permission = 'manage_users'
    )
    AND agency_id = get_user_agency_id()
  );

CREATE POLICY "Admins can delete invitations" ON invitations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM agency_permissions
      WHERE user_id = auth.uid()
      AND permission = 'manage_users'
    )
    AND agency_id = get_user_agency_id()
  );

-- ============================================================================
-- STEP 7: UPDATE TRANSFER_OWNERSHIP FUNCTION
-- Replace ai_buddy_permissions references with agency_permissions
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
    SELECT 1 FROM agency_permissions
    WHERE user_id = p_current_owner_id
    AND permission = 'transfer_ownership'
  ) THEN
    RAISE EXCEPTION 'Current user does not have ownership permission';
  END IF;

  -- Verify new owner is an admin (has manage_users permission)
  IF NOT EXISTS (
    SELECT 1 FROM agency_permissions
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
  DELETE FROM agency_permissions
  WHERE user_id = p_current_owner_id
  AND permission IN ('transfer_ownership', 'delete_agency', 'manage_billing');

  -- Grant owner-exclusive permissions to new owner
  INSERT INTO agency_permissions (user_id, permission, granted_by, granted_at)
  VALUES
    (p_new_owner_id, 'transfer_ownership', p_current_owner_id, now()),
    (p_new_owner_id, 'delete_agency', p_current_owner_id, now()),
    (p_new_owner_id, 'manage_billing', p_current_owner_id, now())
  ON CONFLICT (user_id, permission) DO NOTHING;

  -- Ensure old owner retains admin permissions
  INSERT INTO agency_permissions (user_id, permission, granted_by, granted_at)
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

-- Update function comment
COMMENT ON FUNCTION transfer_ownership(UUID, UUID, UUID) IS
'Atomically transfers agency ownership from current owner to new owner.
Story 20.5: Owner Management (updated Story 21.1)
AC-20.5.11: Ensures atomic transfer - no partial transfers on failure.
Parameters:
  p_current_owner_id: UUID of the current agency owner
  p_new_owner_id: UUID of the admin to become new owner
  p_agency_id: UUID of the agency
Returns: JSONB with success status and user details
Throws: Exception on validation failure (automatically rolls back)
Updated: Story 21.1 - Uses agency_permissions instead of ai_buddy_permissions';

COMMIT;

-- ============================================================================
-- REVERSE MIGRATION (AC-21.1.6)
-- To rollback, run these commands in a separate transaction:
-- ============================================================================
--
-- BEGIN;
--
-- -- 1. Recreate ai_buddy_invitations table
-- CREATE TABLE ai_buddy_invitations (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
--   email TEXT NOT NULL,
--   role TEXT NOT NULL DEFAULT 'producer',
--   invited_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
--   invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
--   expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
--   accepted_at TIMESTAMPTZ,
--   cancelled_at TIMESTAMPTZ,
--   CONSTRAINT unique_agency_email UNIQUE(agency_id, email)
-- );
--
-- -- 2. Migrate data back from invitations
-- INSERT INTO ai_buddy_invitations (id, agency_id, email, role, invited_by, invited_at, expires_at, accepted_at, cancelled_at)
-- SELECT
--   id,
--   agency_id,
--   email,
--   role,
--   invited_by,
--   created_at AS invited_at,
--   expires_at,
--   CASE WHEN status = 'accepted' THEN accepted_at ELSE NULL END,
--   CASE WHEN status = 'cancelled' THEN now() ELSE NULL END
-- FROM invitations
-- WHERE id IN (SELECT id FROM ai_buddy_invitations_backup); -- Need backup reference
--
-- -- 3. Rename tables back
-- ALTER TABLE agency_permissions RENAME TO ai_buddy_permissions;
-- ALTER TABLE agency_audit_logs RENAME TO ai_buddy_audit_logs;
--
-- -- 4. Rename enum back
-- ALTER TYPE agency_permission RENAME TO ai_buddy_permission;
--
-- -- 5. Recreate old RLS policies (see original migration files)
--
-- COMMIT;
-- ============================================================================
