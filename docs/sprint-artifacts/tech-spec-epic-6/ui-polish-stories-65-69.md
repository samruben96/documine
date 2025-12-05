# UI Polish Stories (6.5-6.9)

These stories address UI/UX issues identified through Party Mode exploration and research.

## Story 6.5: Remove Stale UI Text & Fix Page Title

**Priority:** P0 - Embarrassment fix

**Problem Statement:**
The UI contains stale text that damages professional credibility:
1. "Coming in Epic 5" text appears in the main area - Epic 5 is complete
2. Browser tab shows "Create Next App" instead of "docuMINE"

**Evidence (from Playwright snapshot):**
```yaml
- paragraph [ref=e63]: Chat with your document
- paragraph [ref=e64]: Coming in Epic 5  # ← STALE
- Page Title: Create Next App  # ← WRONG
```

**User Impact:** First impression damage. Users perceive product as unfinished or unprofessional.

**Acceptance Criteria:**

| AC | Description | Verification |
|----|-------------|--------------|
| AC-6.5.1 | "Coming in Epic 5" text removed from all pages | Visual inspection |
| AC-6.5.2 | Browser tab shows "docuMINE" or "docuMINE - Documents" | Playwright: check page.title() |
| AC-6.5.3 | No references to "Epic X" in user-facing UI | Grep codebase |
| AC-6.5.4 | Document page title shows document name | Playwright: verify title includes filename |

**Implementation Approach:**

1. Fix page title in `src/app/layout.tsx`:
```typescript
export const metadata: Metadata = {
  title: 'docuMINE',
  description: 'AI-powered document analysis for insurance agents',
};
```

2. Remove stale text in `src/app/(dashboard)/documents/[id]/page.tsx` and `src/app/(dashboard)/documents/page.tsx`

3. Add dynamic page titles for document pages:
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const document = await getDocument(params.id);
  return {
    title: document ? `${document.filename} - docuMINE` : 'docuMINE',
  };
}
```

**Effort:** XS (15-30 minutes)

---

## Story 6.6: Connection Status & Realtime Indicator

**Priority:** P1 - User feedback improvement

**Problem Statement:**
The UI shows "Connecting..." without ever resolving to a meaningful state. Users don't know if the system is working.

**Evidence (from Playwright snapshot):**
```yaml
- generic [ref=e310]: Connecting...  # ← Never changes
```

**User Impact:** Uncertainty about system state. Users may think something is broken.

**Research Basis:**
> "Immediate responses or indicators to user inputs" - Core chatbot UX principle
> "Feedback principle: users need to know system state"

**Acceptance Criteria:**

| AC | Description | Verification |
|----|-------------|--------------|
| AC-6.6.1 | Shows "Connected" with checkmark when realtime connected | Playwright: verify text change |
| AC-6.6.2 | Shows "Connecting..." with spinner during connection | Visual inspection |
| AC-6.6.3 | Shows "Offline" or reconnecting state if disconnected | Disconnect network, verify UI |
| AC-6.6.4 | Indicator is subtle, not distracting | Design review |
| AC-6.6.5 | Auto-reconnect attempts shown to user | Verify reconnection behavior |

**Implementation Approach:**

1. Update `src/hooks/use-realtime.ts` to expose connection state:
```typescript
type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export function useRealtimeConnection() {
  const [state, setState] = useState<ConnectionState>('connecting');
  // ... existing logic with state updates
  return { state, isConnected: state === 'connected' };
}
```

2. Create `src/components/ui/connection-indicator.tsx`:
```typescript
export function ConnectionIndicator({ state }: { state: ConnectionState }) {
  const indicators = {
    connecting: { icon: Spinner, text: 'Connecting...', color: 'text-muted-foreground' },
    connected: { icon: CheckCircle, text: 'Connected', color: 'text-green-600' },
    disconnected: { icon: WifiOff, text: 'Offline', color: 'text-red-600' },
    reconnecting: { icon: RefreshCw, text: 'Reconnecting...', color: 'text-yellow-600' },
  };
  // ... render based on state
}
```

3. Replace static "Connecting..." text with dynamic indicator.

**Effort:** S (1-2 hours)

---

## Story 6.7: Document List UX Polish (COMBINED)

**Priority:** P1 - UX Polish
**Effort:** M (3-4 hours combined)
**Status:** Combined 2025-12-02 (merged original 6.7, 6.8, 6.9)

**Problem Statement:**
Three related UX issues in the document list/sidebar area:
1. No visual indication which document is selected
2. Bland empty state doesn't guide users
3. Long filenames truncated without tooltip

**User Impact:** Navigation confusion, poor onboarding experience, inability to distinguish similar documents.

**Research Basis:**
> "Highlighting hover and active states provides users with important interaction cues"
> "Two parts instruction, one part delight" - Empty state rule of thumb
> "Tooltips reveal full information on hover"

**Acceptance Criteria:**

*Document Selection Highlight (AC-6.7.1 - AC-6.7.5):*

| AC | Description | Verification |
|----|-------------|--------------|
| AC-6.7.1 | Selected document has distinct background color | Visual inspection |
| AC-6.7.2 | Selected state persists across page navigation | Playwright: navigate, verify styling |
| AC-6.7.3 | Hover state distinct from selected state | Manual testing |
| AC-6.7.4 | Selection visible in both light and dark modes | Test both themes |
| AC-6.7.5 | Accessible - `aria-selected` attribute added | Code review |

*Empty State UX (AC-6.7.6 - AC-6.7.10):*

| AC | Description | Verification |
|----|-------------|--------------|
| AC-6.7.6 | "No documents" state has engaging headline and illustration | Visual inspection |
| AC-6.7.7 | Clear CTA button for upload when no documents exist | Playwright: verify button |
| AC-6.7.8 | "Select document" state has clear guidance text | Visual inspection |
| AC-6.7.9 | Different messaging for "no documents" vs "select document" | Test both states |
| AC-6.7.10 | Empty states responsive on mobile | Test mobile viewport |

*Long Filename Tooltip (AC-6.7.11 - AC-6.7.15):*

| AC | Description | Verification |
|----|-------------|--------------|
| AC-6.7.11 | Long filenames truncate with ellipsis | Visual inspection |
| AC-6.7.12 | Tooltip shows full filename on hover | Playwright: hover, verify tooltip |
| AC-6.7.13 | Truncation preserves file extension visibility | Test various lengths |
| AC-6.7.14 | Tooltip accessible via keyboard focus | Tab to item, verify tooltip |
| AC-6.7.15 | Consistent truncation in sidebar and header | Check both locations |

**Files to Modify:**
- `src/components/documents/document-list-item.tsx` - Selection highlight, tooltip
- `src/components/documents/document-list.tsx` - Pass selected state
- `src/app/(dashboard)/documents/page.tsx` - Empty state
- `src/app/(dashboard)/documents/[id]/page.tsx` - Pass selected ID

**Files to Create:**
- `src/components/documents/empty-state.tsx` - Reusable empty state component

**Story File:** `docs/sprint-artifacts/story-6.7-document-list-ux-polish.md`

---

## Story 6.8: Design System Refresh (EXPANDED)

**Priority:** P1 - UX Enhancement
**Effort:** L (Phase 1 done, Phase 2 in progress)
**Status:** In Progress (2025-12-03)

**Problem Statement:**
User feedback indicated the UI was "too grey" and didn't feel modern. Phase 1 introduced Electric Blue accent color. Phase 2 (UX Audit) identified 15 additional enhancements based on comprehensive Playwright screenshots.

**Phase 1 (COMPLETED 2025-12-03):**
- Electric Blue brand accent (#3b82f6) applied throughout
- Button hover effects with lift/shadow
- Spacing consistency fixes
- Dark mode color updates

**Phase 2 Acceptance Criteria (AC-6.8.7 through AC-6.8.21):**

| AC | Description | Priority | Effort |
|----|-------------|----------|--------|
| AC-6.8.7 | Mobile header overflow fix - logo shows "uMINE" | Critical | XS |
| AC-6.8.8 | Primary button color verification (vibrant blue) | Critical | S |
| AC-6.8.9 | Navigation active state indicator | High | XS |
| AC-6.8.10 | Mobile sidebar fix (slide-over panel) | High | S |
| AC-6.8.11 | Auth pages visual enhancement (gradient, icons) | High | M |
| AC-6.8.12 | Card depth & shadows with hover | Medium | S |
| AC-6.8.13 | Empty state enhancement (animation, CTA) | Medium | S |
| AC-6.8.14 | Input focus states (glow effect) | Medium | XS |
| AC-6.8.15 | Resizable side panels (localStorage persist) | High | M |
| AC-6.8.16 | Markdown rendering in chat (react-markdown) | High | S |
| AC-6.8.17 | Dockable/moveable chat panel (react-rnd) | Medium | L |
| AC-6.8.18 | Source text highlighting in document | High | M |
| AC-6.8.19 | Microinteractions (deferred) | Low | M |
| AC-6.8.20 | Skeleton loading states (deferred) | Low | M |
| AC-6.8.21 | Dark mode polish (deferred) | Low | S |

**New Dependencies Required:**
```bash
npm install react-markdown remark-gfm react-resizable-panels react-rnd
```

**Files to Modify:**
- `src/components/layout/header.tsx` - Mobile hamburger menu, active nav state
- `src/components/layout/sidebar.tsx` - Mobile sheet component
- `src/components/layout/split-view.tsx` - Resizable panels
- `src/components/chat/chat-message.tsx` - Markdown rendering
- `src/components/chat/chat-panel.tsx` - Dockable behavior
- `src/components/documents/document-viewer.tsx` - Text highlighting
- `src/app/(auth)/*.tsx` - Auth page visual enhancement

**Story File:** `docs/sprint-artifacts/story-6.8-design-system-refresh.md`
**Context File:** `docs/sprint-artifacts/6-8-design-system-refresh.context.xml`

---

## Story 6.9: COMBINED INTO 6.7

**Status:** Combined (2025-12-02)

Original Story 6.9 (Long Filename Tooltip) has been merged into Story 6.7 (Document List UX Polish)

---
