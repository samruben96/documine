-- Queue Management Functions
-- Implements AC-4.7.1, AC-4.7.2: FIFO processing with concurrency safety
-- Date: 2025-11-30

-- Function to get next pending job for an agency with SKIP LOCKED
-- This prevents race conditions when multiple workers try to claim jobs
CREATE OR REPLACE FUNCTION get_next_pending_job(p_agency_id UUID)
RETURNS SETOF processing_jobs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT pj.*
  FROM processing_jobs pj
  INNER JOIN documents d ON d.id = pj.document_id
  WHERE d.agency_id = p_agency_id
    AND pj.status = 'pending'
  ORDER BY pj.created_at ASC
  LIMIT 1
  FOR UPDATE OF pj SKIP LOCKED;
END;
$$;

-- Function to check if agency has an active processing job
CREATE OR REPLACE FUNCTION has_active_processing_job(p_agency_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_count
  FROM processing_jobs pj
  INNER JOIN documents d ON d.id = pj.document_id
  WHERE d.agency_id = p_agency_id
    AND pj.status = 'processing';

  RETURN active_count > 0;
END;
$$;

-- Function to get queue position for a document
-- Returns -1 if not in queue, 0 if processing, 1+ for position in queue
CREATE OR REPLACE FUNCTION get_queue_position(p_document_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  job_record RECORD;
  agency_id_val UUID;
  pending_ahead INTEGER;
  has_active BOOLEAN;
BEGIN
  -- Get the latest job for this document
  SELECT pj.*, d.agency_id INTO job_record
  FROM processing_jobs pj
  INNER JOIN documents d ON d.id = pj.document_id
  WHERE pj.document_id = p_document_id
  ORDER BY pj.created_at DESC
  LIMIT 1;

  -- No job found
  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  -- If processing, position is 0
  IF job_record.status = 'processing' THEN
    RETURN 0;
  END IF;

  -- If not pending, not in queue
  IF job_record.status != 'pending' THEN
    RETURN -1;
  END IF;

  agency_id_val := job_record.agency_id;

  -- Count pending jobs ahead (earlier created_at) for same agency
  SELECT COUNT(*) INTO pending_ahead
  FROM processing_jobs pj
  INNER JOIN documents d ON d.id = pj.document_id
  WHERE d.agency_id = agency_id_val
    AND pj.status = 'pending'
    AND pj.created_at < job_record.created_at;

  -- Check if there's an active job
  SELECT has_active_processing_job(agency_id_val) INTO has_active;

  -- Position = pending ahead + 1 if there's an active job being processed
  IF has_active THEN
    RETURN pending_ahead + 1;
  ELSE
    RETURN pending_ahead;
  END IF;
END;
$$;

-- Function to mark stale jobs as failed
-- Implements AC-4.7.5: Jobs processing for >10 minutes are stale
CREATE OR REPLACE FUNCTION mark_stale_jobs_failed()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stale_count INTEGER;
BEGIN
  -- Mark stale processing jobs as failed
  WITH stale_jobs AS (
    UPDATE processing_jobs
    SET
      status = 'failed',
      error_message = 'Processing timed out after 10 minutes',
      completed_at = NOW()
    WHERE status = 'processing'
      AND started_at < NOW() - INTERVAL '10 minutes'
    RETURNING document_id
  )
  SELECT COUNT(*) INTO stale_count FROM stale_jobs;

  -- Also update the associated documents to failed status
  UPDATE documents
  SET status = 'failed', updated_at = NOW()
  WHERE id IN (
    SELECT document_id FROM processing_jobs
    WHERE status = 'failed'
      AND error_message = 'Processing timed out after 10 minutes'
      AND completed_at > NOW() - INTERVAL '1 minute'
  );

  RETURN stale_count;
END;
$$;

-- Grant execute permissions to authenticated and service roles
GRANT EXECUTE ON FUNCTION get_next_pending_job(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_pending_job(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION has_active_processing_job(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_active_processing_job(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION get_queue_position(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_queue_position(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION mark_stale_jobs_failed() TO service_role;

-- Add index for efficient queue queries
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status_created
  ON processing_jobs(status, created_at)
  WHERE status = 'pending';

-- Add index for stale job detection
CREATE INDEX IF NOT EXISTS idx_processing_jobs_processing_started
  ON processing_jobs(started_at)
  WHERE status = 'processing';
