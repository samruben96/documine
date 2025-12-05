# Acceptance Criteria (Authoritative)

## Story 1.1: Project Initialization & Core Setup

1. **AC-1.1.1:** Next.js 15 app created with TypeScript strict mode, Tailwind CSS, ESLint, and App Router structure
2. **AC-1.1.2:** Supabase client libraries installed and configured
3. **AC-1.1.3:** shadcn/ui initialized with base components (Button, Input, Card, Dialog, Table, Tabs, Toast)
4. **AC-1.1.4:** Project structure matches Architecture spec (`src/app/`, `src/components/`, `src/lib/`, `src/hooks/`, `src/types/`)
5. **AC-1.1.5:** Environment variables template (`.env.example`) contains all required keys
6. **AC-1.1.6:** Project builds successfully with `npm run build`

## Story 1.2: Database Schema & RLS Policies

7. **AC-1.2.1:** All 7 tables created with correct columns, types, and foreign key relationships
8. **AC-1.2.2:** pgvector extension enabled with 1536-dimension vector support
9. **AC-1.2.3:** All indexes created as specified (agency, document, embedding, conversation, processing_jobs)
10. **AC-1.2.4:** RLS enabled on all tables with agency-scoped policies
11. **AC-1.2.5:** TypeScript types generated from schema (`src/types/database.types.ts`)
12. **AC-1.2.6:** Cross-tenant data access is blocked (verified via test)

## Story 1.3: Supabase Client Configuration

13. **AC-1.3.1:** Browser client (`client.ts`) available with proper typing for client components
14. **AC-1.3.2:** Server client (`server.ts`) handles cookies correctly for SSR
15. **AC-1.3.3:** Middleware refreshes expired sessions automatically
16. **AC-1.3.4:** Dashboard routes protected (redirect to login if unauthenticated)
17. **AC-1.3.5:** Public routes accessible without authentication

## Story 1.4: Storage Bucket Configuration

18. **AC-1.4.1:** `documents` bucket created with 50MB file size limit and PDF-only MIME type
19. **AC-1.4.2:** Storage policies enforce agency isolation (upload, read, delete)
20. **AC-1.4.3:** Helper functions exist: `uploadDocument()`, `getDocumentUrl()`, `deleteDocument()`
21. **AC-1.4.4:** Signed URLs generated with 1-hour expiry

## Story 1.5: Error Handling & Logging Patterns

22. **AC-1.5.1:** Custom error classes defined (DocumentNotFoundError, UnauthorizedError, ProcessingError, ValidationError)
23. **AC-1.5.2:** API routes return consistent response format (`{ data, error }`)
24. **AC-1.5.3:** Structured logger implemented with info, error, warn methods
25. **AC-1.5.4:** Error boundaries catch unhandled React errors with recovery UI

## Story 1.6: Deployment Pipeline Setup

26. **AC-1.6.1:** Production deployment works via Vercel
27. **AC-1.6.2:** Preview deployments created for each PR
28. **AC-1.6.3:** Environment variables configured in Vercel dashboard
29. **AC-1.6.4:** Security headers configured (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
30. **AC-1.6.5:** Supabase migrations can be pushed via `npx supabase db push`
