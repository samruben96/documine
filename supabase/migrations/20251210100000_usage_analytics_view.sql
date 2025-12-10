-- Story 20.3: Usage Analytics Dashboard
-- Creates materialized view for aggregated usage metrics
-- AC-20.3.7: Performance target <500ms

-- =============================================================================
-- MATERIALIZED VIEW: ai_buddy_usage_daily
-- Aggregates daily usage metrics for efficient analytics queries
-- =============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS ai_buddy_usage_daily AS
SELECT
  c.agency_id,
  DATE(c.created_at) as date,
  COUNT(DISTINCT c.user_id) as active_users,
  COUNT(DISTINCT c.id) as conversations,
  COALESCE(SUM(msg.message_count), 0)::bigint as total_messages,
  COALESCE(SUM(docs.document_count), 0)::bigint as documents_uploaded
FROM ai_buddy_conversations c
LEFT JOIN (
  SELECT
    conversation_id,
    COUNT(*) as message_count
  FROM ai_buddy_messages
  WHERE role != 'system'
  GROUP BY conversation_id
) msg ON c.id = msg.conversation_id
LEFT JOIN (
  SELECT
    cd.conversation_id,
    COUNT(DISTINCT cd.document_id) as document_count
  FROM ai_buddy_conversation_documents cd
  GROUP BY cd.conversation_id
) docs ON c.id = docs.conversation_id
WHERE c.deleted_at IS NULL
GROUP BY c.agency_id, DATE(c.created_at);

-- =============================================================================
-- INDEXES for efficient date range queries
-- =============================================================================

-- Primary index for agency + date range lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_buddy_usage_daily_agency_date
ON ai_buddy_usage_daily (agency_id, date DESC);

-- Index for date range only (when filtering across agencies, admin use)
CREATE INDEX IF NOT EXISTS idx_ai_buddy_usage_daily_date
ON ai_buddy_usage_daily (date DESC);

-- =============================================================================
-- REFRESH FUNCTION
-- Call manually or via cron job to update the materialized view
-- =============================================================================

CREATE OR REPLACE FUNCTION refresh_ai_buddy_usage_daily()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY ai_buddy_usage_daily;
END;
$$;

-- Grant execute permission to authenticated users (they can only see their agency's data via RLS)
GRANT EXECUTE ON FUNCTION refresh_ai_buddy_usage_daily() TO authenticated;

-- =============================================================================
-- USER-LEVEL AGGREGATION VIEW
-- For per-user breakdown in the analytics dashboard (AC-20.3.2)
-- =============================================================================

CREATE OR REPLACE VIEW ai_buddy_usage_by_user AS
SELECT
  c.agency_id,
  c.user_id,
  u.email as user_email,
  u.full_name as user_name,
  DATE(c.created_at) as date,
  COUNT(DISTINCT c.id) as conversations,
  COALESCE(SUM(msg.message_count), 0)::bigint as messages,
  COALESCE(SUM(docs.document_count), 0)::bigint as documents,
  MAX(c.updated_at) as last_active_at
FROM ai_buddy_conversations c
JOIN users u ON c.user_id = u.id
LEFT JOIN (
  SELECT
    conversation_id,
    COUNT(*) as message_count
  FROM ai_buddy_messages
  WHERE role != 'system'
  GROUP BY conversation_id
) msg ON c.id = msg.conversation_id
LEFT JOIN (
  SELECT
    cd.conversation_id,
    COUNT(DISTINCT cd.document_id) as document_count
  FROM ai_buddy_conversation_documents cd
  GROUP BY cd.conversation_id
) docs ON c.id = docs.conversation_id
WHERE c.deleted_at IS NULL
  AND u.removed_at IS NULL
GROUP BY c.agency_id, c.user_id, u.email, u.full_name, DATE(c.created_at);

-- =============================================================================
-- COMMENTS (Documentation)
-- =============================================================================

COMMENT ON MATERIALIZED VIEW ai_buddy_usage_daily IS
'Story 20.3: Aggregated daily AI Buddy usage metrics per agency. Refresh manually or via cron.';

COMMENT ON FUNCTION refresh_ai_buddy_usage_daily() IS
'Story 20.3: Refreshes the ai_buddy_usage_daily materialized view. Call periodically to update analytics.';

COMMENT ON VIEW ai_buddy_usage_by_user IS
'Story 20.3: Per-user usage breakdown for analytics dashboard. Real-time view (not materialized).';
