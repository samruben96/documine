-- Migration: fix_reporting_schema
-- Story 23.2: Data Analysis Pipeline - Fix schema issues found in code review
-- Date: 2025-12-10
--
-- Fixes:
-- 1. Add missing column_count column
-- 2. Update status check constraint to include 'ready' status

-- Add column_count column (referenced in analyze route but was missing)
ALTER TABLE commission_data_sources
ADD COLUMN IF NOT EXISTS column_count INTEGER;

-- Drop existing status check constraint and recreate with 'ready' included
ALTER TABLE commission_data_sources
DROP CONSTRAINT IF EXISTS commission_data_sources_status_check;

ALTER TABLE commission_data_sources
ADD CONSTRAINT commission_data_sources_status_check
CHECK (status = ANY (ARRAY['pending'::text, 'ready'::text, 'mapping'::text, 'confirmed'::text, 'imported'::text, 'failed'::text]));

-- Add comment for clarity
COMMENT ON COLUMN commission_data_sources.column_count IS 'Number of columns detected in parsed data (Story 23.2)';
COMMENT ON COLUMN commission_data_sources.status IS 'Status flow: pending → ready → mapping → confirmed → imported (or failed at any stage)';
