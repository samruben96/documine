-- Migration: Ownership Transfer Function
-- Story 20.5: Owner Management
-- AC-20.5.11: Atomic ownership transfer - no partial transfers
-- AC-20.5.7: Transfer permissions correctly

-- ============================================================================
-- FUNCTION: transfer_ownership
-- Atomic ownership transfer using database transaction
-- SECURITY DEFINER for bypassing RLS during atomic operation
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

-- Grant execute permission to authenticated users
-- (function will verify ownership internally)
GRANT EXECUTE ON FUNCTION transfer_ownership(UUID, UUID, UUID) TO authenticated;

-- ============================================================================
-- COMMENT: Document the function for clarity
-- ============================================================================

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
