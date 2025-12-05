# Detailed Design

## Services and Modules

| Module | Responsibility | Inputs | Outputs | Location |
|--------|---------------|--------|---------|----------|
| Supabase Browser Client | Client-side database operations | Environment vars, user session | Typed Supabase client | `src/lib/supabase/client.ts` |
| Supabase Server Client | Server-side database operations | Environment vars, cookies | Typed Supabase client with service role | `src/lib/supabase/server.ts` |
| Auth Middleware | Session refresh, route protection | Request object | Modified response with session | `src/middleware.ts` |
| Error Classes | Typed application errors | Error context | Structured error objects | `src/lib/errors.ts` |
| API Response Helpers | Consistent response formatting | Data or error | Standardized JSON response | `src/lib/utils/api-response.ts` |
| Logger | Structured JSON logging | Log level, message, data | Console output (JSON formatted) | `src/lib/utils/logger.ts` |
| Storage Utils | Document file operations | File, agency/document IDs | Storage paths, signed URLs | `src/lib/utils/storage.ts` |

## Data Models and Contracts

**Core Tables:**

```sql
-- Agencies (tenants)
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subscription_tier TEXT NOT NULL DEFAULT 'starter',
  seat_limit INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin' | 'member'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  filename TEXT NOT NULL,
  display_name TEXT,
  storage_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing', -- 'processing' | 'ready' | 'failed'
  page_count INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Document chunks (for vector search)
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id),
  content TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  chunk_index INTEGER NOT NULL,
  bounding_box JSONB, -- {x, y, width, height}
  embedding VECTOR(1536) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chat conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  document_id UUID NOT NULL REFERENCES documents(id),
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id),
  role TEXT NOT NULL, -- 'user' | 'assistant'
  content TEXT NOT NULL,
  sources JSONB, -- Array of source citations
  confidence TEXT, -- 'high' | 'needs_review' | 'not_found'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Processing jobs queue
CREATE TABLE processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'processing' | 'completed' | 'failed'
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Indexes:**

```sql
CREATE INDEX idx_documents_agency ON documents(agency_id);
CREATE INDEX idx_document_chunks_document ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_embedding ON document_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_conversations_document ON conversations(document_id);
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX idx_processing_jobs_status ON processing_jobs(status) WHERE status = 'pending';
```

**TypeScript Types (Generated):**

```typescript
// src/types/database.types.ts (auto-generated via supabase gen types)
export type Database = {
  public: {
    Tables: {
      agencies: { /* ... */ };
      users: { /* ... */ };
      documents: { /* ... */ };
      document_chunks: { /* ... */ };
      conversations: { /* ... */ };
      chat_messages: { /* ... */ };
      processing_jobs: { /* ... */ };
    };
  };
};
```

## APIs and Interfaces

**Error Classes:**

```typescript
// src/lib/errors.ts
export class DocumentNotFoundError extends Error {
  code = 'DOCUMENT_NOT_FOUND' as const;
  constructor(documentId: string) {
    super(`Document ${documentId} not found`);
  }
}

export class UnauthorizedError extends Error {
  code = 'UNAUTHORIZED' as const;
  constructor(message = 'Unauthorized') {
    super(message);
  }
}

export class ProcessingError extends Error {
  code = 'PROCESSING_ERROR' as const;
  constructor(message: string) {
    super(message);
  }
}

export class ValidationError extends Error {
  code = 'VALIDATION_ERROR' as const;
  constructor(message: string) {
    super(message);
  }
}
```

**API Response Format:**

```typescript
// src/lib/utils/api-response.ts
export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { code: string; message: string; details?: unknown } };

export function successResponse<T>(data: T): Response {
  return Response.json({ data, error: null });
}

export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: unknown
): Response {
  return Response.json(
    { data: null, error: { code, message, details } },
    { status }
  );
}
```

**Storage Utilities:**

```typescript
// src/lib/utils/storage.ts
export async function uploadDocument(
  supabase: SupabaseClient,
  file: File,
  agencyId: string,
  documentId: string
): Promise<string>;

export async function getDocumentUrl(
  supabase: SupabaseClient,
  storagePath: string
): Promise<string>; // Returns signed URL (1 hour expiry)

export async function deleteDocument(
  supabase: SupabaseClient,
  storagePath: string
): Promise<void>;
```

## Workflows and Sequencing

**Project Initialization Flow:**

```
1. Create Next.js app with TypeScript, Tailwind, ESLint, App Router
   └─> npx create-next-app@latest documine --typescript --tailwind --eslint --app --src-dir

2. Initialize Supabase
   └─> npm install @supabase/supabase-js @supabase/ssr
   └─> npx supabase init
   └─> npx supabase start (local Docker)

3. Add UI components
   └─> npx shadcn@latest init
   └─> npx shadcn@latest add button input card dialog table tabs toast

4. Add dependencies
   └─> npm install openai zod
   └─> npm install --save-dev @types/node

5. Configure TypeScript strict mode
   └─> Update tsconfig.json

6. Create project structure
   └─> Create directories per Architecture spec
```

**Database Migration Flow:**

```
Migration 00001: Initial schema
└─> Create all 7 tables with columns, types, and foreign keys

Migration 00002: Enable pgvector
└─> CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

Migration 00003: RLS policies
└─> Enable RLS on all tables
└─> Create agency-scoped policies
└─> Create storage policies

Post-migration:
└─> npx supabase gen types typescript --local > src/types/database.types.ts
```

**Client Configuration Flow:**

```
Browser Request
  │
  ├─> src/lib/supabase/client.ts
  │   └─> createBrowserClient()
  │   └─> Uses NEXT_PUBLIC_* env vars
  │   └─> Returns typed client for client components
  │
Server Request
  │
  ├─> src/lib/supabase/server.ts
  │   └─> createServerClient()
  │   └─> Handles cookies for SSR
  │   └─> Returns typed client for server components/API routes
  │
Middleware (every request)
  │
  ├─> src/middleware.ts
  │   └─> Refreshes session if needed
  │   └─> Protects dashboard routes
  │   └─> Allows public routes
```
