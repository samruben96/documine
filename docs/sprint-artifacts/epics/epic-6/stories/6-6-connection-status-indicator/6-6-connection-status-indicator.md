# Story 6.6: Connection Status & Realtime Indicator

**Epic:** 6 - Epic 5 Cleanup & Stabilization + UI Polish
**Story ID:** 6.6
**Status:** done
**Created:** 2025-12-02
**Priority:** P1 - User feedback improvement
**Type:** UI Polish
**Effort:** S (1-2 hours)

---

## User Story

As a **user viewing a document in docuMINE**,
I want **to see whether my connection is active and working**,
So that **I know my chat messages will be delivered and I'll receive responses**.

---

## Background & Context

### Problem Statement

The UI shows "Connecting..." indefinitely without ever resolving to a meaningful state. Users don't know if the system is working or if something is broken.

**Evidence from Playwright snapshot:**
```yaml
- generic [ref=e310]: Connecting...  # Never changes to "Connected"
```

### User Impact

- **Uncertainty about system state:** Users may think something is broken when they see perpetual "Connecting..."
- **No feedback on reconnection:** If the connection drops and recovers, users are unaware
- **Trust erosion:** Silent failures undermine confidence in the product

### Root Cause

The realtime connection indicator was implemented as a placeholder but never wired to actual connection state from the Supabase realtime client.

### Research Basis

From `docs/research-ui-best-practices-2025-12-02.md`:
> "Immediate responses or indicators to user inputs" - Core chatbot UX principle
> "Feedback principle: users need to know system state"

From PRD - User Experience Principles:
> **Speed You Can Feel:** Responses appear fast. Progress indicators during processing. No unnecessary loading states or animations.

---

## Acceptance Criteria

### AC-6.6.1: Shows "Connected" When Realtime Connected
**Given** the document page is open and realtime subscription is active
**When** the connection is established
**Then** the indicator shows "Connected" with a green checkmark icon

**Verification:** Playwright - verify text contains "Connected"

### AC-6.6.2: Shows "Connecting..." During Connection
**Given** the page is loading or reconnecting
**When** the realtime connection is being established
**Then** the indicator shows "Connecting..." with a spinner icon

**Verification:** Visual inspection during page load

### AC-6.6.3: Shows "Offline" When Disconnected
**Given** the realtime connection is lost (e.g., network issue)
**When** the client detects disconnection
**Then** the indicator shows "Offline" or "Disconnected" with appropriate styling (red/warning)

**Verification:** Manual test - disconnect network, verify UI

### AC-6.6.4: Indicator is Subtle, Not Distracting
**Given** the connection is stable (normal state)
**When** the user is interacting with the document
**Then** the connected indicator is unobtrusive (small, muted colors, doesn't compete for attention)

**Verification:** Design review - should not distract from main content

### AC-6.6.5: Auto-Reconnect Shown to User
**Given** the connection was lost and is recovering
**When** the client is attempting to reconnect
**Then** the indicator shows "Reconnecting..." with appropriate feedback

**Verification:** Manual test - restore network after disconnect

---

## Technical Approach

### Implementation Plan

#### Step 1: Expose Connection State from Realtime Hook

Update `src/hooks/use-realtime.ts` (or create new hook) to expose connection state:

```typescript
type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export function useRealtimeConnection() {
  const [state, setState] = useState<ConnectionState>('connecting');
  const supabase = useSupabaseClient();

  useEffect(() => {
    const channel = supabase.channel('connection-status');

    channel
      .on('presence', { event: 'join' }, () => {
        setState('connected');
      })
      .on('system', { event: 'disconnect' }, () => {
        setState('disconnected');
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setState('connected');
        } else if (status === 'CHANNEL_ERROR') {
          setState('disconnected');
        } else if (status === 'TIMED_OUT') {
          setState('reconnecting');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return { state, isConnected: state === 'connected' };
}
```

#### Step 2: Create Connection Indicator Component

Create `src/components/ui/connection-indicator.tsx`:

```typescript
import { CheckCircle, Loader2, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

interface ConnectionIndicatorProps {
  state: ConnectionState;
  className?: string;
}

const indicators = {
  connecting: { icon: Loader2, text: 'Connecting...', color: 'text-muted-foreground', spin: true },
  connected: { icon: CheckCircle, text: 'Connected', color: 'text-green-600', spin: false },
  disconnected: { icon: WifiOff, text: 'Offline', color: 'text-red-600', spin: false },
  reconnecting: { icon: RefreshCw, text: 'Reconnecting...', color: 'text-yellow-600', spin: true },
};

export function ConnectionIndicator({ state, className }: ConnectionIndicatorProps) {
  const config = indicators[state];
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-1.5 text-xs', config.color, className)}>
      <Icon className={cn('h-3 w-3', config.spin && 'animate-spin')} />
      <span>{config.text}</span>
    </div>
  );
}
```

#### Step 3: Integrate into Document Page

Replace static "Connecting..." text in the document page with the dynamic indicator.

Locate where "Connecting..." is currently rendered (likely in split-view or document page) and replace with:

```tsx
<ConnectionIndicator state={connectionState} />
```

#### Step 4: Wire Up to Existing Realtime Hook

If there's already a realtime hook in use (e.g., `use-processing-progress.ts` or `use-document-status.ts`), extract connection state from there rather than creating a separate channel.

---

## Tasks / Subtasks

- [x] **Task 1: Analyze Current Realtime Implementation** (AC: all)
  - [x] Find where "Connecting..." text is rendered
  - [x] Identify existing realtime hooks and their connection state handling
  - [x] Determine best approach to expose connection state

- [x] **Task 2: Create ConnectionIndicator Component** (AC: 6.6.1-6.6.4)
  - [x] Create `src/components/ui/connection-indicator.tsx`
  - [x] Define connection state types
  - [x] Implement indicator variants (connecting, connected, disconnected, reconnecting)
  - [x] Style with appropriate colors and icons
  - [x] Ensure subtle, non-distracting appearance

- [x] **Task 3: Expose Connection State** (AC: 6.6.1-6.6.5)
  - [x] Update or create hook to expose ConnectionState
  - [x] Handle all Supabase channel subscription statuses
  - [x] Implement reconnection detection

- [x] **Task 4: Integrate Into Document Page** (AC: 6.6.1-6.6.5)
  - [x] Replace static "Connecting..." text with ConnectionIndicator
  - [x] Pass connection state from hook to component
  - [x] Test all connection states

- [x] **Task 5: Verify All States** (AC: 6.6.1-6.6.5)
  - [x] Verify "Connected" shows after page load
  - [x] Verify "Connecting..." shows during initial load
  - [x] Verify "Offline" shows when network disconnected
  - [x] Verify "Reconnecting..." shows during recovery
  - [x] Run `npm run build`
  - [x] Run `npm run test`

---

## Dev Notes

### Relevant Architecture Patterns

From architecture.md - State Management:
> **Server State:** Supabase Realtime handles synchronization with automatic reconnection logic

From architecture.md - Naming Conventions:
> Components: PascalCase (e.g., `ConnectionIndicator`)
> Hooks: camelCase with "use" prefix (e.g., `useRealtimeConnection`)

### Component Hierarchy

```
src/app/(dashboard)/documents/[id]/page.tsx
├── DocumentHeader
├── SplitView
│   ├── DocumentViewer
│   └── ChatPanel
│       └── [ConnectionIndicator]  ← Add here
└── or place in header area
```

### Supabase Realtime Channel States

Reference: Supabase realtime documentation

```typescript
// Channel subscription statuses
type SubscriptionStatus =
  | 'SUBSCRIBED'     // Connected successfully
  | 'TIMED_OUT'      // Connection attempt timed out
  | 'CLOSED'         // Channel was closed
  | 'CHANNEL_ERROR'  // Error occurred
```

### Existing Realtime Hooks to Reference

- `src/hooks/use-processing-progress.ts` - Uses realtime for processing updates
- `src/hooks/use-document-status.ts` - Uses realtime for document status
- Check if these expose channel state that can be reused

### Project Structure Notes

**Files to Modify:**
- `src/hooks/use-realtime.ts` (or existing realtime hook) - Expose connection state
- `src/components/layout/split-view.tsx` or similar - Replace "Connecting..." text

**Files to Create:**
- `src/components/ui/connection-indicator.tsx` - New indicator component

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-6.md#Story-6.6]
- [Source: docs/prd.md#User-Experience-Principles]
- [Source: docs/research-ui-best-practices-2025-12-02.md]
- [Source: docs/architecture.md#State-Management]

### Learnings from Previous Story

**From Story 6.5 (Status: Done)**

- **Component Location Matters:** In 6.5, the "Connecting..." text was found in `split-view.tsx:138`, not where initially expected. Search thoroughly before implementing.
- **Simple Changes, Wide Impact:** 6.5 found stale text in multiple locations. For 6.6, ensure the connection indicator is placed where it will be visible and contextually appropriate.
- **Build Verification:** Always run `npm run build` before marking complete.
- **Client Component Awareness:** 6.5 used `useEffect` for dynamic title because page is client component. For 6.6, the ConnectionIndicator will also need to work in client context.

**Key Files from 6.5 to Reference:**
- `src/components/layout/split-view.tsx` - Contains "Connecting..." placeholder, likely location to update

[Source: docs/sprint-artifacts/story-6.5-remove-stale-text-fix-title.md#Dev-Agent-Record]

---

## Definition of Done

- [x] Connection indicator shows appropriate state (connecting/connected/disconnected/reconnecting)
- [x] Indicator updates automatically when connection state changes
- [x] Indicator is subtle and non-distracting during normal operation
- [x] No hardcoded "Connecting..." text remaining in UI
- [x] No regressions in existing realtime functionality
- [x] `npm run build` passes
- [x] `npm run test` passes
- [x] Manual verification of all connection states
- [x] Story file updated with completion notes

---

## Dependencies

- **Blocks:** None
- **Blocked by:** None (independent of other Epic 6 stories)
- **Related:** Uses same Supabase realtime infrastructure as processing progress (Epic 5)

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Can't access channel state from existing hooks | Low | Medium | Create dedicated connection monitoring channel |
| State changes too frequently (flicker) | Medium | Low | Add debouncing or minimum display duration |
| Reconnection logic differs from Supabase defaults | Low | Medium | Follow Supabase realtime best practices |
| Indicator placement awkward in responsive layout | Low | Low | Test at multiple breakpoints |

---

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/6-6-connection-status-indicator.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

**Task 1 Analysis (2025-12-02):**
- "Connecting..." at `documents/page.tsx:343-355`
- `useDocumentStatus.isConnected` from subscribe callback (line 224-229)
- `useProcessingProgress.isConnected` from subscribe callback (line 406-411)
- Combined: `isAnyChannelConnected = isConnected || (processingDocumentIds.length > 0 && isProgressConnected)`
- Gap: Only boolean state, no TIMED_OUT/CLOSED detection for granular states
- Plan: Create ConnectionIndicator component, extend hook to expose ConnectionState type

### Completion Notes List

- ✅ Created `ConnectionIndicator` component with 4-state variants (connecting, connected, disconnected, reconnecting)
- ✅ Extended `useDocumentStatus` and `useProcessingProgress` hooks to expose `connectionState` alongside backward-compatible `isConnected`
- ✅ Replaced inline "Connecting..." / "Live updates active" JSX with dynamic `ConnectionIndicator` component
- ✅ Computed combined connection state from both channels with proper priority (connected > reconnecting > connecting > disconnected)
- ✅ Fixed flickering issue: only update state on definitive status changes (SUBSCRIBED, CHANNEL_ERROR, TIMED_OUT, CLOSED)
- ✅ Fixed inactive progress channel: return 'connected' when no documents to track
- ✅ Fixed channel recreation flicker: inline callback refs caused effect to re-run on every render; now using refs to hold handlers
- ✅ Added 17 unit tests for ConnectionIndicator component covering all ACs
- ✅ All 864 tests pass, build succeeds

### File List

**Created:**
- `src/components/ui/connection-indicator.tsx` - ConnectionIndicator component with ConnectionState type
- `__tests__/components/ui/connection-indicator.test.tsx` - 17 unit tests for all ACs

**Modified:**
- `src/hooks/use-document-status.ts` - Added connectionState export, handle all Supabase statuses
- `src/hooks/use-processing-progress.ts` - Added connectionState export, handle all Supabase statuses, fix inactive state
- `src/app/(dashboard)/documents/page.tsx` - Replaced inline indicator with ConnectionIndicator component

---

## Senior Developer Review (AI)

**Reviewer:** Sam (via Dev Agent)
**Date:** 2025-12-03
**Outcome:** ✅ APPROVED

### Acceptance Criteria Verification

| AC | Status | Notes |
|----|--------|-------|
| AC-6.6.1 | ✅ | "Connected" + green checkmark verified |
| AC-6.6.2 | ✅ | "Connecting..." + spinner verified |
| AC-6.6.3 | ✅ | "Offline" + red styling verified |
| AC-6.6.4 | ✅ | text-xs, h-3 w-3 icons, muted colors |
| AC-6.6.5 | ✅ | "Reconnecting..." + amber + spin verified |

### Code Quality Notes

- Clean component architecture with proper separation
- Excellent TypeScript typing - ConnectionState exported correctly
- Good accessibility: role="status", aria-live="polite"
- Ref pattern for handlers prevents effect re-runs (flicker fix)
- Combined state priority logic correct (connected > reconnecting > connecting > disconnected)

### Test Coverage

17 unit tests covering all ACs - well-organized by AC for traceability.

### Build/Test Status

- `npm run build` ✅ Passed
- `npm run test` ✅ 864 tests passed (17 new)

### Security Review

No concerns - purely UI state, no user input handling.

---

## Change Log

- 2025-12-02: Story drafted via create-story workflow
- 2025-12-03: Story implemented - ConnectionIndicator component, hook updates, tests added
- 2025-12-03: Code reviewed - APPROVED
