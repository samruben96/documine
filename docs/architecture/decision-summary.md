# Decision Summary

| Category | Decision | Version | Affects FRs | Rationale |
|----------|----------|---------|-------------|-----------|
| Framework | Next.js (App Router) | 15.x | All | Industry standard React framework, SSR/SSG, Vercel-optimized |
| Language | TypeScript | 5.x | All | Type safety, better DX, fewer runtime errors |
| Styling | Tailwind CSS | 3.x | All UI | Utility-first, matches UX spec, shadcn/ui compatible |
| Database | Supabase PostgreSQL | Latest | FR8-12, FR27-30 | Managed Postgres with RLS for multi-tenancy |
| Vector Search | Supabase pgvector | Latest | FR13-19 | Unified with database, semantic search for Q&A |
| File Storage | Supabase Storage | Latest | FR8-12 | S3-compatible, RLS policies, same platform |
| Authentication | Supabase Auth | Latest | FR1-7 | Email/OAuth, integrates with RLS |
| AI/LLM (Chat) | Claude Sonnet 4.5 via OpenRouter | Latest | FR13-19 | Best accuracy for document Q&A, instruction following |
| AI/LLM (Extraction) | OpenAI GPT-5.1 | 2025-11-13 | FR20-26 | 400K context, CFG support, best structured output |
| PDF Processing | Docling (self-hosted) | Latest | FR12, FR21 | 97.9% table accuracy, zero API cost, full data privacy |
| Multi-Tenancy | Row Level Security (RLS) | Native | FR27-30 | Database-level isolation per agency |
| UI Components | shadcn/ui | Latest | All UI | Per UX spec, accessible, Tailwind-based |
| Background Jobs | Supabase Edge Functions | Latest | FR12 | Document processing queue, no extra service |
| Email | Resend | Latest | FR3, FR5 | Password reset, invitations, modern API |
| Deployment | Vercel | Latest | All | Zero-config Next.js, edge functions, previews |
| Embeddings | OpenAI text-embedding-3-small | Latest | FR13-19 | 1536 dimensions, same vendor as LLM |
