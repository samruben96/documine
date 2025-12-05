# System Architecture Alignment

**Components Referenced:**
- OpenAI GPT-4o for response generation with function calling
- OpenAI text-embedding-3-small for query embeddings (1536 dimensions)
- Supabase PostgreSQL with pgvector for semantic similarity search
- Supabase Realtime for potential future live updates (not used in MVP)
- Next.js 16 App Router for UI and streaming API routes
- react-pdf / pdfjs-dist for PDF rendering in document viewer
- shadcn/ui components for chat interface elements

**Architecture Constraints:**
- All conversations and messages scoped by `agency_id` via RLS policies (same isolation as documents)
- Streaming responses via Server-Sent Events from Next.js API route
- Query embeddings generated on-demand (not cached) for freshness
- RAG retrieval returns top 5 chunks filtered by document_id and agency_id
- Confidence scoring based on cosine similarity of top chunk (≥0.85 = High, 0.60-0.84 = Needs Review, <0.60 = Not Found)
- Source citations include page number and text excerpt for verification
- PDF viewer requires pdfjs worker loaded from CDN or bundled

**Key Decisions Applied:**
- ADR-003: Streaming AI Responses for perceived instant response
- ADR-004: Row Level Security for conversation isolation
- ADR-005: OpenAI as Sole AI Provider for consistent accuracy
- Novel Pattern: Trust-Transparent AI Responses (from Architecture doc)
- UX Principle: "Speed is a feature" - streaming text, skeleton loading
