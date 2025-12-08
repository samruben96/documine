# Feature Modules

## CRITICAL: ONE APPLICATION

**docuMINE is ONE application with multiple feature modules.** AI Buddy, Reporting, and Quoting are NOT separate products - they are features being added to the existing docuMINE codebase.

## Feature Planning Documentation Location

**Feature planning docs (PRD, UX Design) are in `docs/features/`**

```
docs/features/
├── index.md                              # Feature roadmap & overview
├── documine-suite-brainstorm-2025-12-07.md  # Original brainstorm session
│
├── ai-buddy/                             # Phase 1: AI Assistant feature
│   ├── index.md
│   ├── prd.md                            # Product requirements
│   ├── architecture.md                   # Technical design
│   └── ux-design/                        # Wireframes, flows
│
├── reporting/                            # Phase 2: Custom Reporting feature
│   └── index.md
│
├── quoting/                              # Phase 3 & 4: Multi-Carrier Quoting feature
│   └── index.md
│
└── research/                             # Technical research
    └── index.md
```

## Implementation Pattern

**Planning** → `docs/features/{feature-name}/`
**Implementation** → `docs/sprint-artifacts/epics/epic-{N}/` (same as all docuMINE features)

When a feature is ready to build, create an epic in the standard location:
- Epic 14+ for AI Buddy → `docs/sprint-artifacts/epics/epic-14/`
- Follow the same tech-spec + stories structure as Epics 1-13

## When to Use Which Location

| Task | Documentation Location |
|------|----------------------|
| **PRD, UX Design** | `docs/features/{feature}/` |
| **Architecture (ALL features)** | `docs/architecture/{feature}/` |
| **Implementation (epics, stories)** | `docs/sprint-artifacts/epics/epic-{N}/` |

Architecture is centralized in `docs/architecture/` so all features are visible together as ONE APP.

## Feature Roadmap

| Phase | Feature | Planning Docs | Implementation |
|-------|---------|---------------|----------------|
| 1 | AI Buddy | `docs/features/ai-buddy/` | Epic 14+ |
| 2 | Custom Reporting | `docs/features/reporting/` | Epic TBD |
| 3 | Quoting Helper | `docs/features/quoting/` | Epic TBD |
| 4 | AI-Powered Quoting | `docs/features/quoting/` | Epic TBD |

## Key Documents

- [Feature Roadmap](../features/index.md)
- [Full Brainstorm Session](../features/documine-suite-brainstorm-2025-12-07.md)
- [AI Buddy PRD](../features/ai-buddy/prd.md)
- [AI Buddy UX Design](../features/ai-buddy/ux-design/ux-design-specification.md)

## Shared Infrastructure

All feature modules share:
- Same Supabase project (`nxuzurxiaismssiiydst`)
- Same auth system (existing user/agency tables)
- Same UI component library (shadcn/ui)
- Same API patterns (Next.js API routes)
- Same deployment (Vercel)

## Cross-Reference: Building on Existing Foundation

When working on new features, ALWAYS reference:

| What | Location | Relevance |
|------|----------|-----------|
| **Core Architecture** | `docs/architecture/` | Auth, Supabase, API patterns to reuse |
| **Core PRD** | `docs/prd/` | Core features to integrate with |
| **UX Design System** | `docs/ux-design-specification/` | Design tokens, components, patterns |
| **Epics 1-13** | `docs/sprint-artifacts/epics/` | Existing code patterns, lessons learned |
| **Known Issues** | `docs/claude-md/known-issues-bug-fixes.md` | Bugs fixed, patterns to follow |
| **Tech Stack** | `docs/claude-md/tech-stack.md` | Current dependencies |

**Don't reinvent - extend and integrate.**
