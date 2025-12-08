# Project: docuMINE

> **Documentation has been sharded for reduced context usage.**
> See: `docs/claude-md/index.md` for full reference.

## CRITICAL: ONE APPLICATION

**docuMINE is ONE application with multiple feature modules.** AI Buddy, Reporting, and Quoting are NOT separate products - they are features being added to the existing docuMINE codebase.

All features share:
- Same codebase and repository
- Same Supabase project (`nxuzurxiaismssiiydst`)
- Same authentication system
- Same UI components (shadcn/ui)
- Same deployment (Vercel)

## Quick Reference

| Resource | Location |
|----------|----------|
| **Feature Roadmap** | `docs/features/index.md` |
| GitHub Repos | `docs/claude-md/github-repositories.md` |
| Deployments | `docs/claude-md/deployments.md` |
| Project Structure | `docs/claude-md/project-structure.md` |
| Tech Stack | `docs/claude-md/tech-stack.md` |
| Supabase | `docs/claude-md/supabase.md` |
| Known Issues | `docs/claude-md/known-issues-bug-fixes.md` |
| Epic 8-10 Notes | `docs/claude-md/epic-*.md` |

## Feature Planning Documentation

**Feature planning docs (PRD, UX Design) live in `docs/features/`:**

```
docs/features/
├── index.md                    # Feature roadmap & overview
├── ai-buddy/                   # Phase 1: AI Assistant feature
├── reporting/                  # Phase 2: Custom Reporting feature
├── quoting/                    # Phase 3 & 4: Multi-Carrier Quoting feature
└── research/                   # Technical research
```

**Implementation (epics/stories) goes in the SAME place as all docuMINE features:**
- Epic 14+ for new features → `docs/sprint-artifacts/epics/epic-{N}/`

When creating PRDs, architecture docs, UX designs for feature planning:
- **AI Buddy** → `docs/features/ai-buddy/`
- **Custom Reporting** → `docs/features/reporting/`
- **Quoting features** → `docs/features/quoting/`
- **Research** → `docs/features/research/`

When ready to implement → Create epics in `docs/sprint-artifacts/epics/` like all other features.

## Essential Info

- **Supabase Project ID:** `nxuzurxiaismssiiydst`
- **Run tests:** `npm run test`
- **Run build:** `npm run build`

## Documentation Index

All documentation has been organized into smaller, focused files:

### Feature Planning (AI Buddy, Reporting, Quoting)
- **Feature Roadmap:** `docs/features/index.md`
- **AI Buddy (Phase 1):** `docs/features/ai-buddy/`
- **Reporting (Phase 2):** `docs/features/reporting/`
- **Quoting (Phase 3 & 4):** `docs/features/quoting/`

### Core docuMINE (All Features)
- **Architecture:** `docs/architecture/index.md`
- **UX Design:** `docs/ux-design-specification/index.md`
- **Tech Specs:** `docs/sprint-artifacts/epics/epic-{N}/tech-spec/index.md`
- **Stories:** `docs/sprint-artifacts/epics/epic-{N}/stories/{story-name}/`

Load only what you need to minimize context usage.
