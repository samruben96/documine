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

## Known Issues / Bug Fixes

### LlamaParse Page Separator (Fixed 2025-11-30)

**Issue:** All documents showed `page_count=1` regardless of actual page count.

**Root Cause:** LlamaParse API uses `{pageNumber}` (camelCase) for the page separator placeholder, but code used `{page_number}` (snake_case).

**Fix:** Changed placeholder in both files:
- `supabase/functions/process-document/index.ts` (line 338)
- `src/lib/llamaparse/client.ts` (line 107)

**Reference:** LlamaIndex GitHub issues #537, #721
