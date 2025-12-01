# Epic Technical Specification: Foundation & Infrastructure

Date: 2025-11-24
Author: Sam
Epic ID: 1
Status: Draft

---

## Overview

Epic 1 establishes the technical foundation for docuMINE, an AI-powered document analysis platform for independent insurance agents. This epic delivers the complete project scaffolding, database schema with multi-tenant Row Level Security, Supabase client configuration, storage bucket setup, error handling patterns, and deployment pipeline. Upon completion, the development environment will be fully operational, enabling all subsequent feature development.

This foundational work directly enables the platform's core value proposition: trustworthy AI document analysis with source citations and confidence scoring. The architecture prioritizes accuracy-first responses, multi-tenant agency isolation, and zero-learning-curve user experience.

## Objectives and Scope

**In Scope:**
- Next.js 15 (App Router) project initialization with TypeScript strict mode
- Supabase integration: PostgreSQL database, pgvector extension, Storage, Auth
- Complete database schema with 7 core tables (agencies, users, documents, document_chunks, conversations, chat_messages, processing_jobs)
- Row Level Security policies for multi-tenant agency isolation
- Supabase client configuration for browser, server, and middleware contexts
- Storage bucket with agency-scoped policies
- Error handling framework with custom error classes and consistent API response format
- Structured logging utility
- Deployment pipeline to Vercel with preview deployments
- Security headers configuration

**Out of Scope:**
- User authentication UI (Epic 2)
- Document upload functionality (Epic 4)
- AI/LLM integration with OpenAI and LlamaParse (Epic 4, 5)
- Chat interface and Q&A features (Epic 5)
- Quote comparison features (Epic 6)
- Agency management UI (Epic 3)
- Email integration with Resend (Epic 2)

## System Architecture Alignment

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

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs | Location |
|--------|---------------|--------|---------|----------|
| Supabase Browser Client | Client-side database operations | Environment vars, user session | Typed Supabase client | `src/lib/supabase/client.ts` |
| Supabase Server Client | Server-side database operations | Environment vars, cookies | Typed Supabase client with service role | `src/lib/supabase/server.ts` |
| Auth Middleware | Session refresh, route protection | Request object | Modified response with session | `src/middleware.ts` |
| Error Classes | Typed application errors | Error context | Structured error objects | `src/lib/errors.ts` |
| API Response Helpers | Consistent response formatting | Data or error | Standardized JSON response | `src/lib/utils/api-response.ts` |
| Logger | Structured JSON logging | Log level, message, data | Console output (JSON formatted) | `src/lib/utils/logger.ts` |
| Storage Utils | Document file operations | File, agency/document IDs | Storage paths, signed URLs | `src/lib/utils/storage.ts` |

### Data Models and Contracts

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

### APIs and Interfaces

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

### Workflows and Sequencing

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

## Non-Functional Requirements

### Performance

| Requirement | Target | Source |
|-------------|--------|--------|
| Database query latency | < 100ms for simple queries | Architecture spec |
| pgvector similarity search | < 500ms for top-5 chunks | Architecture spec |
| Page load (SSR) | < 1s initial load | NFR5 |
| Build time | < 3 minutes | Development workflow |

**Implementation:**
- Use connection pooling via Supabase
- IVFFlat index on embeddings with 100 lists
- Enable ISR where applicable
- Minimize bundle size

### Security

| Requirement | Implementation | Source |
|-------------|----------------|--------|
| Data in transit | TLS 1.2+ (Vercel + Supabase managed) | NFR6 |
| Data at rest | AES-256 (Supabase managed) | NFR7 |
| Tenant isolation | RLS policies with agency_id | NFR10 |
| API key protection | Environment variables, server-only | Architecture spec |
| Session management | httpOnly cookies, auto-refresh | NFR9 |

**RLS Policy Summary:**
```sql
-- All tables enforce agency_id matching authenticated user's agency
-- processing_jobs: service_role only (Edge Functions)
-- Storage: folder-based policies matching agency_id
```

### Reliability/Availability

| Requirement | Target | Implementation |
|-------------|--------|----------------|
| Uptime | 99.5% during business hours | Vercel + Supabase SLA |
| Data durability | No document loss | Supabase Storage redundancy |
| Graceful degradation | Partial outage handling | Error boundaries, fallback states |

**Implementation:**
- Vercel handles infrastructure availability
- Supabase provides managed PostgreSQL with automatic backups
- Error boundaries catch React errors and show recovery UI
- All database operations wrapped in try-catch

### Observability

| Signal | Implementation | Location |
|--------|----------------|----------|
| Structured logs | JSON format with timestamp, level, context | `src/lib/utils/logger.ts` |
| Error tracking | Console logging (upgrade to Sentry post-MVP) | Error handlers |
| Request logging | Next.js built-in + custom middleware | `src/middleware.ts` |

**Log Format:**
```json
{
  "level": "info|warn|error",
  "message": "Description",
  "timestamp": "ISO-8601",
  "documentId": "optional-context",
  "agencyId": "optional-context",
  "stack": "error-stack-trace-if-applicable"
}
```

## Dependencies and Integrations

### NPM Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| next | 15.x | React framework |
| react | 19.x | UI library |
| typescript | 5.x | Type safety |
| tailwindcss | 3.x | Styling |
| @supabase/supabase-js | latest | Supabase client |
| @supabase/ssr | latest | SSR utilities |
| zod | latest | Schema validation |
| openai | latest | AI client (installed but not used until Epic 4-5) |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| eslint | latest | Code linting |
| @types/node | latest | Node.js types |
| supabase | latest | CLI tools |

### External Services

| Service | Purpose | Configuration |
|---------|---------|---------------|
| Supabase | Database, Storage, Auth | Project URL + keys |
| Vercel | Deployment | GitHub integration |

### Environment Variables

```bash
# Required for all environments
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase anon key (public)
SUPABASE_SERVICE_ROLE_KEY=        # Supabase service role (server-only)

# Required but not used until Epic 4-5
OPENAI_API_KEY=                   # OpenAI API key
LLAMA_CLOUD_API_KEY=              # LlamaParse API key
RESEND_API_KEY=                   # Email service (Epic 2)
```

## Acceptance Criteria (Authoritative)

### Story 1.1: Project Initialization & Core Setup

1. **AC-1.1.1:** Next.js 15 app created with TypeScript strict mode, Tailwind CSS, ESLint, and App Router structure
2. **AC-1.1.2:** Supabase client libraries installed and configured
3. **AC-1.1.3:** shadcn/ui initialized with base components (Button, Input, Card, Dialog, Table, Tabs, Toast)
4. **AC-1.1.4:** Project structure matches Architecture spec (`src/app/`, `src/components/`, `src/lib/`, `src/hooks/`, `src/types/`)
5. **AC-1.1.5:** Environment variables template (`.env.example`) contains all required keys
6. **AC-1.1.6:** Project builds successfully with `npm run build`

### Story 1.2: Database Schema & RLS Policies

7. **AC-1.2.1:** All 7 tables created with correct columns, types, and foreign key relationships
8. **AC-1.2.2:** pgvector extension enabled with 1536-dimension vector support
9. **AC-1.2.3:** All indexes created as specified (agency, document, embedding, conversation, processing_jobs)
10. **AC-1.2.4:** RLS enabled on all tables with agency-scoped policies
11. **AC-1.2.5:** TypeScript types generated from schema (`src/types/database.types.ts`)
12. **AC-1.2.6:** Cross-tenant data access is blocked (verified via test)

### Story 1.3: Supabase Client Configuration

13. **AC-1.3.1:** Browser client (`client.ts`) available with proper typing for client components
14. **AC-1.3.2:** Server client (`server.ts`) handles cookies correctly for SSR
15. **AC-1.3.3:** Middleware refreshes expired sessions automatically
16. **AC-1.3.4:** Dashboard routes protected (redirect to login if unauthenticated)
17. **AC-1.3.5:** Public routes accessible without authentication

### Story 1.4: Storage Bucket Configuration

18. **AC-1.4.1:** `documents` bucket created with 50MB file size limit and PDF-only MIME type
19. **AC-1.4.2:** Storage policies enforce agency isolation (upload, read, delete)
20. **AC-1.4.3:** Helper functions exist: `uploadDocument()`, `getDocumentUrl()`, `deleteDocument()`
21. **AC-1.4.4:** Signed URLs generated with 1-hour expiry

### Story 1.5: Error Handling & Logging Patterns

22. **AC-1.5.1:** Custom error classes defined (DocumentNotFoundError, UnauthorizedError, ProcessingError, ValidationError)
23. **AC-1.5.2:** API routes return consistent response format (`{ data, error }`)
24. **AC-1.5.3:** Structured logger implemented with info, error, warn methods
25. **AC-1.5.4:** Error boundaries catch unhandled React errors with recovery UI

### Story 1.6: Deployment Pipeline Setup

26. **AC-1.6.1:** Production deployment works via Vercel
27. **AC-1.6.2:** Preview deployments created for each PR
28. **AC-1.6.3:** Environment variables configured in Vercel dashboard
29. **AC-1.6.4:** Security headers configured (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
30. **AC-1.6.5:** Supabase migrations can be pushed via `npx supabase db push`

## Traceability Mapping

| AC | Spec Section | Component(s) | Test Idea |
|----|--------------|--------------|-----------|
| AC-1.1.1 | Project Initialization | `package.json`, `tsconfig.json`, `tailwind.config.ts` | Verify strict mode enabled, Tailwind configured |
| AC-1.1.2 | Project Initialization | `src/lib/supabase/*` | Import and instantiate client |
| AC-1.1.3 | Project Initialization | `src/components/ui/*` | Render each shadcn component |
| AC-1.1.4 | Project Initialization | Directory structure | Verify all directories exist |
| AC-1.1.5 | Project Initialization | `.env.example` | Check all keys documented |
| AC-1.1.6 | Project Initialization | Build output | Run `npm run build`, verify success |
| AC-1.2.1 | Data Models | `supabase/migrations/00001_*` | Query each table, verify columns |
| AC-1.2.2 | Data Models | `supabase/migrations/00002_*` | Insert and query vector column |
| AC-1.2.3 | Data Models | `supabase/migrations/00001_*` | Explain query plan shows index usage |
| AC-1.2.4 | Data Models | `supabase/migrations/00003_*` | Attempt cross-tenant query, expect empty |
| AC-1.2.5 | Data Models | `src/types/database.types.ts` | TypeScript compiles without errors |
| AC-1.2.6 | Data Models | RLS policies | Create two agencies, verify isolation |
| AC-1.3.1 | APIs and Interfaces | `src/lib/supabase/client.ts` | Use in client component, verify typed |
| AC-1.3.2 | APIs and Interfaces | `src/lib/supabase/server.ts` | Use in server component, verify session |
| AC-1.3.3 | APIs and Interfaces | `src/middleware.ts` | Simulate expired session, verify refresh |
| AC-1.3.4 | APIs and Interfaces | `src/middleware.ts` | Access /documents unauthenticated, verify redirect |
| AC-1.3.5 | APIs and Interfaces | `src/middleware.ts` | Access /login, verify accessible |
| AC-1.4.1 | APIs and Interfaces | Supabase Storage config | Attempt 60MB upload, expect rejection |
| AC-1.4.2 | APIs and Interfaces | Storage policies | Upload as Agency A, read as Agency B, expect failure |
| AC-1.4.3 | APIs and Interfaces | `src/lib/utils/storage.ts` | Call each function, verify behavior |
| AC-1.4.4 | APIs and Interfaces | `getDocumentUrl()` | Verify URL expires after 1 hour |
| AC-1.5.1 | APIs and Interfaces | `src/lib/errors.ts` | Throw each error, verify code property |
| AC-1.5.2 | APIs and Interfaces | API routes | Call API, verify response shape |
| AC-1.5.3 | APIs and Interfaces | `src/lib/utils/logger.ts` | Log at each level, verify JSON output |
| AC-1.5.4 | APIs and Interfaces | Error boundaries | Trigger error, verify recovery UI |
| AC-1.6.1 | Deployment | Vercel dashboard | Deploy to production, verify accessible |
| AC-1.6.2 | Deployment | Vercel PR integration | Open PR, verify preview URL created |
| AC-1.6.3 | Deployment | Vercel dashboard | Verify all env vars set |
| AC-1.6.4 | Deployment | `next.config.js` | Check response headers in browser |
| AC-1.6.5 | Deployment | Supabase CLI | Run `db push`, verify migrations applied |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| R1: pgvector performance at scale | Query latency exceeds targets | Low | IVFFlat index, filter by document_id first |
| R2: RLS policy complexity | Security gaps or performance issues | Medium | Thorough testing, simple policy patterns |
| R3: Supabase Edge Function timeouts | Document processing fails | Medium | Chunked processing, retry logic |
| R4: Environment variable exposure | Security breach | Low | Server-only for sensitive keys |

### Assumptions

| Assumption | Rationale |
|------------|-----------|
| A1: Supabase local development via Docker works on developer machines | Standard Supabase workflow |
| A2: OpenAI embedding dimensions remain 1536 | Current standard for text-embedding-3-small |
| A3: Vercel-Supabase latency is acceptable | Both services in AWS us-east-1 |
| A4: 50MB file limit sufficient for insurance PDFs | Most policies < 20MB |

### Open Questions

| Question | Owner | Status |
|----------|-------|--------|
| Q1: Should we use Supabase branching for preview environments? | Sam | Defer to post-MVP |
| Q2: Rate limiting implementation - Upstash or custom? | Sam | Decision needed before Epic 2 |
| Q3: Error monitoring service selection (Sentry vs alternatives)? | Sam | Defer to post-MVP |

## Test Strategy Summary

### Test Levels

| Level | Scope | Framework | Coverage |
|-------|-------|-----------|----------|
| Unit | Utility functions, error classes | Jest/Vitest | Error handling, logging, storage utils |
| Integration | Database operations, RLS | Supabase local | All CRUD operations, policy enforcement |
| E2E | Route protection, auth flow | Playwright (post-MVP) | Critical paths |

### Key Test Scenarios

**Database & RLS:**
- Create agency with users, verify isolation
- Attempt cross-tenant document access, verify blocked
- Insert vector data, verify similarity search works

**Client Configuration:**
- Browser client connects and queries
- Server client handles authenticated requests
- Middleware redirects unauthenticated users

**Storage:**
- Upload PDF within size limit
- Reject non-PDF files
- Verify signed URL expiration

**Error Handling:**
- API returns consistent error format
- Logger outputs valid JSON
- Error boundaries catch and display recovery UI

### Definition of Done

- [ ] All acceptance criteria verified
- [ ] TypeScript compiles without errors
- [ ] Build succeeds (`npm run build`)
- [ ] Local development environment works (`npm run dev`)
- [ ] Migrations apply cleanly
- [ ] RLS policies tested manually
- [ ] Code reviewed and merged
- [ ] Documentation updated

---

_Generated by BMAD Epic Tech Context Workflow_
_Date: 2025-11-24_
