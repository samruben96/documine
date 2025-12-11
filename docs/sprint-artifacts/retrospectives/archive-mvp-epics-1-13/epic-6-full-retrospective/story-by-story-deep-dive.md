# Story-by-Story Deep Dive

## Story 6.1: Fix Conversation Loading (406 Error)

**The Bug:** Users couldn't load their conversation history - HTTP 406 errors on every document page.

**Initial Hypothesis:** RLS policy misconfiguration - we thought the SELECT policy was missing or broken.

**Actual Root Cause:** The Supabase `.single()` modifier throws HTTP 406 (PGRST116) when zero rows match. For new documents with no conversation yet, this was every page load.

**The Fix:** One-line change: `.single()` → `.maybeSingle()`

```typescript
// Before (buggy)
const { data } = await supabase.from('conversations')...single();

// After (fixed)
const { data } = await supabase.from('conversations')...maybeSingle();
```

**Debugging Process:**
1. Checked RLS policies - they were correct
2. Web search found Supabase discussion #2284 explaining the behavior
3. Single line fix, no migration needed

**Key Learning:** Always use `.maybeSingle()` when querying for records that may not exist.

---

## Story 6.2: Fix Confidence Score Calculation

**The Bug:** "Not Found" badge appeared on accurate answers with correct source citations.

**Initial Hypothesis:** Threshold values were wrong.

**Actual Root Cause:** Bug at `reranker.ts:114` overwrote `similarityScore` with Cohere's `relevanceScore`. These scores have completely different distributions:
- Vector similarity (cosine): 0.0-1.0, relevant results ≥ 0.75
- Cohere relevance: different scale, relevant results ≥ 0.30

**The Fix:**
1. Deleted line 114 that overwrote scores
2. Implemented dual-threshold system
3. Added 'conversational' confidence level for greetings

**Threshold Configuration:**
```typescript
const VECTOR_THRESHOLDS = { high: 0.75, needsReview: 0.50 };
const COHERE_THRESHOLDS = { high: 0.30, needsReview: 0.10 };
```

**Bonus Fix:** Discovered `rerank-english-v3.5` was returning 404. Correct model: `rerank-v3.5`.

**Key Learning:** Never overwrite semantically different scores. Keep both values and use the appropriate one.

---

## Story 6.3: Fix Source Citation Navigation

**The Bug:** Clicking "View page 2" citation did nothing - PDF stayed on page 1.

**Initial Hypothesis:** Event handler not wired or state not lifting properly.

**Actual Root Cause:** TWO DocumentViewer instances in the DOM. React refs attached to the hidden (mobile) instance, which had zero dimensions. `getBoundingClientRect()` returned all zeros.

**Discovery Method:** Used Playwright's `browser_evaluate` to inspect all DocumentViewer instances:
```javascript
Array.from(document.querySelectorAll('.document-viewer')).map(el => ({
  width: el.offsetWidth,
  height: el.offsetHeight,
  scrollHeight: el.scrollHeight
}))
// Instance 0: {width: 855, height: 653} - Visible
// Instance 1: {width: 0, height: 0} - Hidden, but ref attached here!
```

**The Fix:** Changed from CSS hiding (both rendered) to conditional rendering (only one exists):
```tsx
// Before: CSS hiding - both instances in DOM
<div className="hidden lg:block"><DocumentViewer ref={viewerRef} /></div>
<div className="lg:hidden"><DocumentViewer /></div>

// After: Conditional rendering - only one exists
{isMobile ? <MobileDocViewer /> : <DesktopDocViewer ref={viewerRef} />}
```

**Key Learning:** CSS hiding still renders components and attaches refs. For ref-dependent functionality, use conditional rendering.

---

## Story 6.5: Remove Stale UI Text

**The Issue:** "Coming in Epic 5" text visible to users. Browser tab said "Create Next App".

**The Fix:** Simple but thorough - grepped codebase, updated all stale references:
- `split-view.tsx:138` - "Coming in Epic 5" → "Select a document to start chatting"
- `coming-soon-tab.tsx:38` - "Coming in Epic 3" → "Coming Soon"
- `layout.tsx` - "Create Next App" → "docuMINE"
- Added dynamic page titles: "{document name} - docuMINE"

**Key Learning:** Always search comprehensively. Placeholder text sneaks into multiple places.

---

## Story 6.6: Connection Status Indicator

**The Issue:** "Connecting..." displayed forever, never resolving to meaningful state.

**The Solution:** Created 4-state ConnectionIndicator component:
- `connecting` - Spinner + "Connecting..."
- `connected` - Green checkmark + "Connected"
- `disconnected` - Red WiFi-off + "Offline"
- `reconnecting` - Amber refresh + "Reconnecting..."

**Technical Implementation:**
- Extended both realtime hooks (`useDocumentStatus`, `useProcessingProgress`) to expose `connectionState`
- Combined states with priority logic: connected > reconnecting > connecting > disconnected
- Fixed flickering: used refs for handler functions to prevent effect re-runs

**Key Learning:** Users need to know system state. Even a subtle indicator builds trust.

---

## Story 6.7: Document List UX Polish (Combined Story)

**Original Scope:** 3 separate stories (6.7, 6.8, 6.9) for selection highlight, empty states, tooltips.

**Decision:** Combined into one story because they share implementation files.

**Delivered:**
- Selection highlight with left border accent (15 ACs across 3 concern areas)
- Empty state with engaging copy and upload CTA
- Filename tooltips with keyboard accessibility
- Dark mode support for all states

**Key Learning:** Related small stories should be combined when they touch the same files.

---

## Story 6.8: Design System Refresh (Phased Approach)

**User Feedback:** "Too grey. Doesn't feel modern."

**Phase 1 (Core):**
- Electric Blue (#3b82f6) accent color
- Updated button hover/focus states
- Consistent spacing across views

**Phase 2 (UX Audit):**
After Phase 1, used Playwright to capture 12 screenshots of every page/state. UX Designer reviewed and identified 15 additional acceptance criteria.

**Features Delivered:**
- Resizable side panels (`react-resizable-panels`)
- Markdown rendering in chat (`react-markdown` + `remark-gfm`)
- Dockable chat panel (3 positions: right, bottom, floating)
- Auth page visual enhancement (gradient background, branded styling)
- Mobile header fix (logo was truncated)
- Navigation active state (Electric Blue underline)
- Card depth with hover shadows

**Deferred to Epic F5:**
- AC-6.8.18: Source text highlighting (requires PDF.js text layer work)
- Microinteractions, skeleton loaders, dark mode polish

**Key Learning:** Phased approach works well for large stories. Deliver core value, get feedback, enhance.

---
