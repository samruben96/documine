# Epic 1: Foundation & Infrastructure

> **Related:** Story files at [`docs/sprint-artifacts/epics/epic-1/stories/`](../sprint-artifacts/epics/epic-1/stories/)

**Goal:** Establish the technical foundation enabling all subsequent development. This epic sets up the Next.js + Supabase stack, database schema, authentication infrastructure, and deployment pipeline.

**User Value:** While not directly user-facing, this epic enables the entire platform to exist. Without it, nothing else can be built.

**FRs Addressed:** FR31 (browser compatibility), FR33 (processing queue foundation), FR34 (error handling patterns)

---

## Story 1.1: Project Initialization & Core Setup

As a **developer**,
I want **the project scaffolded with Next.js, Supabase, and core dependencies**,
So that **I have a working foundation to build features on**.

**Acceptance Criteria:**

**Given** no project exists
**When** the initialization script runs
**Then** a Next.js 15 app is created with:
- TypeScript in strict mode
- Tailwind CSS configured
- ESLint configured
- App Router (`/src/app`) structure
- Supabase client libraries installed (`@supabase/supabase-js`, `@supabase/ssr`)
- shadcn/ui initialized with base components (Button, Input, Card, Dialog, Table, Tabs, Toast)
- OpenAI and LlamaParse client libraries installed
- Resend email library installed
- Zod for validation

**And** the project structure matches Architecture spec:
```
src/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   └── api/
├── components/
│   ├── ui/
│   ├── chat/
│   ├── documents/
│   └── layout/
├── lib/
│   ├── supabase/
│   ├── openai/
│   └── utils/
├── hooks/
└── types/
```

**And** environment variables template (`.env.example`) is created with all required keys:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `LLAMA_CLOUD_API_KEY`
- `RESEND_API_KEY`

**Prerequisites:** None (first story)

**Technical Notes:**
- Run `npx create-next-app@latest documine --typescript --tailwind --eslint --app --src-dir`
- Initialize Supabase with `npx supabase init`
- Add shadcn/ui components per Architecture spec
- Configure TypeScript strict mode in `tsconfig.json`
- Set up path aliases (`@/` for `src/`)

---

## Story 1.2: Database Schema & RLS Policies

As a **developer**,
I want **the complete database schema with Row Level Security policies**,
So that **data is properly structured and multi-tenant isolation is enforced at the database level**.

**Acceptance Criteria:**

**Given** Supabase is initialized locally
**When** migrations are applied
**Then** the following tables exist with correct columns and types:
- `agencies` (id, name, subscription_tier, seat_limit, created_at, updated_at)
- `users` (id references auth.users, agency_id, email, full_name, role, created_at, updated_at)
- `documents` (id, agency_id, uploaded_by, filename, storage_path, status, page_count, metadata, created_at, updated_at)
- `document_chunks` (id, document_id, agency_id, content, page_number, chunk_index, bounding_box, embedding vector(1536), created_at)
- `conversations` (id, agency_id, document_id, user_id, created_at, updated_at)
- `chat_messages` (id, conversation_id, agency_id, role, content, sources, confidence, created_at)
- `processing_jobs` (id, document_id, status, error_message, started_at, completed_at, created_at)

**And** pgvector extension is enabled with `create extension if not exists vector with schema extensions`

**And** indexes are created:
- `idx_documents_agency` on documents(agency_id)
- `idx_document_chunks_document` on document_chunks(document_id)
- `idx_document_chunks_embedding` using ivfflat for vector similarity search
- `idx_conversations_document` on conversations(document_id)
- `idx_chat_messages_conversation` on chat_messages(conversation_id)
- `idx_processing_jobs_status` on processing_jobs(status) where pending

**And** RLS policies enforce agency isolation:
- Users can only see/modify data where `agency_id` matches their own
- Processing jobs accessible only to service role
- All tables have RLS enabled

**And** TypeScript types are generated via `npx supabase gen types typescript --local > src/lib/database.types.ts`

**Prerequisites:** Story 1.1

**Technical Notes:**
- Create migrations in `supabase/migrations/` numbered sequentially
- Migration 1: Initial schema
- Migration 2: Enable pgvector
- Migration 3: RLS policies
- Test RLS policies prevent cross-tenant access
- Reference Architecture doc section "Data Architecture" for exact SQL

---

## Story 1.3: Supabase Client Configuration

As a **developer**,
I want **properly configured Supabase clients for browser and server contexts**,
So that **database operations work correctly in all Next.js environments**.

**Acceptance Criteria:**

**Given** Supabase is configured
**When** importing from `@/lib/supabase`
**Then** browser client (`client.ts`) is available for client components:
- Uses `createBrowserClient` from `@supabase/ssr`
- Configured with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Properly typed with generated database types

**And** server client (`server.ts`) is available for server components and API routes:
- Uses `createServerClient` from `@supabase/ssr`
- Handles cookies correctly for SSR
- Supports service role key for admin operations

**And** middleware (`middleware.ts`) handles auth session refresh:
- Refreshes expired sessions automatically
- Protects dashboard routes (redirects to login if unauthenticated)
- Allows public routes (landing, login, signup, reset-password)

**And** type safety is enforced:
- All Supabase operations use generated `Database` types
- TypeScript errors if accessing wrong table/column names

**Prerequisites:** Story 1.2

**Technical Notes:**
- Follow Supabase SSR guide for Next.js App Router
- Middleware should be in `src/middleware.ts`
- Export typed clients for consistent usage across codebase
- Test that RLS policies work with authenticated user context

---

## Story 1.4: Storage Bucket Configuration

As a **developer**,
I want **Supabase Storage configured for document uploads with agency-scoped policies**,
So that **files are stored securely with proper access controls**.

**Acceptance Criteria:**

**Given** Supabase is configured
**When** storage is set up
**Then** a `documents` bucket exists with:
- Path structure: `{agency_id}/{document_id}/{filename}`
- File size limit: 50MB
- Allowed MIME types: `application/pdf`

**And** storage policies enforce agency isolation:
- Users can upload to their agency folder only
- Users can read from their agency folder only
- Users can delete from their agency folder only

**And** helper functions exist in `@/lib/utils/storage.ts`:
- `uploadDocument(file, agencyId, documentId)` - returns storage path
- `getDocumentUrl(storagePath)` - returns signed URL (1 hour expiry)
- `deleteDocument(storagePath)` - removes file from storage

**Prerequisites:** Story 1.2

**Technical Notes:**
- Create bucket via Supabase dashboard or migration
- Use `storage.foldername(name)[1]` to extract agency_id from path in policies
- Signed URLs prevent direct public access while allowing authenticated viewing
- Test that cross-agency file access is blocked

---

## Story 1.5: Error Handling & Logging Patterns

As a **developer**,
I want **consistent error handling and structured logging across the application**,
So that **errors are handled gracefully and debugging is straightforward**.

**Acceptance Criteria:**

**Given** the error handling module exists
**When** errors occur anywhere in the application
**Then** custom error classes are used:
```typescript
class DocumentNotFoundError extends Error { code = 'DOCUMENT_NOT_FOUND' }
class UnauthorizedError extends Error { code = 'UNAUTHORIZED' }
class ProcessingError extends Error { code = 'PROCESSING_ERROR' }
class ValidationError extends Error { code = 'VALIDATION_ERROR' }
```

**And** API routes return consistent response format:
```typescript
// Success: { data: T, error: null }
// Error: { data: null, error: { code: string, message: string, details?: unknown } }
```

**And** structured logging is implemented in `@/lib/utils/logger.ts`:
- `log.info(message, data)` - JSON formatted with timestamp
- `log.error(message, error, data)` - includes stack trace
- `log.warn(message, data)` - for non-critical issues

**And** error boundaries exist:
- Global error boundary catches unhandled React errors
- Shows user-friendly error message with retry option
- Logs error details for debugging

**Prerequisites:** Story 1.1

**Technical Notes:**
- Place error classes in `@/lib/errors.ts`
- Create `@/lib/utils/api-response.ts` with helper functions
- Use Next.js `error.tsx` files for error boundaries
- Log format: `{ level, message, timestamp, ...data }`

---

## Story 1.6: Deployment Pipeline Setup

As a **developer**,
I want **the application deployable to Vercel with preview deployments**,
So that **changes can be tested and shipped reliably**.

**Acceptance Criteria:**

**Given** the codebase is in a Git repository
**When** connected to Vercel
**Then** production deployment works:
- Builds successfully with `npm run build`
- Environment variables configured in Vercel dashboard
- Domain configured (or using Vercel subdomain)

**And** preview deployments work:
- Each PR gets a preview URL
- Preview uses separate Supabase project (or staging branch)

**And** Supabase deployment is configured:
- Production project created on Supabase cloud
- Migrations can be pushed via `npx supabase db push`
- Edge Functions can be deployed via `npx supabase functions deploy`

**And** security headers are configured in `next.config.js`:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

**Prerequisites:** Story 1.3

**Technical Notes:**
- Create Vercel project and link to repository
- Set all environment variables in Vercel
- Consider Supabase branching for preview environments (optional for MVP)
- Verify CORS settings allow Vercel domains

---
