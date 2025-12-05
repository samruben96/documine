# Acceptance Criteria (Authoritative)

## Story 9.1: Agency Branding

| AC ID | Criterion | Test Type |
|-------|-----------|-----------|
| AC-9.1.1 | Admin can access branding settings at `/settings/branding` | E2E |
| AC-9.1.2 | Admin can upload logo image (PNG/JPG, max 2MB) | Component |
| AC-9.1.3 | Admin can set primary and secondary brand colors | Component |
| AC-9.1.4 | Admin can enter contact info (phone, email, address, website) | Component |
| AC-9.1.5 | Non-admin users cannot access branding settings | E2E |
| AC-9.1.6 | Branding persists and is used in one-pager generation | E2E |

## Story 9.2: Dashboard Page

| AC ID | Criterion | Test Type |
|-------|-----------|-----------|
| AC-9.2.1 | `/dashboard` displays welcome header with agency name | Component |
| AC-9.2.2 | Three tool cards displayed: Chat, Compare, One-Pager | Component |
| AC-9.2.3 | Tool cards navigate to correct pages | E2E |
| AC-9.2.4 | Logged-in users redirected from `/` to `/dashboard` | E2E |
| AC-9.2.5 | Responsive layout: 1 col mobile, 3 col desktop | Visual |

## Story 9.3: One-Pager Page

| AC ID | Criterion | Test Type |
|-------|-----------|-----------|
| AC-9.3.1 | `/one-pager` route accessible to authenticated users | E2E |
| AC-9.3.2 | `?comparisonId=xxx` pre-populates comparison data | E2E |
| AC-9.3.3 | `?documentId=xxx` pre-populates document data | E2E |
| AC-9.3.4 | Direct access shows selector for docs/comparisons | Component |
| AC-9.3.5 | Client name input field with validation | Component |
| AC-9.3.6 | Agent notes textarea (optional) | Component |
| AC-9.3.7 | Live preview updates as user types | Component |
| AC-9.3.8 | Download button triggers PDF save | E2E |

## Story 9.4: PDF Template

| AC ID | Criterion | Test Type |
|-------|-----------|-----------|
| AC-9.4.1 | PDF includes agency logo or name text fallback | Unit |
| AC-9.4.2 | PDF includes coverage comparison table (from comparison) | Unit |
| AC-9.4.3 | PDF includes premium summary with highlights | Unit |
| AC-9.4.4 | PDF includes gaps section if gaps present | Unit |
| AC-9.4.5 | PDF includes agent notes if provided | Unit |
| AC-9.4.6 | PDF footer includes agency contact info | Unit |
| AC-9.4.7 | PDF fits on single US Letter page (typical data) | Visual |
| AC-9.4.8 | PDF uses agency brand colors | Unit |

## Story 9.5: Entry Point Buttons

| AC ID | Criterion | Test Type |
|-------|-----------|-----------|
| AC-9.5.1 | Button on comparison results → `/one-pager?comparisonId=xxx` | E2E |
| AC-9.5.2 | Button in comparison history → `/one-pager?comparisonId=xxx` | E2E |
| AC-9.5.3 | Button on document viewer → `/one-pager?documentId=xxx` | E2E |
| AC-9.5.4 | Consistent button styling across locations | Visual |

## Story 9.6: Testing & Polish

| AC ID | Criterion | Test Type |
|-------|-----------|-----------|
| AC-9.6.1 | All unit tests pass | Unit |
| AC-9.6.2 | All component tests pass | Component |
| AC-9.6.3 | All E2E tests pass | E2E |
| AC-9.6.4 | PDF renders correctly in PDF viewers | Manual |
| AC-9.6.5 | Error handling shows toast notifications | Component |
| AC-9.6.6 | Loading states shown during generation | Component |

---
