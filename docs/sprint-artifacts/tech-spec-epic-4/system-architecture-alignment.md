# System Architecture Alignment

**Components Referenced:**
- Supabase PostgreSQL with RLS for document metadata storage
- Supabase Storage for PDF file storage (S3-compatible)
- Supabase Edge Functions for background document processing
- Docling service for PDF extraction (self-hosted, ~2.45 pages/sec) - replaces LlamaParse
- OpenAI API for embeddings (text-embedding-3-small)
- pgvector extension for vector similarity search indexing
- Next.js 15 App Router for UI and API routes
- Supabase Realtime for processing status updates

**Architecture Constraints:**
- All documents scoped by `agency_id` via RLS policies
- Storage paths follow pattern: `{agency_id}/{document_id}/{filename}`
- Storage policies mirror database RLS (same agency isolation)
- Edge Function timeout: 150 seconds (Supabase limit) - sufficient for most documents
- Chunking must preserve page numbers for source citation
- Embeddings stored in document_chunks table with vector(1536) type
- IVFFlat index on embeddings for fast similarity search
- Processing jobs table for queue management

**Key Decisions Applied:**
- ADR-001: Supabase-Native for unified storage + database
- ADR-002: Docling for PDF Processing (migrated from LlamaParse per Story 4.8)
- ADR-004: Row Level Security for agency isolation
- UX Principle: Speed is a feature - skeleton loading, not spinners
