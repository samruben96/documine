# Project: docuMINE

## GitHub Repositories

| Repo | Purpose | URL |
|------|---------|-----|
| **documine** (main) | Next.js app, TypeScript code | https://github.com/samruben96/documine |
| **docling-for-documine** | Python Docling service | https://github.com/samruben96/docling-for-documine |

## Deployments

| Service | Platform | URL |
|---------|----------|-----|
| Docling Service | Railway | https://docling-for-documine-production.up.railway.app |
| Supabase | Supabase Cloud | Project ID: `qfhzvkqbbtxvmwiixlhf` |

## Project Structure

Everything is inside the `documine` directory (git repo root):

- **Git repository:** `/Users/samruben/sams-tool/documine`
- **BMAD framework:** `/.bmad/` (local only, mostly gitignored)
- **BMAD project config:** `/.bmad/bmm/config.yaml` (tracked)
- **Project docs:** `/docs/` (tracked - all project artifacts)
- **Sprint artifacts:** `/docs/sprint-artifacts/`
- **Source code:** `/src/`

## Key Paths

```
documine/                     # ← GIT ROOT
├── .bmad/                    # BMAD framework (mostly gitignored)
│   ├── _cfg/                 # gitignored (installer configs)
│   ├── core/                 # gitignored (framework engine)
│   ├── docs/                 # gitignored (framework docs)
│   └── bmm/
│       ├── agents/           # gitignored (stock personas)
│       ├── workflows/        # gitignored (stock workflows)
│       ├── docs/             # gitignored (module docs)
│       └── config.yaml       # TRACKED (project-specific)
├── docs/                     # TRACKED (all project artifacts)
│   ├── sprint-artifacts/     # Stories, tech specs, sprint status
│   ├── deployment/           # Deployment guides
│   ├── architecture.md
│   ├── prd.md
│   └── ...
├── src/                      # TRACKED (application code)
├── __tests__/                # TRACKED (test files)
├── supabase/                 # TRACKED (Supabase functions)
├── package.json
└── .git/
```

**BMAD Framework Note:** Framework files exist locally for BMAD operation but are gitignored (like `node_modules`). Only `config.yaml` is tracked. Project artifacts in `docs/` are always tracked.

## Git Commands

All git commands run from the `documine` directory.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Supabase (Auth + PostgreSQL + Storage)
- Tailwind CSS + shadcn/ui
- Vitest + React Testing Library
- Zod for validation
- React Hook Form

## Testing

- Run tests: `npm run test`
- Run build: `npm run build`
- Dev server: `npm run dev`

## BMAD Workflow

This project uses the BMAD Method for development. Stories are tracked in `docs/sprint-artifacts/sprint-status.yaml`.

## Supabase

- **Project ID:** `qfhzvkqbbtxvmwiixlhf`
- **Project Name:** Testing and messing
- **Region:** us-east-2

Use this project ID for Supabase MCP operations:
```
mcp__supabase__execute_sql(project_id: "qfhzvkqbbtxvmwiixlhf", ...)
mcp__supabase__deploy_edge_function(project_id: "qfhzvkqbbtxvmwiixlhf", ...)
```

## Document Processing

Document processing uses **Docling** (self-hosted) instead of LlamaParse. See `docs/deployment/docling.md` for deployment details.

- **Docling Service Repo:** https://github.com/samruben96/docling-for-documine
- **Production URL:** https://docling-for-documine-production.up.railway.app
- **TypeScript client:** `src/lib/docling/client.ts`
- **Edge Function:** `supabase/functions/process-document/index.ts`

**Local development:**
```bash
# Clone docling repo as sibling directory
cd .. && git clone https://github.com/samruben96/docling-for-documine.git
cd documine && docker-compose up docling
# Set DOCLING_SERVICE_URL=http://localhost:8000 in .env.local
```

## Known Issues / Bug Fixes

### LlamaParse Replaced by Docling (Story 4.8, 2025-11-30)

**Issue:** LlamaParse API had multiple issues:
- Page separator placeholder case sensitivity (`{pageNumber}` vs `{page_number}`)
- 75% table extraction accuracy insufficient for insurance documents
- API costs accumulated with scale

**Resolution:** Migrated to self-hosted Docling service:
- 97.9% table extraction accuracy (IBM TableFormer model)
- Zero API costs
- Full data privacy
- Same page marker format (`--- PAGE X ---`) for backward compatibility

**Files Changed:**
- `src/lib/docling/client.ts` (new - replaces llamaparse client)
- `src/lib/documents/chunking.ts` (updated import)
- `supabase/functions/process-document/index.ts` (updated to call Docling)
- Docling Python service in separate repo: https://github.com/samruben96/docling-for-documine

**Environment Variable:** `DOCLING_SERVICE_URL` replaces `LLAMA_CLOUD_API_KEY`

### Epic 5 Chat Integration Bug Fixes (2025-12-01)

Multiple bugs were discovered during Story 5.6 implementation and resolved:

#### 1. Document Viewer Not Loading (Spinning Forever)
**Issue:** Document viewer showed infinite loading spinner for ready documents.
**Cause:** Code checked `status !== 'completed'` but documents have status `'ready'`.
**Fix:** Changed to `status !== 'ready'` in `src/app/(dashboard)/documents/[id]/page.tsx`.

#### 2. Vector Search 404 Error
**Issue:** `match_document_chunks` RPC function returned 404 for similarity search.
**Cause:** Function's search_path excluded pgvector's `extensions` schema, making `<=>` operator unavailable.
**Fix:** Applied migration with `SET search_path = public, extensions` to include pgvector operators.

#### 3. Chat Request Validation Error (`conversationId: null`)
**Issue:** Chat API returned "Invalid request: expected string, received null".
**Cause:** `useChat` hook sent `conversationId: null` but Zod expected `string | undefined`.
**Fix:** Only include `conversationId` in request body when truthy in `src/hooks/use-chat.ts`.

#### 4. Chat 500 Error - Client/Server Boundary Violation
**Issue:** Chat API returned 500 error with message "Attempted to call calculateConfidence() from the server but calculateConfidence is on the client".
**Cause:** `calculateConfidence()` was defined in `'use client'` component (`confidence-badge.tsx`) but called from server-side API route.
**Fix:** Created shared server-compatible module `src/lib/chat/confidence.ts`:
- Extracted `ConfidenceLevel` type and `calculateConfidence()` function
- Updated client component to re-export from shared module (backward compatible)
- Updated all server-side files to import from shared module:
  - `src/lib/chat/types.ts`
  - `src/lib/chat/rag.ts`
  - `src/lib/chat/service.ts`
  - `src/lib/chat/openai-stream.ts`

**Key Learning:** In Next.js App Router, functions exported from `'use client'` files cannot be called from server-side code (API routes, server components). Pure utility functions should be in separate non-client modules.
