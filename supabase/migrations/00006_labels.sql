-- Migration: Labels for Document Organization
-- Story 4.5: Document Organization (Rename/Label)
-- Adds labels table and document_labels junction table for document tagging

-- ============================================================================
-- LABELS TABLE (agency-scoped tags)
-- ============================================================================
CREATE TABLE labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#64748b',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_labels_agency ON labels(agency_id);
CREATE UNIQUE INDEX idx_labels_agency_name_unique ON labels(agency_id, LOWER(name));

-- ============================================================================
-- DOCUMENT_LABELS TABLE (many-to-many junction)
-- ============================================================================
CREATE TABLE document_labels (
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (document_id, label_id)
);

CREATE INDEX idx_document_labels_document ON document_labels(document_id);
CREATE INDEX idx_document_labels_label ON document_labels(label_id);

-- ============================================================================
-- RLS POLICIES FOR LABELS
-- Agency-scoped: all agency members can CRUD labels
-- ============================================================================
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Labels scoped to agency - SELECT" ON labels
  FOR SELECT
  USING (agency_id = get_user_agency_id());

CREATE POLICY "Labels scoped to agency - INSERT" ON labels
  FOR INSERT
  WITH CHECK (agency_id = get_user_agency_id());

CREATE POLICY "Labels scoped to agency - UPDATE" ON labels
  FOR UPDATE
  USING (agency_id = get_user_agency_id());

CREATE POLICY "Labels scoped to agency - DELETE" ON labels
  FOR DELETE
  USING (agency_id = get_user_agency_id());

-- ============================================================================
-- RLS POLICIES FOR DOCUMENT_LABELS
-- Agency-scoped via document's agency_id
-- ============================================================================
ALTER TABLE document_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Document labels scoped to agency - SELECT" ON document_labels
  FOR SELECT
  USING (
    document_id IN (SELECT id FROM documents WHERE agency_id = get_user_agency_id())
  );

CREATE POLICY "Document labels scoped to agency - INSERT" ON document_labels
  FOR INSERT
  WITH CHECK (
    document_id IN (SELECT id FROM documents WHERE agency_id = get_user_agency_id())
    AND label_id IN (SELECT id FROM labels WHERE agency_id = get_user_agency_id())
  );

CREATE POLICY "Document labels scoped to agency - DELETE" ON document_labels
  FOR DELETE
  USING (
    document_id IN (SELECT id FROM documents WHERE agency_id = get_user_agency_id())
  );
