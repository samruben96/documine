# Project: docuMINE

## Project Structure

- **Git repository location:** `/Users/samruben/sams-tool/documine` (NOT the parent `sams-tool` folder)
- **BMAD docs location:** `/Users/samruben/sams-tool/docs` and `/Users/samruben/sams-tool/.bmad`
- **Sprint artifacts:** `/Users/samruben/sams-tool/docs/sprint-artifacts`

## Key Paths

```
sams-tool/
├── .bmad/                    # BMAD framework files
├── docs/                     # Project documentation & sprint artifacts
│   └── sprint-artifacts/     # Stories, tech specs, sprint status
└── documine/                 # ← MAIN CODE REPO (git root is here)
    ├── src/
    ├── __tests__/
    ├── package.json
    └── .git/
```

## Git Commands

Always run git commands from `/Users/samruben/sams-tool/documine`, not the parent directory.

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

- **Local development:** `docker-compose up docling` then set `DOCLING_SERVICE_URL=http://localhost:8000`
- **TypeScript client:** `src/lib/docling/client.ts`
- **Edge Function:** `supabase/functions/process-document/index.ts`

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
- `docling-service/` (new Python service)

**Environment Variable:** `DOCLING_SERVICE_URL` replaces `LLAMA_CLOUD_API_KEY`
