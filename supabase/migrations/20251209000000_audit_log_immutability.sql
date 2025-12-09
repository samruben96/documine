-- Migration: Audit Log Immutability
-- Story 20.1: Audit Log Infrastructure
-- Epic 20: AI Buddy Admin & Audit
--
-- This migration hardens the existing ai_buddy_audit_logs table for compliance:
-- 1. Creates immutability trigger to prevent ANY modifications (AC-20.1.2)
-- 2. Adds partial index for guardrail metadata filtering (AC-20.1.4)
--
-- RETENTION POLICY (AC-20.1.5):
-- Audit logs MUST be retained for a minimum of 7 years per insurance industry
-- compliance requirements (NAIC model bulletin, E&O protection standards).
-- DO NOT add any automated data deletion or archival to this table without
-- compliance review and legal approval.

-- ============================================================================
-- IMMUTABILITY TRIGGER (AC-20.1.2)
-- Prevents ALL modifications to audit log entries, even by service_role
-- ============================================================================

-- Create the trigger function
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable - modifications not allowed';
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on ai_buddy_audit_logs
-- Fires BEFORE UPDATE OR DELETE to block operations before they happen
CREATE TRIGGER audit_logs_immutable
  BEFORE UPDATE OR DELETE ON ai_buddy_audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- ============================================================================
-- ADDITIONAL INDEX (AC-20.1.4)
-- Partial index for guardrail event filtering in admin dashboard
-- ============================================================================

-- Note: idx_audit_logs_agency_date, idx_audit_logs_user, and idx_audit_logs_action
-- already exist from the foundation migration. Adding only the missing partial index.

CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata_guardrail
  ON ai_buddy_audit_logs((metadata->>'guardrailType'))
  WHERE metadata->>'guardrailType' IS NOT NULL;

-- ============================================================================
-- DOWN MIGRATION (AC-20.1.6)
-- Rollback script that preserves data - ONLY removes trigger and new index
-- Run manually if needed: psql -f down_migration.sql
-- ============================================================================
-- To rollback this migration:
--
-- DROP TRIGGER IF EXISTS audit_logs_immutable ON ai_buddy_audit_logs;
-- DROP FUNCTION IF EXISTS prevent_audit_modification();
-- DROP INDEX IF EXISTS idx_audit_logs_metadata_guardrail;
--
-- Note: This rollback preserves all audit log data. Only the immutability
-- enforcement and performance index are removed.
