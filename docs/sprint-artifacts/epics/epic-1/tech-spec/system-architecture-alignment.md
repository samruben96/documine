# System Architecture Alignment

This epic implements the Supabase-native architecture decision (ADR-001) establishing:

**Components Referenced:**
- Next.js 15 App Router (`src/app/`)
- Supabase PostgreSQL with pgvector extension
- Supabase Storage for document files
- Supabase Auth foundation
- Vercel deployment platform

**Architecture Constraints:**
- TypeScript strict mode enforced throughout
- All database tables must include `agency_id` for RLS
- pgvector extension with 1536-dimension vectors for OpenAI embeddings
- Storage bucket path structure: `{agency_id}/{document_id}/{filename}`
- Environment variables follow SCREAMING_SNAKE_CASE convention
- API responses follow `{ data: T | null, error: ErrorObject | null }` format

**Key Decisions Applied:**
- ADR-001: Supabase-Native over T3 Stack (unified platform for DB, vectors, storage, auth)
- ADR-004: Row Level Security for Multi-Tenancy (database-level isolation)
