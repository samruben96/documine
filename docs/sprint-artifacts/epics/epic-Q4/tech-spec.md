# Epic Technical Specification: Q4 - Carrier Copy System

Date: 2025-12-11
Author: Sam
Epic ID: Q4
Status: Draft

---

## Overview

Epic Q4 implements the "Carrier Copy System" - the core value proposition of the Quoting Helper feature. This epic enables insurance agents to copy their client data formatted specifically for each carrier's portal, transforming the tedious process of re-entering data into 2-20 carrier websites into a simple "click to copy, paste into portal" workflow.

The system provides:
1. **Carrier Format Functions** - TypeScript formatters that transform client data into carrier-specific clipboard text
2. **Copy to Clipboard** - Modern Clipboard API with visual feedback and accessibility support
3. **Carriers Tab UI** - Action rows for each supported carrier with copy/portal buttons
4. **Data Preview** - Optional preview of formatted data before copying

This epic builds on the client data capture from Epic Q3 and enables the quote result entry in Epic Q5.

## Objectives and Scope

### In Scope

- **Copy Button Component** with state management, visual feedback, and accessibility (FR22)
- **Progressive Formatter** - Format client data for Progressive portal (FR19, FR24)
- **Travelers Formatter** - Format client data for Travelers portal (FR20, FR24)
- **Carrier Registry** - Type-safe registry of supported carriers and their formatters
- **Carriers Tab** - Full implementation replacing placeholder (FR21, FR35, FR36)
- **Carrier Action Rows** - Per-carrier row with logo, status, copy button, portal link
- **Data Preview Modal** - Show formatted data before copying (FR23)
- **Validation Integration** - Show warnings for incomplete data

### Out of Scope

- Quote result entry (Epic Q5)
- User carrier preferences/settings (Epic Q5, Story Q5.5)
- Additional carriers beyond Progressive and Travelers (post-MVP)
- Browser automation or credential storage (Phase 4)
- Mobile-optimized copy experience (future enhancement)

## System Architecture Alignment

### Component Architecture (from Architecture Doc)

```
src/
├── components/
│   └── quoting/
│       ├── copy-button.tsx           # NEW: Reusable copy button with feedback
│       ├── carrier-action-row.tsx    # NEW: Per-carrier action row
│       ├── carrier-preview-modal.tsx # NEW: Preview formatted data
│       └── tabs/
│           └── carriers-tab.tsx      # UPDATE: Full implementation
├── hooks/
│   └── quoting/
│       └── use-clipboard-copy.ts     # NEW: Clipboard API with feedback
├── lib/
│   └── quoting/
│       └── carriers/
│           ├── index.ts              # NEW: Carrier registry
│           ├── types.ts              # NEW: Carrier types and interfaces
│           ├── progressive.ts        # NEW: Progressive formatter
│           └── travelers.ts          # NEW: Travelers formatter
└── app/
    └── api/
        └── quoting/
            └── [id]/
                └── format/
                    └── [carrier]/
                        └── route.ts  # NEW: Server-side format API
```

### Architectural Constraints

1. **Client-side formatting** - Carrier formatters run client-side for instant response (<200ms)
2. **No credential storage** - Phase 3 only provides portal links, not automation
3. **Type-safe formatters** - All formatters implement CarrierFormatter interface
4. **RLS unchanged** - Uses existing quote_sessions RLS, no new policies needed
5. **Existing design system** - Use shadcn/ui components (Button, Card, Dialog, Toast)

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs |
|--------|---------------|--------|---------|
| `use-clipboard-copy` | Manage clipboard operations with feedback | text: string | { copy, copiedCarrier, error } |
| `carriers/index.ts` | Carrier registry and lookup | carrierCode | CarrierInfo |
| `progressive.ts` | Format data for Progressive | QuoteClientData | formatted string |
| `travelers.ts` | Format data for Travelers | QuoteClientData | formatted string |
| `CopyButton` | Visual copy button with state | carrier, text | UI feedback |
| `CarrierActionRow` | Row with carrier actions | carrierCode, clientData | Copy/Portal actions |
| `CarriersTab` | Full carriers list UI | sessionId, clientData, quoteType | Carriers list |

### Data Models and Contracts

```typescript
// src/lib/quoting/carriers/types.ts

import type { QuoteClientData } from '@/types/quoting';

/**
 * Carrier formatter interface
 * All carrier formatters must implement this interface
 */
export interface CarrierFormatter {
  /**
   * Format client data for clipboard copy
   * Returns tab-delimited or structured text for pasting into carrier portal
   */
  formatForClipboard(data: QuoteClientData): string;

  /**
   * Generate preview of formatted data for UI display
   */
  generatePreview(data: QuoteClientData): FormattedPreview;

  /**
   * Validate required fields are present for this carrier
   */
  validateRequiredFields(data: QuoteClientData): ValidationResult;
}

/**
 * Carrier information and metadata
 */
export interface CarrierInfo {
  code: string;
  name: string;
  portalUrl: string;
  logoPath: string;
  formatter: CarrierFormatter;
  linesOfBusiness: Array<'home' | 'auto' | 'bundle'>;
}

/**
 * Formatted preview for UI display
 */
export interface FormattedPreview {
  sections: {
    label: string;
    fields: Array<{ name: string; value: string }>;
  }[];
}

/**
 * Validation result with missing fields
 */
export interface ValidationResult {
  valid: boolean;
  missingFields: string[];
  warnings: string[];
}

/**
 * Copy button state
 */
export type CopyState = 'idle' | 'copying' | 'copied' | 'error';

/**
 * Carrier copy status (per-session tracking)
 */
export type CarrierStatus = 'not_started' | 'copied' | 'quote_entered';
```

### APIs and Interfaces

**GET /api/quoting/[id]/format/[carrier]**

Server-side formatting endpoint (optional, for validation or logging):

```typescript
// Request
GET /api/quoting/abc123/format/progressive

// Response (200 OK)
{
  "data": {
    "clipboardText": "John\tDoe\n03/15/1985\njohn@email.com...",
    "preview": {
      "sections": [
        {
          "label": "Personal Information",
          "fields": [
            { "name": "Name", "value": "John Doe" },
            { "name": "DOB", "value": "03/15/1985" }
          ]
        }
      ]
    },
    "validation": {
      "valid": true,
      "missingFields": [],
      "warnings": ["VIN not provided for Vehicle 1"]
    }
  },
  "error": null
}

// Response (400 Bad Request)
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required fields",
    "details": { "missingFields": ["firstName", "lastName"] }
  }
}
```

**Note:** Client-side formatting is preferred for performance. Server endpoint is optional for logging or complex validation.

### Workflows and Sequencing

**Copy to Clipboard Flow:**

```
User clicks "Copy for Progressive"
    │
    ├─► CopyButton → loading state
    │
    ├─► Formatter validates required fields
    │   └─► If invalid → Show validation modal with missing fields
    │
    ├─► Formatter generates clipboard text
    │
    ├─► navigator.clipboard.writeText(text)
    │   └─► If fails → Fallback to document.execCommand('copy')
    │
    ├─► CopyButton → "Copied ✓" state (2 seconds)
    │
    ├─► Screen reader announces "Copied to clipboard"
    │
    └─► CarrierStatus updates to "copied"
```

**Preview Flow:**

```
User clicks "Preview" for carrier
    │
    ├─► Formatter generates preview
    │
    ├─► PreviewModal opens with sections
    │   ├── Personal Information
    │   ├── Property (if applicable)
    │   └── Auto/Drivers (if applicable)
    │
    ├─► Validation warnings shown inline
    │
    └─► User clicks "Copy" in modal → Same copy flow
```

## Non-Functional Requirements

### Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Clipboard copy | < 200ms | Time from click to "Copied" state |
| Format generation | < 100ms | Time to generate formatted text |
| Preview modal open | < 300ms | Time from click to modal visible |
| Carriers tab load | < 500ms | Time from tab click to content render |

**Implementation:**
- Formatters are pure functions, run client-side
- No network requests required for copy action
- Preview is computed on-demand, not pre-loaded
- Carrier registry is statically defined, no async loading

### Security

| Requirement | Implementation |
|-------------|----------------|
| Data in clipboard | Not persisted, standard browser clipboard behavior |
| Portal URLs | Hardcoded in carrier registry, no user input |
| Sensitive fields | License numbers excluded from preview (masked) |
| XSS prevention | Clipboard text is plain text, not HTML |

**Note:** Client data is already protected by Supabase RLS at the session level. No additional security measures needed for clipboard operations.

### Reliability/Availability

| Scenario | Behavior |
|----------|----------|
| Clipboard API unavailable | Fallback to document.execCommand('copy') |
| Formatter error | Show error toast, log to console, allow retry |
| Portal URL unreachable | Opens in new tab (browser handles connection) |
| Missing client data | Show validation modal, prevent copy |

### Observability

| Signal | Implementation |
|--------|----------------|
| Copy success | Toast: "Copied to clipboard" |
| Copy failure | Toast: "Failed to copy. Click to retry." |
| Validation warning | Inline warning in carrier row |
| Portal opened | Browser's new tab indicator |
| Screen reader | aria-live announcement on copy |

## Dependencies and Integrations

### NPM Dependencies (existing)

| Package | Version | Usage |
|---------|---------|-------|
| react | 19.2.0 | Component framework |
| lucide-react | 0.554.0 | Icons (Clipboard, Check, ExternalLink) |
| sonner | 2.0.7 | Toast notifications |
| class-variance-authority | 0.7.1 | Button variants |
| @radix-ui/react-dialog | 1.1.15 | Preview modal |

### Internal Dependencies

| Module | Usage |
|--------|-------|
| `@/types/quoting` | QuoteClientData, QuoteSession types |
| `@/lib/quoting/formatters` | Date/phone formatting utilities |
| `@/lib/quoting/validation` | VIN validation |
| `@/components/ui/*` | Button, Card, Dialog, Badge |
| `@/hooks/quoting/use-quote-session` | Session data access |

### External Integrations

| Integration | Type | Details |
|-------------|------|---------|
| Progressive Portal | External link | https://forageint.progressive.com/ |
| Travelers Portal | External link | https://www.travelers.com/agentlink |

**Note:** No API integration - portals are opened in new tabs only.

## Acceptance Criteria (Authoritative)

### Story Q4.1: Copy Button & Carrier Formatters (Combined)

| ID | Criterion |
|----|-----------|
| AC-Q4.1-1 | Clicking "Copy for Progressive" copies formatted client data to clipboard |
| AC-Q4.1-2 | Clicking "Copy for Travelers" copies formatted client data to clipboard |
| AC-Q4.1-3 | Copy button shows "Copied ✓" with green tint for 2 seconds after success |
| AC-Q4.1-4 | Copy button resets to default state after 2 seconds |
| AC-Q4.1-5 | Screen reader announces "Copied to clipboard" (aria-live="polite") |
| AC-Q4.1-6 | Copy fails gracefully with "Failed - Click to retry" on error |
| AC-Q4.1-7 | Keyboard users can trigger copy with Enter or Space |
| AC-Q4.1-8 | Dates are formatted as MM/DD/YYYY in clipboard output |
| AC-Q4.1-9 | Phone numbers are formatted as (XXX) XXX-XXXX in clipboard output |
| AC-Q4.1-10 | Tab-delimited format used for multi-field sections |
| AC-Q4.1-11 | Blank/missing fields are handled gracefully (empty or omitted) |
| AC-Q4.1-12 | Progressive formatter includes personal, property, and auto sections |
| AC-Q4.1-13 | Travelers formatter includes personal, property, and auto sections |

### Story Q4.2: Carriers Tab UI & Actions

| ID | Criterion |
|----|-----------|
| AC-Q4.2-1 | Carriers tab shows list of supported carriers (Progressive, Travelers) |
| AC-Q4.2-2 | Each carrier row displays: logo (24x24), name, status badge |
| AC-Q4.2-3 | Each carrier row has "Copy Data" button (primary style) |
| AC-Q4.2-4 | Each carrier row has "Open Portal" button (ghost style, external icon) |
| AC-Q4.2-5 | "Open Portal" opens carrier URL in new browser tab |
| AC-Q4.2-6 | Status badge shows "Not Started" initially (gray) |
| AC-Q4.2-7 | Status badge shows "Copied" after data is copied (blue) |
| AC-Q4.2-8 | Status badge shows "Quote Entered" when result saved (green) |
| AC-Q4.2-9 | Copy status persists during session (local state) |
| AC-Q4.2-10 | Carriers filtered by quote type (home carriers for home-only, etc.) |
| AC-Q4.2-11 | Ready indicator shows when all required data is entered |

### Story Q4.3: Data Preview Before Copy

| ID | Criterion |
|----|-----------|
| AC-Q4.3-1 | "Preview" link/button available for each carrier |
| AC-Q4.3-2 | Preview modal displays formatted data organized by section |
| AC-Q4.3-3 | Sections include: Personal Information, Property (if applicable), Auto (if applicable) |
| AC-Q4.3-4 | Field names and values clearly displayed |
| AC-Q4.3-5 | License numbers masked in preview (••••••1234) |
| AC-Q4.3-6 | Validation warnings shown for incomplete data |
| AC-Q4.3-7 | Missing required fields highlighted with warning color |
| AC-Q4.3-8 | "Copy" button at bottom of preview modal |
| AC-Q4.3-9 | "Close" button dismisses modal |
| AC-Q4.3-10 | ESC key closes modal |

## Traceability Mapping

| AC | Spec Section | Component(s) | Test Approach |
|----|--------------|--------------|---------------|
| AC-Q4.1-1 | formatForClipboard | progressive.ts | Unit: formatter output |
| AC-Q4.1-2 | formatForClipboard | travelers.ts | Unit: formatter output |
| AC-Q4.1-3 | CopyButton states | copy-button.tsx | Component: state transitions |
| AC-Q4.1-4 | CopyButton timeout | use-clipboard-copy.ts | Hook: timer reset |
| AC-Q4.1-5 | aria-live | copy-button.tsx | A11y: screen reader test |
| AC-Q4.1-6 | Error handling | use-clipboard-copy.ts | Hook: error state |
| AC-Q4.1-7 | Keyboard | copy-button.tsx | Component: keydown handlers |
| AC-Q4.1-8 | Date format | formatters.ts | Unit: formatDate function |
| AC-Q4.1-9 | Phone format | formatters.ts | Unit: formatPhone function |
| AC-Q4.1-10 | Tab delimiter | progressive.ts, travelers.ts | Unit: output format |
| AC-Q4.1-11 | Null handling | formatters | Unit: edge cases |
| AC-Q4.1-12 | Progressive sections | progressive.ts | Unit: section coverage |
| AC-Q4.1-13 | Travelers sections | travelers.ts | Unit: section coverage |
| AC-Q4.2-1 | Carrier list | carriers-tab.tsx | Component: render carriers |
| AC-Q4.2-2 | Carrier row | carrier-action-row.tsx | Component: layout |
| AC-Q4.2-3 | Copy button | carrier-action-row.tsx | Component: button style |
| AC-Q4.2-4 | Portal button | carrier-action-row.tsx | Component: button style |
| AC-Q4.2-5 | Portal link | carrier-action-row.tsx | E2E: new tab opens |
| AC-Q4.2-6 | Status: not started | carrier-action-row.tsx | Component: initial state |
| AC-Q4.2-7 | Status: copied | carrier-action-row.tsx | Component: after copy |
| AC-Q4.2-8 | Status: quote entered | carrier-action-row.tsx | Component: after result |
| AC-Q4.2-9 | Status persistence | carriers-tab.tsx | Hook: session state |
| AC-Q4.2-10 | Quote type filter | carriers/index.ts | Unit: carrier filtering |
| AC-Q4.2-11 | Ready indicator | carriers-tab.tsx | Component: validation |
| AC-Q4.3-1 | Preview trigger | carrier-action-row.tsx | Component: preview link |
| AC-Q4.3-2 | Preview modal | carrier-preview-modal.tsx | Component: layout |
| AC-Q4.3-3 | Section display | generatePreview | Unit: sections generated |
| AC-Q4.3-4 | Field display | carrier-preview-modal.tsx | Component: field render |
| AC-Q4.3-5 | License masking | generatePreview | Unit: sensitive data |
| AC-Q4.3-6 | Validation warnings | validateRequiredFields | Unit: warning generation |
| AC-Q4.3-7 | Missing fields | carrier-preview-modal.tsx | Component: warning style |
| AC-Q4.3-8 | Copy in modal | carrier-preview-modal.tsx | Component: copy action |
| AC-Q4.3-9 | Close button | carrier-preview-modal.tsx | Component: close action |
| AC-Q4.3-10 | ESC key | carrier-preview-modal.tsx | A11y: keyboard close |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Clipboard API blocked by browser | Low | Medium | Implement document.execCommand fallback |
| Carrier portal URLs change | Medium | Low | Centralized URL config, easy to update |
| Format doesn't match portal fields | Medium | High | User testing with real portals, iterate |
| Data completeness for copy | Medium | Medium | Validation modal with missing fields |

### Assumptions

1. **A1:** Users will paste data into carrier portals manually (Phase 3 only)
2. **A2:** Progressive and Travelers portal field layouts are known/researched
3. **A3:** Tab-delimited format is suitable for field-by-field paste
4. **A4:** Modern browsers (Chrome, Edge, Safari) support Clipboard API
5. **A5:** Users have accounts on carrier portals (not managed by docuMINE)

### Open Questions

| Question | Owner | Status |
|----------|-------|--------|
| Q1: Exact Progressive portal field order? | Sam | Research needed |
| Q2: Exact Travelers portal field order? | Sam | Research needed |
| Q3: Should copy include ALL data or just carrier-relevant? | Sam | Decision: carrier-relevant only |
| Q4: Track copy analytics (success rate, carriers used)? | Sam | Decision: Post-MVP |

## Test Strategy Summary

### Unit Tests

| Area | Coverage | Framework |
|------|----------|-----------|
| Progressive formatter | 100% branches | Vitest |
| Travelers formatter | 100% branches | Vitest |
| use-clipboard-copy hook | All states | Vitest + RTL |
| Validation functions | All rules | Vitest |
| Date/phone formatters | Edge cases | Vitest |

### Component Tests

| Component | Test Focus | Framework |
|-----------|------------|-----------|
| CopyButton | State transitions, a11y | RTL |
| CarrierActionRow | Layout, interactions | RTL |
| CarriersTab | Carrier list, filtering | RTL |
| CarrierPreviewModal | Content, actions | RTL |

### E2E Tests

| Scenario | Steps | Framework |
|----------|-------|-----------|
| Copy flow | Enter data → Copy → Verify clipboard | Playwright |
| Portal link | Click portal → Verify new tab | Playwright |
| Preview flow | Open preview → Verify content → Copy | Playwright |

### Accessibility Tests

| Test | Criteria |
|------|----------|
| Keyboard navigation | Tab through all interactive elements |
| Screen reader | Announce copy success/failure |
| Focus management | Focus returns to button after modal close |
| Color contrast | 4.5:1 on status badges and buttons |

---

_Generated by BMAD BMM Epic Tech Context Workflow_
_Date: 2025-12-11_
