# Epic Q4: Carrier Copy System

**Status:** Contexted
**FRs Covered:** FR19-24, FR35-36 (8 FRs)
**Stories:** 3 (consolidated from 4)
**Depends On:** Epic Q3 (Client Data Capture)

---

## Overview

Epic Q4 delivers the core "magic moment" of Quoting Helper: the ability to click "Copy for Progressive" and get perfectly formatted client data ready to paste into the carrier portal. This transforms the tedious task of re-entering the same information across 2-20 carrier websites into a simple copy-paste workflow.

The epic implements:
- **Carrier Format Functions** - TypeScript formatters that transform client data into carrier-specific text
- **Copy to Clipboard** - Modern Clipboard API with visual feedback and accessibility
- **Carriers Tab UI** - Full implementation of the carriers tab with action rows
- **Data Preview** - Optional preview before copying

## Objectives

1. **Enable one-click copy** - Users copy carrier-formatted data with a single click
2. **Provide visual feedback** - Clear confirmation when data is copied successfully
3. **Support multiple carriers** - Progressive and Travelers formatters for MVP
4. **Validate before copy** - Warn users about incomplete data
5. **Preview formatted data** - Optional preview before copying to clipboard

## Stories

| Story | Title | Description |
|-------|-------|-------------|
| Q4.1 | Copy Button & Carrier Formatters | Implement copy button with feedback states, Progressive formatter, and Travelers formatter. Combined story covering FR19, FR20, FR22, FR24. |
| Q4.2 | Carriers Tab UI & Actions | Replace placeholder with full carriers tab implementation. Per-carrier rows with logo, status, copy button, and portal link. Covers FR21, FR35, FR36. |
| Q4.3 | Data Preview Before Copy | Modal showing formatted data preview with validation warnings. User can copy from preview or dismiss. Covers FR23. |

**Note:** Stories consolidated from original 4 to 3 for efficient implementation. Q4.1 combines copy button (FR22) with formatters (FR19, FR20, FR24) since they're tightly coupled.

## Acceptance Summary

### Copy & Format (Q4.1)
- Clicking "Copy for Progressive" copies formatted data to clipboard
- Clicking "Copy for Travelers" copies formatted data to clipboard
- Button shows "Copied ✓" green state for 2 seconds
- Screen reader announces success (aria-live)
- Keyboard accessible (Enter/Space)
- Dates formatted MM/DD/YYYY, phones (XXX) XXX-XXXX

### Carriers Tab (Q4.2)
- Carriers tab shows Progressive and Travelers
- Each row: logo, name, status badge, copy button, portal button
- "Open Portal" opens carrier URL in new tab
- Status tracks: Not Started → Copied → Quote Entered
- Carriers filtered by quote type

### Preview (Q4.3)
- Preview modal shows formatted data by section
- License numbers masked in preview
- Validation warnings for missing fields
- Copy button in modal
- ESC/Close button to dismiss

## Dependencies

### Prerequisite Epics
- **Epic Q3** (Client Data Capture) - Client data must exist to format

### Technical Dependencies
- Existing `QuoteClientData` type from `@/types/quoting`
- Existing `formatDate`, `formatPhone` from `@/lib/quoting/formatters`
- shadcn/ui components (Button, Card, Dialog, Badge)
- Lucide icons (Clipboard, Check, ExternalLink)

### External Dependencies
- Clipboard API (modern browsers)
- Carrier portal URLs (static, no API)

## Related Documents

- [Tech Spec](./tech-spec.md) - Detailed technical specification
- [PRD](/docs/features/quoting/prd.md) - Product requirements
- [Architecture](/docs/features/quoting/architecture.md) - System architecture
- [UX Design](/docs/features/quoting/ux-design.md) - User experience specification
- [Epics Overview](/docs/features/quoting/epics.md) - All quoting epics

---

_Epic contexted by BMAD BMM Workflow_
_Date: 2025-12-11_
