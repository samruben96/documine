# Architecture

## Executive Summary

docuMINE is an AI-powered document analysis platform for independent insurance agents, built on a Supabase-native stack (Next.js, TypeScript, Supabase, Tailwind CSS). The architecture prioritizes accuracy-first AI responses with mandatory source citations, multi-tenant agency isolation via Row Level Security, and a zero-learning-curve user experience.

The system follows a monolithic full-stack architecture deployed on Vercel, with Supabase providing PostgreSQL database, pgvector for semantic search, file storage for documents, and authentication - all unified under one platform. This simplifies multi-tenancy since RLS policies protect database rows, vector embeddings, AND file storage with the same agency_id logic.

## Project Initialization

**First implementation story should execute:**

```bash
# Create Next.js app
npx create-next-app@latest documine --typescript --tailwind --eslint --app --src-dir

# Initialize Supabase
cd documine
npm install @supabase/supabase-js @supabase/ssr
npx supabase init
npx supabase start  # Local dev with Docker

# Add UI components
npx shadcn@latest init
npx shadcn@latest add button input card dialog table tabs toast

# Add additional dependencies
npm install openai resend zod
```

This establishes the base architecture with these decisions:

| Decision | Solution | Provider |
|----------|----------|----------|
| Framework | Next.js 15 (App Router) | create-next-app |
| Language | TypeScript (strict mode) | create-next-app |
| Styling | Tailwind CSS | create-next-app |
| Linting | ESLint | create-next-app |
| Database | PostgreSQL | Supabase |
| Vector Search | pgvector | Supabase (extension) |
| File Storage | S3-compatible storage | Supabase Storage |
| Authentication | Email/password + OAuth | Supabase Auth |
| Multi-Tenancy | Row Level Security (RLS) | Supabase (native) |

**Why Supabase-native instead of T3 + Prisma:**
1. Unified platform for DB + Vectors + Storage + Auth
2. Native RLS for multi-tenant agency isolation
3. No ORM abstraction fighting pgvector
4. Simpler architecture, fewer moving parts
5. Generated TypeScript types from database schema

**Post-initialization steps:**
```bash
# Enable pgvector extension (in Supabase dashboard or migration)
create extension if not exists vector with schema extensions;

# Generate TypeScript types from your schema
npx supabase gen types typescript --local > src/lib/database.types.ts

# Start development
npm run dev
```

## Decision Summary

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

## Project Structure

```
documine/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth routes (login, signup, reset)
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── (dashboard)/              # Protected routes
│   │   │   ├── documents/            # Document management
│   │   │   │   ├── page.tsx          # Document list
│   │   │   │   └── [id]/page.tsx     # Document view + chat
│   │   │   ├── compare/              # Quote comparison
│   │   │   │   └── page.tsx
│   │   │   └── settings/             # Agency settings
│   │   │       └── page.tsx
│   │   ├── api/                      # API routes
│   │   │   ├── chat/route.ts         # Streaming chat endpoint
│   │   │   ├── documents/
│   │   │   │   ├── route.ts          # CRUD operations
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       └── extract/route.ts
│   │   │   └── compare/route.ts      # Quote comparison
│   │   ├── layout.tsx
│   │   └── page.tsx                  # Landing/redirect
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── chat/                     # Chat-specific components
│   │   │   ├── chat-message.tsx
│   │   │   ├── chat-input.tsx
│   │   │   ├── confidence-badge.tsx
│   │   │   └── source-citation.tsx
│   │   ├── documents/                # Document components
│   │   │   ├── document-viewer.tsx
│   │   │   ├── document-list.tsx
│   │   │   └── upload-zone.tsx
│   │   ├── compare/                  # Comparison components
│   │   │   └── comparison-table.tsx
│   │   └── layout/                   # Layout components
│   │       ├── sidebar.tsx
│   │       ├── header.tsx
│   │       └── split-view.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser client
│   │   │   ├── server.ts             # Server client
│   │   │   └── middleware.ts         # Auth middleware
│   │   ├── openai/
│   │   │   ├── client.ts             # OpenAI client
│   │   │   ├── embeddings.ts         # Embedding generation
│   │   │   └── chat.ts               # Chat completion
│   │   ├── docling/
│   │   │   └── client.ts             # Docling client
│   │   ├── email/
│   │   │   └── resend.ts             # Resend client
│   │   └── utils/
│   │       ├── pdf.ts                # PDF utilities
│   │       └── vectors.ts            # Vector operations
│   ├── hooks/                        # Custom React hooks
│   │   ├── use-chat.ts
│   │   ├── use-documents.ts
│   │   └── use-comparison.ts
│   └── types/
│       ├── database.types.ts         # Generated Supabase types
│       └── index.ts                  # App-specific types
├── supabase/
│   ├── migrations/                   # Database migrations
│   │   ├── 00001_initial_schema.sql
│   │   ├── 00002_enable_pgvector.sql
│   │   └── 00003_rls_policies.sql
│   ├── functions/                    # Edge Functions
│   │   └── process-document/
│   │       └── index.ts
│   └── config.toml
├── public/
├── .env.local                        # Local environment variables
├── .env.example                      # Environment template
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## FR Category to Architecture Mapping

| FR Category | FRs | Architecture Component | Notes |
|-------------|-----|------------------------|-------|
| **User Account & Access** | FR1-FR7 | Supabase Auth + RLS | Email/password, OAuth, session management |
| **Document Management** | FR8-FR12 | Supabase Storage + PostgreSQL | Upload to Storage, metadata in DB, processing via Edge Functions |
| **Document Q&A** | FR13-FR19 | Claude Sonnet 4.5 + pgvector | Embeddings for retrieval, Claude for generation, streaming responses |
| **Quote Comparison** | FR20-FR26 | Docling + GPT-5.1 | Structured extraction via function calling with CFG constraints |
| **Agency Management** | FR27-FR30 | RLS policies + PostgreSQL | agency_id on all tables, RLS enforces isolation |
| **Platform & Infrastructure** | FR31-FR34 | Vercel + Supabase | Edge deployment, managed services |

## Technology Stack Details

### Core Technologies

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

### Integration Points

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

## Novel Pattern: Trust-Transparent AI Responses

docuMINE requires a novel pattern for AI responses that builds user trust through transparency.

### Pattern Definition

Every AI response MUST include:
1. **Answer** - Natural language response
2. **Source Citation** - Exact location in document
3. **Confidence Score** - High/Medium/Low with threshold logic

### Implementation

```typescript
interface AIResponse {
  answer: string;
  sources: {
    documentId: string;
    pageNumber: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
    text: string;  // The exact quoted text
  }[];
  confidence: 'high' | 'needs_review' | 'not_found';
  confidenceScore: number;  // 0-1 for internal use
}

// Confidence thresholds
const CONFIDENCE_THRESHOLDS = {
  high: 0.85,        // >= 85% confident
  needs_review: 0.60, // 60-84% confident
  not_found: 0        // < 60% or no relevant chunks found
};
```

### Retrieval Flow

```
User Query: "What is the liability limit?"
                    │
                    ▼
┌─────────────────────────────────────────┐
│  1. Generate query embedding            │
│     (text-embedding-3-small)            │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  2. Vector search in pgvector           │
│     - Filter by document_id + agency_id │
│     - Return top 5 chunks with scores   │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  3. Build prompt with retrieved chunks  │
│     - Include page numbers              │
│     - Include bounding boxes if avail   │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  4. GPT-4o generates response           │
│     - Structured output with citations  │
│     - Confidence based on chunk scores  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  5. Stream response to client           │
│     - Answer text streams first         │
│     - Citations appear after            │
└─────────────────────────────────────────┘
```

## Implementation Patterns

These patterns ensure consistent implementation across all AI agents:

### API Response Format

All API responses follow this structure:

```typescript
// Success response
{
  data: T;
  error: null;
}

// Error response
{
  data: null;
  error: {
    code: string;      // e.g., "DOCUMENT_NOT_FOUND"
    message: string;   // Human-readable message
    details?: unknown; // Additional context
  };
}
```

### Streaming Response Format

For chat endpoints, use Server-Sent Events:

```typescript
// Stream format
data: {"type": "text", "content": "The liability"}
data: {"type": "text", "content": " limit is"}
data: {"type": "text", "content": " $1,000,000"}
data: {"type": "source", "content": {"page": 3, "text": "..."}}
data: {"type": "confidence", "content": "high"}
data: [DONE]
```

### Database Query Pattern

Always include agency_id in queries (RLS enforces this, but be explicit):

```typescript
// Good - explicit agency filter
const { data } = await supabase
  .from('documents')
  .select('*')
  .eq('agency_id', user.agency_id)
  .eq('id', documentId);

// RLS policy ensures this anyway, but explicit is better for clarity
```

### File Upload Pattern

```typescript
// 1. Upload to Supabase Storage
const { data: file } = await supabase.storage
  .from('documents')
  .upload(`${agencyId}/${documentId}/${filename}`, fileBuffer);

// 2. Create database record
const { data: document } = await supabase
  .from('documents')
  .insert({
    id: documentId,
    agency_id: agencyId,
    filename,
    storage_path: file.path,
    status: 'processing'
  });

// 3. Trigger processing (Edge Function picks up)
await supabase
  .from('processing_jobs')
  .insert({ document_id: documentId });
```

## Consistency Rules

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Database tables | snake_case, plural | `documents`, `chat_messages` |
| Database columns | snake_case | `agency_id`, `created_at` |
| TypeScript types | PascalCase | `Document`, `ChatMessage` |
| TypeScript variables | camelCase | `documentId`, `agencyId` |
| React components | PascalCase | `DocumentViewer`, `ChatMessage` |
| React component files | kebab-case | `document-viewer.tsx` |
| API routes | kebab-case | `/api/documents`, `/api/chat` |
| Environment variables | SCREAMING_SNAKE_CASE | `OPENAI_API_KEY` |
| CSS classes | Tailwind utilities | `flex items-center gap-2` |

### Code Organization

| Type | Location | Pattern |
|------|----------|---------|
| Pages | `src/app/` | App Router conventions |
| Shared components | `src/components/` | Feature folders |
| UI primitives | `src/components/ui/` | shadcn/ui components |
| Server utilities | `src/lib/` | Client instances, helpers |
| React hooks | `src/hooks/` | `use-*.ts` |
| Types | `src/types/` | Shared type definitions |
| Database migrations | `supabase/migrations/` | Numbered SQL files |
| Edge functions | `supabase/functions/` | One folder per function |

### Error Handling

```typescript
// Application errors - use custom error classes
class DocumentNotFoundError extends Error {
  code = 'DOCUMENT_NOT_FOUND' as const;
  constructor(documentId: string) {
    super(`Document ${documentId} not found`);
  }
}

// API route error handling
export async function GET(request: Request) {
  try {
    // ... logic
  } catch (error) {
    if (error instanceof DocumentNotFoundError) {
      return Response.json(
        { data: null, error: { code: error.code, message: error.message } },
        { status: 404 }
      );
    }
    // Log unexpected errors, return generic message
    console.error('Unexpected error:', error);
    return Response.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
```

### Logging Strategy

```typescript
// Use structured logging
const log = {
  info: (message: string, data?: Record<string, unknown>) =>
    console.log(JSON.stringify({ level: 'info', message, ...data, timestamp: new Date().toISOString() })),
  error: (message: string, error: Error, data?: Record<string, unknown>) =>
    console.error(JSON.stringify({ level: 'error', message, error: error.message, stack: error.stack, ...data, timestamp: new Date().toISOString() })),
  warn: (message: string, data?: Record<string, unknown>) =>
    console.warn(JSON.stringify({ level: 'warn', message, ...data, timestamp: new Date().toISOString() })),
};

// Usage
log.info('Document processing started', { documentId, agencyId });
log.error('Failed to process document', error, { documentId });
```

## Data Architecture

### Core Tables

```sql
-- Agencies (tenants)
create table agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subscription_tier text not null default 'starter',
  seat_limit integer not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Users
create table users (
  id uuid primary key references auth.users(id),
  agency_id uuid not null references agencies(id),
  email text not null,
  full_name text,
  role text not null default 'member', -- 'admin' | 'member'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Documents
create table documents (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id),
  uploaded_by uuid not null references users(id),
  filename text not null,
  storage_path text not null,
  status text not null default 'processing', -- 'processing' | 'ready' | 'failed'
  page_count integer,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Document chunks (for vector search)
create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  agency_id uuid not null references agencies(id),
  content text not null,
  page_number integer not null,
  chunk_index integer not null,
  bounding_box jsonb, -- {x, y, width, height} if available
  embedding vector(1536) not null,
  created_at timestamptz not null default now()
);

-- Chat conversations
create table conversations (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id),
  document_id uuid not null references documents(id),
  user_id uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Chat messages
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  agency_id uuid not null references agencies(id),
  role text not null, -- 'user' | 'assistant'
  content text not null,
  sources jsonb, -- Array of source citations
  confidence text, -- 'high' | 'needs_review' | 'not_found'
  created_at timestamptz not null default now()
);

-- Processing jobs queue
create table processing_jobs (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  status text not null default 'pending', -- 'pending' | 'processing' | 'completed' | 'failed'
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_documents_agency on documents(agency_id);
create index idx_document_chunks_document on document_chunks(document_id);
create index idx_document_chunks_embedding on document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index idx_conversations_document on conversations(document_id);
create index idx_chat_messages_conversation on chat_messages(conversation_id);
create index idx_processing_jobs_status on processing_jobs(status) where status = 'pending';
```

### RLS Policies

```sql
-- Enable RLS on all tables
alter table agencies enable row level security;
alter table users enable row level security;
alter table documents enable row level security;
alter table document_chunks enable row level security;
alter table conversations enable row level security;
alter table chat_messages enable row level security;
alter table processing_jobs enable row level security;

-- Users can only see their own agency
create policy "Users see own agency" on agencies
  for select using (id = (select agency_id from users where id = auth.uid()));

-- Users can only see users in their agency
create policy "Users see agency members" on users
  for select using (agency_id = (select agency_id from users where id = auth.uid()));

-- Documents scoped to agency
create policy "Documents scoped to agency" on documents
  for all using (agency_id = (select agency_id from users where id = auth.uid()));

-- Document chunks scoped to agency
create policy "Chunks scoped to agency" on document_chunks
  for all using (agency_id = (select agency_id from users where id = auth.uid()));

-- Conversations scoped to agency
create policy "Conversations scoped to agency" on conversations
  for all using (agency_id = (select agency_id from users where id = auth.uid()));

-- Chat messages scoped to agency
create policy "Messages scoped to agency" on chat_messages
  for all using (agency_id = (select agency_id from users where id = auth.uid()));

-- Processing jobs - service role only (Edge Functions)
create policy "Jobs service role only" on processing_jobs
  for all using (auth.role() = 'service_role');
```

### Storage Policies

```sql
-- Storage bucket: documents
-- Path structure: {agency_id}/{document_id}/{filename}

-- Users can upload to their agency folder
create policy "Upload to agency folder" on storage.objects
  for insert with check (
    bucket_id = 'documents' and
    (storage.foldername(name))[1] = (select agency_id::text from users where id = auth.uid())
  );

-- Users can read from their agency folder
create policy "Read from agency folder" on storage.objects
  for select using (
    bucket_id = 'documents' and
    (storage.foldername(name))[1] = (select agency_id::text from users where id = auth.uid())
  );

-- Users can delete from their agency folder
create policy "Delete from agency folder" on storage.objects
  for delete using (
    bucket_id = 'documents' and
    (storage.foldername(name))[1] = (select agency_id::text from users where id = auth.uid())
  );
```

## API Contracts

### Authentication

```typescript
// POST /api/auth/signup
Request: { email: string; password: string; agencyName: string; fullName: string; }
Response: { data: { user: User; agency: Agency; }; error: null; }

// POST /api/auth/login
Request: { email: string; password: string; }
Response: { data: { user: User; session: Session; }; error: null; }

// POST /api/auth/reset-password
Request: { email: string; }
Response: { data: { message: string; }; error: null; }
```

### Documents

```typescript
// GET /api/documents
Response: { data: Document[]; error: null; }

// POST /api/documents (multipart/form-data)
Request: FormData with file
Response: { data: Document; error: null; }

// GET /api/documents/:id
Response: { data: Document & { chunks: DocumentChunk[]; }; error: null; }

// DELETE /api/documents/:id
Response: { data: { deleted: true; }; error: null; }
```

### Chat

```typescript
// POST /api/chat (streaming)
Request: { documentId: string; message: string; conversationId?: string; }
Response: Server-Sent Events stream

// Event types:
{ type: 'text', content: string }
{ type: 'source', content: { page: number; text: string; boundingBox?: BoundingBox; } }
{ type: 'confidence', content: 'high' | 'needs_review' | 'not_found' }
{ type: 'done', content: { conversationId: string; messageId: string; } }
```

### Compare

```typescript
// POST /api/compare
Request: { documentIds: string[]; }  // 2-4 documents
Response: {
  data: {
    comparison: {
      field: string;  // e.g., "Liability Limit"
      values: { documentId: string; value: string; source: Source; }[];
      winner?: string;  // documentId with best value
    }[];
  };
  error: null;
}
```

## Security Architecture

### Authentication Flow

```
1. User signs up/logs in via Supabase Auth
2. Supabase issues JWT with user.id
3. JWT stored in httpOnly cookie (via @supabase/ssr)
4. Every request includes cookie
5. Supabase validates JWT, sets auth.uid()
6. RLS policies use auth.uid() to filter data
```

### Data Protection

| Layer | Protection |
|-------|------------|
| Transit | TLS 1.3 (Vercel + Supabase) |
| At rest | AES-256 (Supabase managed) |
| Passwords | bcrypt via Supabase Auth |
| API Keys | Environment variables, never client-side |
| File access | Signed URLs with expiration |

### Security Headers

```typescript
// next.config.js
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];
```

### Rate Limiting

Implement at Vercel Edge:

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
});

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }
}
```

## Performance Considerations

### Response Time Targets

| Operation | Target | Strategy |
|-----------|--------|----------|
| Page load | < 1s | SSR + streaming |
| Document upload | < 30s | Direct to Supabase Storage |
| Document processing | < 2 min | Background Edge Function |
| Q&A response | < 10s | Streaming, vector index |
| Quote comparison | < 60s/doc | Parallel extraction |

### Optimization Strategies

**Vector Search**
- IVFFlat index with 100 lists for ~1M vectors
- Filter by document_id before similarity search
- Limit to top 5 chunks for context

**Streaming**
- Stream AI responses character-by-character
- Show source citations as soon as identified
- Use React Suspense for loading states

**Caching**
- Document metadata: SWR with 5-minute stale time
- Conversation history: Keep in React state
- No caching of AI responses (always fresh)

**Edge Functions**
- Keep warm with scheduled pings
- Process one document per invocation
- Timeout at 150 seconds (Supabase limit)

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         VERCEL                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Edge Network (Global)                               │   │
│  │  - Static assets                                     │   │
│  │  - Middleware (rate limiting, auth check)            │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Serverless Functions (Regional)                     │   │
│  │  - API routes                                        │   │
│  │  - SSR pages                                         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        SUPABASE                             │
│  Region: us-east-1 (match Vercel region)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Database │  │ Storage  │  │   Auth   │  │   Edge     │  │
│  │ (Postgres│  │ (S3)     │  │          │  │  Functions │  │
│  │ +pgvector│  │          │  │          │  │  (Deno)    │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Environment Configuration

```bash
# .env.local (development)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-key

OPENAI_API_KEY=sk-...
DOCLING_SERVICE_URL=http://localhost:8000  # Local Docling service
RESEND_API_KEY=re_...

# Production (Vercel Environment Variables)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

OPENAI_API_KEY=sk-...
DOCLING_SERVICE_URL=https://docling-for-documine-production.up.railway.app
RESEND_API_KEY=re_...
```

## Development Environment

### Prerequisites

- Node.js 20+
- Docker Desktop (for local Supabase)
- Git

### Setup Commands

```bash
# Clone repository
git clone https://github.com/your-org/documine.git
cd documine

# Install dependencies
npm install

# Start local Supabase
npx supabase start

# Apply migrations
npx supabase db push

# Generate types
npx supabase gen types typescript --local > src/lib/database.types.ts

# Copy environment file
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
```

### Development Workflow

```bash
# Create new migration
npx supabase migration new add_feature_x

# Apply migrations locally
npx supabase db push

# Reset database (destructive)
npx supabase db reset

# Generate types after schema changes
npx supabase gen types typescript --local > src/lib/database.types.ts

# Deploy Edge Function
npx supabase functions deploy process-document

# Run tests
npm test

# Build for production
npm run build
```

## Architecture Decision Records (ADRs)

### ADR-001: Supabase-Native over T3 Stack

**Status:** Accepted

**Context:** Need database, vector search, file storage, and authentication. T3 Stack (Prisma + NextAuth) is popular but adds complexity when integrating pgvector and storage.

**Decision:** Use Supabase as unified backend platform.

**Consequences:**
- (+) Single platform for DB, vectors, storage, auth
- (+) Native RLS simplifies multi-tenancy
- (+) Generated types without ORM overhead
- (-) Vendor lock-in (mitigated: Postgres is portable)
- (-) Less flexible than raw AWS

---

### ADR-002: Docling for PDF Processing (Updated 2025-11-30)

**Status:** Accepted (Updated from LlamaParse)

**Context:** Insurance PDFs have complex tables, multi-column layouts, and varying quality. Need 95%+ extraction accuracy. Original LlamaParse solution had 75% table accuracy and API cost concerns.

**Decision:** Use self-hosted Docling service (IBM TableFormer model) for all PDF processing.

**Consequences:**
- (+) 97.9% table extraction accuracy (critical for insurance documents)
- (+) Zero API costs (self-hosted)
- (+) Full data privacy (documents never leave our infrastructure)
- (+) Same page marker format for backward compatibility
- (-) Requires self-managed infrastructure (Railway deployment)
- (-) Slightly longer processing time for large documents

**Migration Note:** Completed Story 4.8 (2025-11-30). Docling service deployed at https://docling-for-documine-production.up.railway.app

---

### ADR-003: Streaming AI Responses

**Status:** Accepted

**Context:** AI responses can take 3-10 seconds. Users need perceived speed.

**Decision:** Stream responses via Server-Sent Events, show text as it generates.

**Consequences:**
- (+) Perceived instant response
- (+) User can read while response completes
- (+) Can show sources as soon as identified
- (-) More complex client-side handling
- (-) Can't cache responses (always streamed)

---

### ADR-004: Row Level Security for Multi-Tenancy

**Status:** Accepted

**Context:** Multiple agencies share the platform. Data isolation is critical (insurance data is sensitive).

**Decision:** Use Postgres RLS policies with agency_id on all tables.

**Consequences:**
- (+) Database-level enforcement (can't bypass in app code)
- (+) Works for database AND storage
- (+) Simpler than application-level filtering
- (-) Must remember to include agency_id in all tables
- (-) Slightly more complex queries (though Supabase handles this)

---

### ADR-005: OpenRouter Multi-Provider Integration (Story 5.10)

**Status:** Implemented (2025-12-02)

**Context:** Original decision was OpenAI-only for simplicity. Party Mode research (2025-12-02) identified Claude Sonnet 4.5 as superior for insurance document Q&A due to:
- Better structured document handling and table comprehension
- More consistent instruction following with less hallucination
- 200K token context (vs 128K for GPT-4o)
- Strong performance on "do not alter" instructions (critical for citations)

**Decision:** Use OpenRouter as unified API gateway with Claude Sonnet 4.5 as primary model.

**Model Hierarchy:**
| Rank | Model | Use Case |
|------|-------|----------|
| 🥇 Primary | Claude Sonnet 4.5 | Complex queries, tables, citations |
| 🥈 Cost-Opt | Gemini 2.5 Flash | High-volume, cost-sensitive |
| 🥉 Fast | Claude Haiku 4.5 | Simple lookups, low latency |
| 🔄 Fallback | GPT-4o | If others unavailable |

**Configuration (Environment Variables):**
```bash
LLM_PROVIDER=openrouter           # openrouter | openai
LLM_CHAT_MODEL=claude-sonnet-4.5  # claude-sonnet-4.5 | claude-haiku-4.5 | gemini-2.5-flash | gpt-4o
OPENROUTER_API_KEY=sk-or-v1-xxx   # OpenRouter API key
OPENAI_API_KEY=sk-xxx             # Still needed for embeddings
```

**Consequences:**
- (+) Access to best model for each task (Claude for docs, GPT for embeddings)
- (+) Single API for multiple providers (Anthropic, OpenAI, Google)
- (+) Automatic failover if one provider is down
- (+) Easy A/B testing across model architectures
- (+) No vendor lock-in (config-based switching)
- (-) Additional dependency on OpenRouter
- (-) Slightly higher latency vs direct API (~50ms overhead)

**Implementation:** `src/lib/llm/config.ts` - Centralized configuration with OpenRouter client factory

**Research Sources:**
- [OpenRouter Programming Rankings](https://openrouter.ai/rankings/programming) - Claude Sonnet 4.5 ranked #1
- [Claude vs GPT-4o Comparison](https://www.vellum.ai/blog/claude-3-5-sonnet-vs-gpt4o)
- [Best LLMs for Document Processing 2025](https://algodocs.com/best-llm-models-for-document-processing-in-2025/)

---

### ADR-006: RAG Pipeline Optimization (Stories 5.8-5.10)

**Status:** Implemented (2025-12-02)

**Context:** Initial RAG implementation (Stories 5.1-5.6) showed lower than expected confidence scores (~30% High Confidence, ~40% Not Found). Technical research identified optimization opportunities.

**Decision:** Implement three-phase optimization:

**Phase 1 - Retrieval Quality (Story 5.8):**
- Add Cohere Rerank 3.5 for cross-encoder reranking
- Implement hybrid search (BM25 + vector, alpha=0.7)
- Adjust confidence thresholds: ≥0.75 High, 0.50-0.74 Needs Review, <0.50 Not Found
- Target: >50% High Confidence, <25% Not Found

**Phase 2 - Chunking Optimization (Story 5.9):**
- Replace fixed 1000-char chunking with recursive text splitter (500 tokens, 50 overlap)
- Preserve tables as single chunks with GPT-generated summaries
- Add chunk_type metadata for differentiated retrieval

**Phase 3 - Model Evaluation (Story 5.10):**
- Evaluate GPT-4o vs GPT-5-mini vs GPT-5.1
- Compare text-embedding-3-small vs 3-large
- Implement configurable model selection with feature flags

**Consequences:**
- (+) Expected 20-48% improvement in retrieval quality
- (+) Better handling of table queries in insurance documents
- (+) Cost optimization potential (GPT-5-mini is 90% cheaper)
- (-) Additional dependency on Cohere API (with fallback)
- (-) Requires document re-processing for chunking changes

**New Dependencies:**
- `cohere-ai` - Reranking API
- `COHERE_API_KEY` environment variable

**Database Changes:**
```sql
-- Story 5.8: Full-text search support
ALTER TABLE document_chunks ADD COLUMN search_vector tsvector;
CREATE INDEX idx_document_chunks_search ON document_chunks USING GIN(search_vector);

-- Story 5.9: Chunk metadata
ALTER TABLE document_chunks ADD COLUMN chunk_type varchar(20) DEFAULT 'text';
ALTER TABLE document_chunks ADD COLUMN summary text;
```

---

### ADR-007: GPT-5.1 for Structured Extraction (Story 7.2)

**Status:** Decided (2025-12-03)

**Context:** Quote comparison (Epic 7) requires extracting structured data from insurance documents. Need reliable function calling with complex nested schemas (coverages, exclusions, source references). Evaluated GPT-4o, GPT-5, and GPT-5.1.

**Decision:** Use GPT-5.1 directly (not via OpenRouter) for structured quote extraction.

**Model Details:**
| Attribute | Value |
|-----------|-------|
| Model ID | `gpt-5.1` |
| Version | 2025-11-13 |
| Context Window | 400K tokens (272K input + 128K output) |
| Input Cost | $1.25 / 1M tokens |
| Output Cost | $10.00 / 1M tokens |

**Why GPT-5.1 over alternatives:**

| Feature | GPT-5.1 | GPT-4o | Claude Sonnet 4.5 |
|---------|---------|--------|-------------------|
| Context Window | 400K | 128K | 200K |
| CFG Support | Yes | No | No |
| Function Calling | Native + Free-form | Native | Tool Use |
| Schema Adherence | Excellent | Good | Good |
| Input Cost | $1.25/1M | $2.50/1M | $3.00/1M |

**Key GPT-5.1 Features Used:**
1. **Context-Free Grammar (CFG)** - Constrain output to match exact extraction schema
2. **400K Context** - Handle large insurance documents (30+ pages) without truncation
3. **Improved Structured Output** - Better JSON generation and schema adherence
4. **Native Function Calling** - More reliable than Claude's tool use for complex schemas

**Consequences:**
- (+) 50% cheaper than GPT-4o for input tokens
- (+) 3x larger context window than GPT-4o
- (+) CFG prevents format drift in extraction
- (+) Same API key as embeddings (OPENAI_API_KEY)
- (-) Requires direct OpenAI API (not via OpenRouter)
- (-) Slightly slower than GPT-4o for simple tasks

**Implementation:**
```typescript
// src/lib/compare/extraction.ts
const EXTRACTION_MODEL = 'gpt-5.1';  // Version 2025-11-13

// Uses function calling with CFG constraints
const response = await openai.chat.completions.create({
  model: EXTRACTION_MODEL,
  messages: [...],
  tools: [{ type: 'function', function: extractQuoteDataFunction }],
  tool_choice: { type: 'function', function: { name: 'extract_quote_data' } },
});
```

**Research Sources:**
- [Introducing GPT-5 for Developers | OpenAI](https://openai.com/index/introducing-gpt-5-for-developers/)
- [GPT-5 New Params and Tools | OpenAI Cookbook](https://cookbook.openai.com/examples/gpt-5/gpt-5_new_params_and_tools)
- [GPT-5 Function Calling Tutorial | DataCamp](https://www.datacamp.com/tutorial/gpt-5-function-calling-tutorial)

---

## RAG Pipeline Architecture (Implemented)

### Original Pipeline (Stories 5.1-5.6)

```
Query → [Embedding] → [Vector Search (Top 5)] → [RAG Context] → [GPT-4o]
```

### Current Production Pipeline (Stories 5.8-5.10 - Implemented 2025-12-02)

```
Query → [Embedding] → [Hybrid Search] → [Reranker] → [RAG Context] → [Claude]
              │              │               │              │           │
              ▼              ▼               ▼              ▼           ▼
         OpenAI         FTS + Vector    Cohere         Top 5       Claude
         3-small          Fusion        Rerank 3.5   Reranked    Sonnet 4.5
                            ↓
                    Top 20 Candidates
                            ↓
                    Reranked Top 5
```

**Key Improvements Shipped:**
- Hybrid search (BM25 + vector) with alpha=0.7
- Cohere Rerank 3.5 for cross-encoder reranking
- Table-aware chunking with preserved table structure
- Claude Sonnet 4.5 via OpenRouter for superior document understanding

### Hybrid Search Algorithm

```sql
-- Combines keyword (BM25) and vector similarity
-- Alpha = 0.7 (70% vector, 30% keyword)
WITH keyword_results AS (
  SELECT id, ts_rank(search_vector, plainto_tsquery('english', $query)) as keyword_score
  FROM document_chunks
  WHERE document_id = $doc_id AND search_vector @@ plainto_tsquery('english', $query)
),
vector_results AS (
  SELECT id, 1 - (embedding <=> $query_vector) as vector_score
  FROM document_chunks
  WHERE document_id = $doc_id
  ORDER BY embedding <=> $query_vector
  LIMIT 20
)
SELECT
  COALESCE(k.id, v.id) as id,
  COALESCE(k.keyword_score, 0) * 0.3 + COALESCE(v.vector_score, 0) * 0.7 as combined_score
FROM keyword_results k
FULL OUTER JOIN vector_results v ON k.id = v.id
ORDER BY combined_score DESC
LIMIT 20;
```

### Confidence Thresholds (Updated)

| Level | Original Threshold | Updated Threshold (with Reranking) |
|-------|-------------------|-----------------------------------|
| High Confidence | ≥0.85 | ≥0.75 |
| Needs Review | 0.60-0.84 | 0.50-0.74 |
| Not Found | <0.60 | <0.50 |

**Rationale:** Reranker scores have different distribution than raw vector similarity. Thresholds tuned based on research findings.

### Chunking Strategy (Implemented 2025-12-02)

| Aspect | Original | Production (Story 5.9) |
|--------|----------|----------------------|
| Method | Fixed 1000 characters | Recursive text splitter |
| Size | 1000 chars | 500 tokens |
| Overlap | None | 50 tokens |
| Separators | Single split | ["\n\n", "\n", ". ", " "] |
| Tables | Split with text | Preserved as single chunks |
| Metadata | page_number only | + chunk_type, summary |

**Implementation Details:**
- `src/lib/documents/chunking.ts` - Recursive splitter with table detection
- Tables detected via Docling markdown format and preserved intact
- Chunk metadata stored in `document_chunks.metadata` JSONB column

### Model Configuration (Story 5.10 - Implemented 2025-12-02)

```typescript
// src/lib/llm/config.ts - Configurable model selection
type LLMProvider = 'openrouter' | 'openai';
type ChatModel = 'claude-sonnet-4.5' | 'claude-haiku-4.5' | 'gemini-2.5-flash' | 'gpt-4o';
type EmbeddingModel = 'text-embedding-3-small' | 'text-embedding-3-large';

interface ModelConfig {
  provider: LLMProvider;
  chatModel: ChatModel;
  embeddingModel: EmbeddingModel;
  embeddingDimensions: 1536 | 3072;
}

// Default: Claude Sonnet 4.5 via OpenRouter
const DEFAULT_CONFIG: ModelConfig = {
  provider: 'openrouter',
  chatModel: 'claude-sonnet-4.5',
  embeddingModel: 'text-embedding-3-small',
  embeddingDimensions: 1536,
};

// Cost comparison (per 1M tokens, via OpenRouter)
// Claude Sonnet 4.5: $3.00 input, $15.00 output
// Claude Haiku 4.5: $0.80 input, $4.00 output
// Gemini 2.5 Flash: $0.15 input, $0.60 output (cheapest)
// GPT-4o: $2.50 input, $10.00 output
```

---

## UI/UX Architecture

### Design Philosophy

docuMINE follows an "Invisible Technology" design philosophy - the interface should feel like a natural extension of the agent's workflow, not a new platform to master.

**Core Principles:**
1. **Zero Learning Curve** - Any agent can upload and ask questions within 60 seconds
2. **Trust Through Transparency** - Every answer shows its source with confidence indicators
3. **Speed You Can Feel** - Responses stream immediately, progress indicators during processing
4. **Respect Agent Expertise** - Collaborative language ("Here's what I found...") not authoritative
5. **Clean Over Clever** - Simple layouts, clear typography, obvious actions

### Layout Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Header (Banner)                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ docuMINE | Documents | Compare | Settings | [User/Logout]           ││
│  └─────────────────────────────────────────────────────────────────────┘│
├──────────────────┬──────────────────────────┬───────────────────────────┤
│  Sidebar         │  Document Viewer         │  Chat Panel               │
│  (Complementary) │  (Main Content)          │  (Aside)                  │
│                  │                          │                           │
│  ┌────────────┐  │  ┌────────────────────┐  │  ┌─────────────────────┐  │
│  │ Search     │  │  │ PDF Controls       │  │  │ Chat Header         │  │
│  ├────────────┤  │  │ Page | Zoom        │  │  │ New Conversation    │  │
│  │ Doc List   │  │  ├────────────────────┤  │  ├─────────────────────┤  │
│  │ - Item     │  │  │                    │  │  │ Message History     │  │
│  │ - Item*    │  │  │ PDF Render         │  │  │ [User] Question     │  │
│  │ - Item     │  │  │                    │  │  │ [AI] Answer         │  │
│  │            │  │  │                    │  │  │   + Sources         │  │
│  ├────────────┤  │  │                    │  │  │   + Confidence      │  │
│  │ Upload Btn │  │  │                    │  │  ├─────────────────────┤  │
│  └────────────┘  │  └────────────────────┘  │  │ Input + Send        │  │
│                  │                          │  └─────────────────────┘  │
└──────────────────┴──────────────────────────┴───────────────────────────┘
* = Selected document (highlighted)

Mobile (< 768px): Tabs replace split view
┌─────────────────────────────┐
│ [Document] [Chat] tabs      │
├─────────────────────────────┤
│                             │
│  Active Tab Content         │
│                             │
└─────────────────────────────┘
```

### Component Hierarchy

```
src/components/
├── layout/
│   ├── header.tsx           # Top navigation bar
│   ├── sidebar.tsx          # Document list sidebar
│   └── split-view.tsx       # Responsive split layout
├── documents/
│   ├── document-list.tsx    # Document list container
│   ├── document-list-item.tsx # Individual document row
│   ├── document-viewer.tsx  # PDF viewer component
│   ├── upload-zone.tsx      # Drag-and-drop upload
│   ├── empty-state.tsx      # Empty state variants
│   └── connection-indicator.tsx # Realtime status
├── chat/
│   ├── chat-panel.tsx       # Chat container
│   ├── chat-message.tsx     # Individual message bubble
│   ├── chat-input.tsx       # Message input
│   ├── confidence-badge.tsx # Trust indicator
│   └── source-citation.tsx  # Clickable source links
└── ui/                      # shadcn/ui components
    ├── button.tsx
    ├── input.tsx
    ├── tooltip.tsx
    └── ...
```

### UI State Management

| State | Scope | Storage | Notes |
|-------|-------|---------|-------|
| Selected Document | URL | `params.id` | Deep-linkable |
| Current Page | Component | React state | Resets on doc change |
| Chat Messages | Hook | `useConversation` + DB | Persisted to Supabase |
| Upload Progress | Component | React state | Transient |
| Connection Status | Context | `RealtimeContext` | App-wide |
| Document List | Hook | `useDocuments` + SWR | Cached, revalidates |

### Responsive Breakpoints

```typescript
// Tailwind CSS breakpoints used
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet - switches to tabs
  lg: '1024px',  // Desktop - full split view
  xl: '1280px',  // Large desktop
};

// Layout behavior
if (width < 768px) {
  // Mobile: Tabs (Document | Chat)
  // Sidebar: Drawer (hamburger menu)
} else {
  // Desktop: Split view (Sidebar | PDF | Chat)
  // Sidebar: Always visible
}
```

### Trust Transparency UI Pattern

Every AI response displays:

```typescript
interface AIResponseDisplay {
  // Message content (streams in real-time)
  content: string;

  // Confidence indicator with color coding
  confidence: {
    level: 'high' | 'needs_review' | 'not_found' | 'conversational';
    icon: LucideIcon;
    color: string;  // Tailwind class
    label: string;
  };

  // Clickable source citations
  sources: {
    pageNumber: number;
    text: string;
    onClick: () => void;  // Navigates PDF
  }[];

  // Timestamp
  timestamp: Date;
}

// Confidence badge color scheme
const confidenceColors = {
  high: 'text-green-600 bg-green-50',
  needs_review: 'text-yellow-600 bg-yellow-50',
  not_found: 'text-gray-600 bg-gray-50',
  conversational: 'text-blue-600 bg-blue-50',
};
```

### Empty State Variants

```typescript
type EmptyStateVariant =
  | 'no-documents'      // First use: "Ready to analyze"
  | 'select-document'   // Has docs: "Select to get started"
  | 'no-results'        // Search: "No documents found"
  | 'processing'        // Doc processing: "Analyzing..."
  | 'error';            // Error: "Something went wrong"

// Each variant has: icon, headline, description, optional CTA
```

### Accessibility Requirements

Per WCAG 2.1 AA guidelines:

- **Color Contrast:** 4.5:1 for normal text, 3:1 for large text
- **Keyboard Navigation:** All interactive elements focusable
- **Screen Readers:** ARIA labels on icons, live regions for updates
- **Focus Indicators:** Visible focus rings on all interactive elements
- **Reduced Motion:** Respect `prefers-reduced-motion`

### Performance Targets (UI)

| Metric | Target | Strategy |
|--------|--------|----------|
| First Contentful Paint | < 1.5s | SSR, code splitting |
| Largest Contentful Paint | < 2.5s | Image optimization, lazy loading |
| Time to Interactive | < 3.5s | Minimal JS bundle |
| Cumulative Layout Shift | < 0.1 | Reserved space, font loading |
| AI Response Stream Start | < 2s | Streaming SSE |

### Research References

UI/UX decisions informed by research documented in:
- `docs/research-ui-best-practices-2025-12-02.md`

Key sources:
- [Smashing Magazine: Design Patterns for AI Interfaces](https://www.smashingmagazine.com/2025/07/design-patterns-ai-interfaces/)
- [NN/g: Designing Empty States](https://www.nngroup.com/articles/empty-state-interface-design/)
- [AWS Cloudscape: Split View Pattern](https://cloudscape.design/patterns/resource-management/view/split-view/)

---

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: 2025-11-24_
_Updated: 2025-12-02 (ADR-005, ADR-006 implemented; RAG pipeline production-ready; UI/UX Architecture added)_
_Updated: 2025-12-03 (ADR-007 added: GPT-5.1 for structured extraction in Epic 7)_
_For: Sam_
