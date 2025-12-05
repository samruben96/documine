# Appendix D: Files Changed Per Story

| Story | Files to Modify | Files to Create |
|-------|-----------------|-----------------|
| 6.1 | `supabase/migrations/00008_*.sql` | `__tests__/e2e/conversation-persistence.spec.ts` |
| 6.2 | `src/lib/chat/reranker.ts`, `src/lib/chat/confidence.ts`, `src/lib/chat/types.ts` | `__tests__/e2e/confidence-display.spec.ts` |
| 6.3 | `src/components/chat/source-citation.tsx`, `src/app/(dashboard)/documents/[id]/page.tsx` | `__tests__/e2e/citation-navigation.spec.ts` |
| 6.4 | DEFERRED to Epic F4 | - |
| 6.5 | `src/app/layout.tsx`, `src/app/(dashboard)/documents/[id]/page.tsx` | - |
| 6.6 | `src/hooks/use-realtime.ts` | `src/components/ui/connection-indicator.tsx` |
| 6.7 | `src/components/documents/document-list-item.tsx`, `src/components/documents/document-list.tsx`, `src/components/documents/document-list-empty.tsx` | `__tests__/e2e/document-list-ux.spec.ts` |
| 6.8 (Phase 2) | See table below | `__tests__/e2e/design-system.spec.ts` |
| 6.9 | COMBINED into 6.7 | - |

## Story 6.8 Phase 2 - Detailed File Changes

| Sprint | AC | Files to Modify |
|--------|-----|-----------------|
| Sprint 1 | 6.8.7-9 | `src/components/layout/header.tsx` (mobile menu, active state) |
| Sprint 2 | 6.8.10,16,18 | `src/components/layout/sidebar.tsx`, `src/components/chat/chat-message.tsx`, `src/components/documents/document-viewer.tsx` |
| Sprint 3 | 6.8.12,14,15 | `src/components/layout/split-view.tsx`, `src/components/ui/input.tsx`, card components |
| Sprint 4 | 6.8.11,13,17 | `src/app/(auth)/*.tsx`, `src/components/documents/document-list-empty.tsx`, `src/components/chat/chat-panel.tsx` |

**New Dependencies:** `react-markdown`, `remark-gfm`, `react-resizable-panels`, `react-rnd`

---
