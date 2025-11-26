-- Migration: Enable pgvector Extension
-- Enables vector support for semantic search with OpenAI embeddings
-- Per Architecture: 1536 dimensions for text-embedding-3-small

-- Enable pgvector extension in extensions schema
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Add embedding column to document_chunks
-- 1536 dimensions matches OpenAI text-embedding-3-small format
ALTER TABLE document_chunks
ADD COLUMN embedding extensions.vector(1536);

-- Create IVFFlat index for fast vector similarity search
-- Lists = 100 is recommended for datasets up to 1M vectors
CREATE INDEX idx_document_chunks_embedding ON document_chunks
  USING ivfflat (embedding extensions.vector_cosine_ops) WITH (lists = 100);
