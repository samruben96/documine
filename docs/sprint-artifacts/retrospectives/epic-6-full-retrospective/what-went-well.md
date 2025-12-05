# What Went Well

## 1. Test-Driven Bug Fixing (TDBF) Pattern

The TDBF pattern recommended in Epic 5 retrospective was successfully applied:

1. **Story 6.1:** Root cause identified via web search (Supabase `.single()` behavior)
2. **Story 6.2:** 43 unit tests added covering all confidence calculation paths
3. **Story 6.3:** Playwright E2E tests for citation navigation

This pattern prevented regressions and provided clear verification evidence.

## 2. Systematic Root Cause Analysis

Each bug fix included thorough investigation:

- **6.1:** Discovered `.single()` throws 406 on 0 rows (not RLS issue as initially suspected)
- **6.2:** Found reranker overwriting `similarityScore` at line 114
- **6.3:** Used browser evaluate to discover dual DocumentViewer instances

Root causes documented in story files for future reference.

## 3. Story Consolidation

Combined three related stories (6.7, 6.8, 6.9) into one:
- Original: Document Selection Highlight, Empty State UX, Long Filename Handling
- Combined: Document List UX Polish (15 acceptance criteria)

**Benefit:** Reduced context switching, shared implementation files, faster delivery.

## 4. Phased Implementation for Large Stories

Story 6.8 (Design System Refresh) used a two-phase approach:
- **Phase 1:** Electric Blue accent color, button hovers, spacing audit
- **Phase 2:** UX audit enhancements (12 additional ACs)

**Benefit:** Delivered value incrementally, allowed for UX feedback between phases.

## 5. Design System Transformation

The "too grey" feedback was addressed comprehensively:
- Electric Blue (#3b82f6) accent color
- Improved button hover/focus states
- Consistent spacing across views
- Modern look while maintaining professionalism

## 6. Feature Additions Beyond Bug Fixes

Epic 6 expanded scope to include user-requested features:
- Resizable side panels (react-resizable-panels)
- Markdown rendering in chat (react-markdown + remark-gfm)
- Dockable chat panel (floating, right, bottom positions)
- Auth pages visual enhancement

---
