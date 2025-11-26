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
