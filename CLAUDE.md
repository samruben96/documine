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

- **Git repository location:** `/Users/samruben/sams-tool/documine` (NOT the parent `sams-tool` folder)
- **BMAD docs location:** `/Users/samruben/sams-tool/docs` and `/Users/samruben/sams-tool/.bmad`
- **Sprint artifacts:** `/Users/samruben/sams-tool/docs/sprint-artifacts`

## Key Paths

```
sams-tool/
├── .bmad/                    # BMAD framework files
├── docs/                     # Project documentation & sprint artifacts
│   └── sprint-artifacts/     # Stories, tech specs, sprint status
├── docling-for-documine/     # Docling service (separate git repo)
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
