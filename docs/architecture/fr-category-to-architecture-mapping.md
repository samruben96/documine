# FR Category to Architecture Mapping

| FR Category | FRs | Architecture Component | Notes |
|-------------|-----|------------------------|-------|
| **User Account & Access** | FR1-FR7 | Supabase Auth + RLS | Email/password, OAuth, session management |
| **Document Management** | FR8-FR12 | Supabase Storage + PostgreSQL | Upload to Storage, metadata in DB, processing via Edge Functions |
| **Document Q&A** | FR13-FR19 | Claude Sonnet 4.5 + pgvector | Embeddings for retrieval, Claude for generation, streaming responses |
| **Quote Comparison** | FR20-FR26 | Docling + GPT-5.1 | Structured extraction via function calling with CFG constraints |
| **Agency Management** | FR27-FR30 | RLS policies + PostgreSQL | agency_id on all tables, RLS enforces isolation |
| **Platform & Infrastructure** | FR31-FR34 | Vercel + Supabase | Edge deployment, managed services |
