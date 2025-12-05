# Technology Stack Details

## Core Technologies

**Next.js 15 (App Router)**
- Server Components for initial page loads
- Client Components for interactive elements (chat, upload)
- Route Handlers for API endpoints
- Streaming for AI responses via `ReadableStream`

**Supabase**
- PostgreSQL with pgvector extension (1536 dimensions)
- Row Level Security for multi-tenancy
- Storage buckets with per-agency policies
- Auth with email/password and Google OAuth
- Edge Functions (Deno) for background processing

**OpenAI**
- GPT-5.1 for quote extraction (400K context, CFG support)
- text-embedding-3-small for vector embeddings
- Function calling with grammar constraints for structured data extraction

**OpenRouter (Claude)**
- Claude Sonnet 4.5 for document Q&A (via OpenRouter)
- Superior instruction following and table comprehension
- 200K token context for complex documents

**Docling (Self-Hosted)**
- Primary PDF parser for tables and structured content (IBM TableFormer model)
- 97.9% table extraction accuracy vs 75% with previous solution
- Self-hosted Python microservice on Railway
- Markdown output optimized for RAG with page markers

## Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                        VERCEL (Next.js)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  App Router │  │ API Routes  │  │   Edge Runtime          │ │
│  │  (React)    │  │ (REST)      │  │   (Streaming)           │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
└─────────┼────────────────┼─────────────────────┼───────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ Auth     │  │ Database │  │ Storage  │  │ Edge Functions │  │
│  │          │  │ +pgvector│  │          │  │                │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    OpenAI       │  │   OpenRouter    │  │    Docling      │  │      Resend     │
│  GPT-5.1        │  │  Claude 4.5     │  │  (Self-Hosted)  │  │   Transactional │
│  Embeddings     │  │  (Chat/Q&A)     │  │  PDF Parsing    │  │   Email         │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```
