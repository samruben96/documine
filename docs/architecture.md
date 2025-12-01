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
npm install openai llamaindex resend zod
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
| AI/LLM | OpenAI GPT-4o | Latest | FR13-19, FR20-26 | Best accuracy for document analysis, function calling |
| PDF Processing | LlamaParse + GPT-4o Vision | Latest | FR12, FR21 | LlamaParse for speed/tables, Vision fallback for complex |
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
│   │   ├── llamaparse/
│   │   │   └── client.ts             # LlamaParse client
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
| **Document Q&A** | FR13-FR19 | OpenAI GPT-4o + pgvector | Embeddings for retrieval, GPT-4o for generation, streaming responses |
| **Quote Comparison** | FR20-FR26 | LlamaParse + GPT-4o | Structured extraction, function calling for data alignment |
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
- GPT-4o for document Q&A and quote extraction
- text-embedding-3-small for vector embeddings
- Function calling for structured data extraction

**LlamaParse**
- Primary PDF parser for tables and structured content
- ~6 second processing time per document
- Markdown output optimized for RAG

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
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐
│    OpenAI       │  │   LlamaParse    │  │      Resend         │
│  GPT-4o         │  │   PDF Parsing   │  │   Transactional     │
│  Embeddings     │  │                 │  │   Email             │
└─────────────────┘  └─────────────────┘  └─────────────────────┘
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
LLAMA_CLOUD_API_KEY=llx-...
RESEND_API_KEY=re_...

# Production (Vercel Environment Variables)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

OPENAI_API_KEY=sk-...
LLAMA_CLOUD_API_KEY=llx-...
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

### ADR-002: LlamaParse + GPT-4o Vision for PDF Processing

**Status:** Accepted

**Context:** Insurance PDFs have complex tables, multi-column layouts, and varying quality. Need 95%+ extraction accuracy.

**Decision:** Use LlamaParse as primary parser (fast, good tables), GPT-4o Vision as fallback for complex pages.

**Consequences:**
- (+) Fast processing for standard documents (~6s)
- (+) High accuracy on tables (declarations pages, quotes)
- (+) Vision fallback handles edge cases
- (-) Two services to manage
- (-) Cost per page ($0.003 LlamaParse + token cost for Vision)

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

### ADR-005: OpenAI as Sole AI Provider (MVP)

**Status:** Accepted

**Context:** Could use multiple AI providers (OpenAI, Anthropic, etc.) but adds complexity.

**Decision:** Use OpenAI for LLM (GPT-4o) and embeddings (text-embedding-3-small) for MVP.

**Consequences:**
- (+) Single API key, single bill, single SDK
- (+) Proven accuracy for document tasks
- (+) Large ecosystem and documentation
- (-) Single point of failure
- (-) No provider redundancy
- Future: Can add Claude as fallback post-MVP

---

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: 2025-11-24_
_For: Sam_
