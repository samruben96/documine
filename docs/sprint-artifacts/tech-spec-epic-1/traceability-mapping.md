# Traceability Mapping

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
