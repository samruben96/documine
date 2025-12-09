-- Migration: AI Buddy Conversation Documents
-- Story 17.1: Document Upload to Conversation with Status
-- Creates junction table linking conversations to documents for inline attachments

-- ============================================================================
-- TABLE: ai_buddy_conversation_documents (Story 17.1)
-- Conversation-level document attachments (temporary context per conversation)
-- ============================================================================

CREATE TABLE ai_buddy_conversation_documents (
  conversation_id UUID NOT NULL REFERENCES ai_buddy_conversations(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  attached_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, document_id)
);

-- Indexes for efficient lookups
CREATE INDEX idx_conv_docs_conversation ON ai_buddy_conversation_documents(conversation_id);
CREATE INDEX idx_conv_docs_document ON ai_buddy_conversation_documents(document_id);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE ai_buddy_conversation_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: ai_buddy_conversation_documents
-- Users can manage attachments in their own conversations
-- ============================================================================

-- SELECT: Users can view attachments in their own conversations
CREATE POLICY "Users can view own conversation attachments" ON ai_buddy_conversation_documents
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM ai_buddy_conversations WHERE user_id = auth.uid()
    )
  );

-- INSERT: Users can attach documents to their own conversations
CREATE POLICY "Users can insert own conversation attachments" ON ai_buddy_conversation_documents
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM ai_buddy_conversations WHERE user_id = auth.uid()
    )
  );

-- DELETE: Users can remove attachments from their own conversations
CREATE POLICY "Users can delete own conversation attachments" ON ai_buddy_conversation_documents
  FOR DELETE USING (
    conversation_id IN (
      SELECT id FROM ai_buddy_conversations WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- GRANT SERVICE ROLE ACCESS
-- For Edge Functions that need to manage attachments during processing
-- ============================================================================

-- Service role can manage conversation documents (for processing edge functions)
CREATE POLICY "Service can manage conversation attachments" ON ai_buddy_conversation_documents
  FOR ALL USING (auth.role() = 'service_role');
