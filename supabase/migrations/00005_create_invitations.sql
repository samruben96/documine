-- Migration: Create Invitations Table
-- Story 3.2: Invite Users to Agency
-- Tracks pending, accepted, and cancelled invitations for agency team management

-- ============================================================================
-- INVITATIONS TABLE
-- ============================================================================
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin' | 'member'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'cancelled' | 'expired'
  invited_by UUID NOT NULL REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ
);

-- Indexes for efficient querying
CREATE INDEX idx_invitations_agency ON invitations(agency_id);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_status ON invitations(status) WHERE status = 'pending';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Admins can view all invitations for their agency
CREATE POLICY "Admins can view agency invitations" ON invitations
  FOR SELECT USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Admins can create invitations for their agency
CREATE POLICY "Admins can create invitations" ON invitations
  FOR INSERT WITH CHECK (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Admins can update invitations for their agency (resend, cancel)
CREATE POLICY "Admins can update invitations" ON invitations
  FOR UPDATE USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Admins can delete invitations for their agency
CREATE POLICY "Admins can delete invitations" ON invitations
  FOR DELETE USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
