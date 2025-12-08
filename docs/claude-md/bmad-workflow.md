# BMAD Workflow

This project uses the BMAD Method for development. Stories are tracked in `docs/sprint-artifacts/sprint-status.yaml`.

## CRITICAL: ONE APPLICATION

**docuMINE is ONE application with multiple feature modules.** AI Buddy, Reporting, and Quoting are NOT separate products - they are features being added to the existing docuMINE codebase.

## Documentation Locations

### Feature Planning (PRD, UX Design, Architecture)

**Feature planning docs go in `docs/features/`:**

| Feature | Phase | Planning Location |
|---------|-------|-------------------|
| AI Buddy | 1 | `docs/features/ai-buddy/` |
| Custom Reporting | 2 | `docs/features/reporting/` |
| Quoting | 3 & 4 | `docs/features/quoting/` |
| Research | - | `docs/features/research/` |

### Implementation (Epics, Tech Specs, Stories)

**ALL implementation goes in `docs/sprint-artifacts/epics/`:**

When a feature is ready to implement:
- Create `epic-{N}/` in `docs/sprint-artifacts/epics/` (same location as all docuMINE features)
- Follow the same structure: `epic.md`, `tech-spec/`, `stories/`
- Epic 14+ for AI Buddy implementation

### Core docuMINE Documentation

All architecture, PRD, and design system docs remain in:
- `docs/architecture/` - Core architectural decisions
- `docs/prd/` - Core document comparison requirements
- `docs/ux-design-specification/` - Design system and patterns

## Cross-Referencing: Features Build on Foundation

**New features extend docuMINE - they don't replace it.** When working on new features, agents SHOULD reference:

| Reference | Location | Why |
|-----------|----------|-----|
| Core Architecture | `docs/architecture/` | Auth patterns, Supabase setup, API structure |
| Core PRD | `docs/prd/` | Core document comparison features |
| UX Design System | `docs/ux-design-specification/` | Design tokens, component patterns |
| Past Epics (1-13) | `docs/sprint-artifacts/epics/` | Existing patterns, lessons learned |
| Known Issues | `docs/claude-md/known-issues-bug-fixes.md` | What to avoid, what works |
| Tech Stack | `docs/claude-md/tech-stack.md` | Current dependencies, patterns |

All feature modules use the same:
- Supabase database (with new tables)
- Auth system
- UI component library (shadcn/ui)
- API patterns (Next.js API routes)
- Deployment (Vercel)

## Workflow Quick Reference

| Workflow | Purpose | Output Location |
|----------|---------|-----------------|
| `/bmad:bmm:workflows:prd` | Product requirements | `docs/features/{feature}/prd.md` |
| `/bmad:bmm:workflows:architecture` | Technical design | `docs/architecture/{feature}/` |
| `/bmad:bmm:workflows:create-ux-design` | UX design | `docs/features/{feature}/ux-design/` |
| `/bmad:bmm:workflows:create-epics-and-stories` | Epic breakdown | `docs/sprint-artifacts/epics/epic-{N}/` |
| `/bmad:bmm:workflows:tech-spec` | Tech specification | `docs/sprint-artifacts/epics/epic-{N}/tech-spec/` |
| `/bmad:bmm:workflows:dev-story` | Story implementation | `docs/sprint-artifacts/epics/epic-{N}/stories/` |

## Summary

| Doc Type | Location |
|----------|----------|
| **PRD, UX Design** | `docs/features/{feature}/` |
| **Architecture** | `docs/architecture/{feature}/` (centralized) |
| **Epics, Tech Specs, Stories** | `docs/sprint-artifacts/epics/epic-{N}/` |
