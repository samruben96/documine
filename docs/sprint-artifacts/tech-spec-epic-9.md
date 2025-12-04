# Epic Technical Specification: One-Pager Generation

Date: 2025-12-03
Author: Sam
Epic ID: 9
Status: Contexted

---

## Overview

Epic 9 delivers professional, branded one-pager PDF generation for insurance agents. This transforms docuMINE from a back-office analysis tool into a client-facing productivity multiplier. Agents can analyze documents, compare quotes, and immediately generate polished summaries to share with clients - all without manual formatting.

The feature builds on Epic 7's extraction pipeline and leverages the proven @react-pdf/renderer pattern (Story 7.6). Key additions include agency branding management, a central dashboard hub, and a dedicated one-pager generation page with three entry points: from quote comparison, from document chat, and standalone selection.

**PRD Context:**
- Phase 2 feature: "One-pager generation: Auto-create client-ready comparison summaries from uploaded quotes" (PRD Section: Growth Features)
- FR26: "Users can export comparison results (PDF or structured format)"
- NFR13-16: 95%+ accuracy for extracted data displayed in one-pagers

---

## Objectives and Scope

### Objectives

1. **Client-Ready Output** - Generate professional PDFs agents can send directly to clients
2. **Agency Branding** - Consistent branding across all generated outputs
3. **Zero Manual Formatting** - Data flows automatically from extraction to PDF
4. **Trust Transparency** - Source attribution for extracted data in one-pagers
5. **Navigation Hub** - Dashboard providing clear access to all docuMINE tools

### In Scope

| Feature | Description | Story |
|---------|-------------|-------|
| Agency Branding | Admin-configurable logo, colors, contact info | 9.1 |
| Dashboard Page | `/dashboard` with tool cards and agency welcome | 9.2 |
| One-Pager Page | `/one-pager` with 3 entry points and live preview | 9.3 |
| PDF Template | @react-pdf/renderer document with branding | 9.4 |
| Entry Point Buttons | Quick access from compare, docs, history | 9.5 |
| Testing & Polish | Unit, component, E2E coverage | 9.6 |

### Out of Scope

- CRM integration for auto-populating client data (Future Epic)
- Multiple template variants (premium, summary, detailed)
- Email direct-send from app
- Digital signature integration
- Custom branding per comparison (always uses agency branding)
- Mobile-first design (desktop/tablet priority)

---

## System Architecture Alignment

### Architecture References

| Component | Document Section | Notes |
|-----------|------------------|-------|
| PDF Generation | ADR-007 | @react-pdf/renderer pattern proven in Story 7.6 |
| Data Extraction | ADR-007 | GPT-5.1 structured outputs feed one-pager |
| Multi-Tenancy | Data Architecture | agency_id on all branding data |
| File Storage | Storage Policies | Logo storage in `branding/` bucket |
| UI Architecture | UI/UX Architecture | Split-view pattern for preview |

### Integration with Existing Systems

```
┌─────────────────────────────────────────────────────────────┐
│  Epic 7 Infrastructure (Quote Comparison)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ extraction  │  │ diff.ts     │  │ pdf-export.tsx      │ │
│  │ .ts         │  │ (table data)│  │ (pattern to follow) │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────┘ │
│         │                │                     │           │
└─────────┼────────────────┼─────────────────────┼───────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Epic 9: One-Pager Generation                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ useOnePager │  │ template.tsx│  │ generator.ts        │ │
│  │ Data.ts     │  │ (PDF doc)   │  │ (service)           │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│         ▲                                                   │
│         │                                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ useAgencyBranding.ts (NEW)                              ││
│  │ - Fetches branding from agencies table                  ││
│  │ - Provides logo URL, colors, contact info               ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs |
|--------|---------------|--------|---------|
| `useAgencyBranding` | Fetch agency branding data | `agencyId` | `AgencyBranding` object |
| `useOnePagerData` | Prepare data for PDF generation | `comparisonId` or `documentId` | `OnePagerData` object |
| `generateOnePager` | Create PDF blob from data | `OnePagerData`, `AgencyBranding` | `Blob` (PDF) |
| `OnePagerTemplate` | React PDF document component | Props with all data | `@react-pdf/renderer` Document |

### Data Models and Contracts

#### Agency Branding (Database Schema Addition)

```sql
-- Migration: Add branding columns to agencies table
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS primary_color varchar(7) DEFAULT '#2563eb';
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS secondary_color varchar(7) DEFAULT '#1e40af';
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS phone varchar(20);
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS branding_email varchar(255);  -- Renamed to avoid conflict with agency email
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS website varchar(255);

-- Index for quick branding lookups (agencies already indexed by id)
-- No additional index needed
```

#### TypeScript Types

```typescript
// src/lib/one-pager/types.ts

export interface AgencyBranding {
  name: string;              // From agencies.name
  logoUrl: string | null;    // Logo in Supabase Storage
  primaryColor: string;      // Hex code (default: #2563eb)
  secondaryColor: string;    // Hex code (default: #1e40af)
  phone: string | null;
  email: string | null;      // Branding email (may differ from agency admin email)
  address: string | null;
  website: string | null;
}

export interface OnePagerData {
  // Mode determines data source
  mode: 'comparison' | 'document' | 'select';

  // From comparison (mode === 'comparison')
  comparison?: {
    id: string;
    headers: string[];        // Carrier names
    rows: ComparisonRow[];    // From diff.ts
    gaps: GapWarning[];
    conflicts: ConflictWarning[];
  };

  // From document (mode === 'document')
  document?: {
    id: string;
    name: string;
    summary: string;          // AI-generated summary
    keyPoints: string[];      // Extracted highlights
  };

  // User-entered fields
  clientName: string;
  agentNotes: string;
  agentName: string;          // From user profile

  // Metadata
  generatedAt: Date;
}

export interface OnePagerConfig {
  showGaps: boolean;          // Default: true
  showPremiumSummary: boolean; // Default: true
  showAgentNotes: boolean;    // Default: true if notes provided
}
```

### APIs and Interfaces

#### No New API Endpoints Required

One-pager generation is client-side only (using @react-pdf/renderer). Data fetching uses existing endpoints:

| Data Source | Endpoint | Notes |
|-------------|----------|-------|
| Comparison Data | GET `/api/compare?id=xxx` | Existing from Story 7.3 |
| Document Data | GET `/api/documents/:id` | Existing from Epic 4 |
| Agency Branding | Direct Supabase query | New columns on `agencies` table |
| User Profile | `useUser()` hook | For agent name |

#### Branding Update (Admin Only)

```typescript
// Client-side update via Supabase client
// No API route needed - RLS policies handle authorization

const updateBranding = async (branding: Partial<AgencyBranding>) => {
  const { error } = await supabase
    .from('agencies')
    .update({
      logo_url: branding.logoUrl,
      primary_color: branding.primaryColor,
      secondary_color: branding.secondaryColor,
      phone: branding.phone,
      branding_email: branding.email,
      address: branding.address,
      website: branding.website,
    })
    .eq('id', agencyId);

  if (error) throw error;
};
```

### Workflows and Sequencing

#### One-Pager Generation Flow

```
1. User clicks "Generate One-Pager" button
   ├── From Comparison Results: /one-pager?comparisonId=xxx
   ├── From Document Viewer: /one-pager?documentId=xxx
   └── From Dashboard: /one-pager (select mode)

2. One-Pager Page loads
   ├── Parse query params to determine mode
   ├── Fetch data based on mode:
   │   ├── comparison: GET /api/compare?id=xxx
   │   ├── document: GET /api/documents/:id
   │   └── select: Show selector UI
   └── Fetch agency branding: SELECT from agencies

3. User configures one-pager
   ├── Enter client name (required)
   ├── Enter agent notes (optional)
   └── Preview updates in real-time

4. User clicks "Download"
   ├── generateOnePager() creates PDF blob
   ├── Logo fetched and converted to base64
   ├── file-saver triggers download
   └── Filename: docuMINE-one-pager-YYYY-MM-DD.pdf
```

#### Logo Upload Flow

```
1. Admin navigates to Settings → Branding
2. Admin drops/selects logo image
   ├── Validate: PNG/JPG, max 2MB, max 800x200px
   └── Show preview
3. On save:
   ├── Upload to Supabase Storage: branding/{agencyId}/logo.{ext}
   ├── Get public URL
   └── Update agencies.logo_url
```

---

## Non-Functional Requirements

### Performance

| Metric | Target | Implementation Strategy |
|--------|--------|------------------------|
| PDF generation time | < 3 seconds | Client-side generation, lazy-load logo |
| Preview update latency | < 500ms | React state, no server round-trip |
| Page load time | < 2 seconds | SSR, code splitting |
| Logo upload | < 5 seconds | Direct to Supabase Storage |

### Security

| Requirement | Implementation |
|-------------|---------------|
| Admin-only branding access | RLS policy: `role = 'admin'` for UPDATE on agencies |
| Logo storage isolation | Storage path: `branding/{agencyId}/...` with RLS |
| No PII in generated PDFs | Client name is user-entered, no auto-population |
| Document access control | Existing RLS policies on documents, comparisons |

```sql
-- RLS policy for branding updates (admin only)
CREATE POLICY "Admins can update branding" ON agencies
  FOR UPDATE
  USING (
    id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Storage policy for branding bucket
CREATE POLICY "Upload to own agency branding folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'branding' AND
    (storage.foldername(name))[1] = (SELECT agency_id::text FROM users WHERE id = auth.uid()) AND
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
```

### Reliability/Availability

| Requirement | Implementation |
|-------------|---------------|
| Graceful degradation | If logo fetch fails, use agency name text |
| No data loss | PDF generated client-side, no server state |
| Error feedback | Toast notifications for all failures |
| Offline support | Not required (needs data from server) |

### Observability

| Signal | Implementation |
|--------|---------------|
| Generation events | `log.info('One-pager generated', { mode, agencyId })` |
| Error tracking | `log.error('PDF generation failed', error)` |
| Usage metrics | Future: Track generation count per agency |

---

## Dependencies and Integrations

### Existing Dependencies (No Changes)

| Package | Version | Purpose |
|---------|---------|---------|
| @react-pdf/renderer | 4.3.1 | PDF generation |
| file-saver | 2.0.5 | Download trigger |
| react-dropzone | 14.3.8 | Logo upload |
| lucide-react | 0.554.0 | Icons |

### New Dependencies

None required - all functionality achievable with existing packages.

### Internal Module Dependencies

| From | To | Data Flow |
|------|----|-----------|
| `/one-pager` page | `useAgencyBranding` | Agency branding data |
| `/one-pager` page | `useOnePagerData` | Comparison/document data |
| `OnePagerForm` | `OnePagerPreview` | Form state for live preview |
| `OnePagerPreview` | `generateOnePager` | Data → PDF blob |
| `generateOnePager` | `OnePagerTemplate` | Render PDF document |

### External Integrations

| Service | Integration Point | Notes |
|---------|------------------|-------|
| Supabase Storage | Logo upload/retrieval | `branding/` bucket |
| Supabase Database | Branding data | `agencies` table columns |

---

## Acceptance Criteria (Authoritative)

### Story 9.1: Agency Branding

| AC ID | Criterion | Test Type |
|-------|-----------|-----------|
| AC-9.1.1 | Admin can access branding settings at `/settings/branding` | E2E |
| AC-9.1.2 | Admin can upload logo image (PNG/JPG, max 2MB) | Component |
| AC-9.1.3 | Admin can set primary and secondary brand colors | Component |
| AC-9.1.4 | Admin can enter contact info (phone, email, address, website) | Component |
| AC-9.1.5 | Non-admin users cannot access branding settings | E2E |
| AC-9.1.6 | Branding persists and is used in one-pager generation | E2E |

### Story 9.2: Dashboard Page

| AC ID | Criterion | Test Type |
|-------|-----------|-----------|
| AC-9.2.1 | `/dashboard` displays welcome header with agency name | Component |
| AC-9.2.2 | Three tool cards displayed: Chat, Compare, One-Pager | Component |
| AC-9.2.3 | Tool cards navigate to correct pages | E2E |
| AC-9.2.4 | Logged-in users redirected from `/` to `/dashboard` | E2E |
| AC-9.2.5 | Responsive layout: 1 col mobile, 3 col desktop | Visual |

### Story 9.3: One-Pager Page

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

### Story 9.4: PDF Template

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

### Story 9.5: Entry Point Buttons

| AC ID | Criterion | Test Type |
|-------|-----------|-----------|
| AC-9.5.1 | Button on comparison results → `/one-pager?comparisonId=xxx` | E2E |
| AC-9.5.2 | Button in comparison history → `/one-pager?comparisonId=xxx` | E2E |
| AC-9.5.3 | Button on document viewer → `/one-pager?documentId=xxx` | E2E |
| AC-9.5.4 | Consistent button styling across locations | Visual |

### Story 9.6: Testing & Polish

| AC ID | Criterion | Test Type |
|-------|-----------|-----------|
| AC-9.6.1 | All unit tests pass | Unit |
| AC-9.6.2 | All component tests pass | Component |
| AC-9.6.3 | All E2E tests pass | E2E |
| AC-9.6.4 | PDF renders correctly in PDF viewers | Manual |
| AC-9.6.5 | Error handling shows toast notifications | Component |
| AC-9.6.6 | Loading states shown during generation | Component |

---

## Traceability Mapping

| AC | Spec Section | Component(s) | Test Idea |
|----|--------------|--------------|-----------|
| AC-9.1.1 | APIs - Branding | BrandingForm, /settings/branding | Navigate as admin, verify form renders |
| AC-9.1.2 | Data Models - Branding | LogoUpload | Upload valid image, verify storage path |
| AC-9.1.3 | Data Models - AgencyBranding | ColorPicker | Select colors, verify hex values saved |
| AC-9.1.6 | Workflows | useAgencyBranding | Generate PDF, verify logo/colors applied |
| AC-9.2.1 | UI Architecture | WelcomeHeader | Render header, verify agency name displayed |
| AC-9.2.3 | Detailed Design | ToolCard | Click card, verify navigation |
| AC-9.3.2 | Workflows | useOnePagerData | Navigate with comparisonId, verify data loaded |
| AC-9.3.7 | Workflows | OnePagerPreview | Type in form, verify preview updates |
| AC-9.4.1 | Detailed Design | AgencyHeader (PDF) | Generate with/without logo, verify fallback |
| AC-9.4.7 | NFR Performance | OnePagerTemplate | Generate with typical data, verify single page |

---

## Risks, Assumptions, Open Questions

### Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **R1:** Logo rendering fails in PDF | Medium | Medium | Base64 conversion with text fallback |
| **R2:** PDF doesn't fit single page with large data | Medium | Low | Limit comparison to 10 coverage rows per page |
| **R3:** Live preview is sluggish | Low | Medium | Debounce form updates, memoize PDF render |
| **R4:** Admin-only access bypassed | Low | High | RLS policies at database level |

### Assumptions

| ID | Assumption | Validation |
|----|------------|------------|
| **A1** | @react-pdf/renderer handles dynamic branding colors | Tested in Story 7.6 |
| **A2** | Agencies have at most 2MB logo files | Enforce in upload validation |
| **A3** | Users understand "One-Pager" terminology | Consider "Client Summary" as alternative |
| **A4** | Single-page format is sufficient for typical comparisons | Research shows 2-4 quotes with 10-15 coverages |

### Open Questions

| ID | Question | Resolution Path |
|----|----------|-----------------|
| **Q1** | Should we support document-only one-pagers (no comparison)? | Yes - included in scope |
| **Q2** | How to handle comparisons with 5+ quotes? | Two-page layout or limit selection |
| **Q3** | Custom fields per agency? | Future enhancement - not MVP |

---

## Test Strategy Summary

### Test Coverage by Layer

| Layer | Framework | Location | Coverage Target |
|-------|-----------|----------|-----------------|
| Unit | Vitest | `__tests__/lib/one-pager/` | Generator functions, type validation |
| Component | React Testing Library | `__tests__/components/one-pager/` | Form interactions, preview updates |
| E2E | Playwright | `__tests__/e2e/one-pager-*.spec.ts` | Full flows for all entry points |

### Test Scenarios

**Unit Tests:**
- `generator.test.ts` - PDF blob creation, logo fallback, color application
- `types.test.ts` - Data validation, schema compliance

**Component Tests:**
- `one-pager-form.test.tsx` - Client name validation, notes input
- `one-pager-preview.test.tsx` - Render with mock data, update on prop change
- `branding-form.test.tsx` - Logo upload, color picker, save button

**E2E Tests:**
- `one-pager-from-comparison.spec.ts` - Full flow from comparison page
- `one-pager-from-document.spec.ts` - Full flow from document viewer
- `one-pager-direct.spec.ts` - Direct access with selector
- `branding-admin.spec.ts` - Admin branding configuration

### Visual Testing

Manual verification of generated PDFs in:
- macOS Preview
- Chrome PDF viewer
- Adobe Acrobat Reader

---

## Implementation Guide

### Story Sequence

```
9.1 Agency Branding ─────────┐
                             ├── 9.3 One-Pager Page ──┬── 9.4 PDF Template
9.2 Dashboard Page ──────────┘                        │
                                                      └── 9.5 Entry Points
                                                                │
                                                                ▼
                                                        9.6 Testing & Polish
```

**Parallel Development:**
- Stories 9.1 and 9.2 can be developed in parallel
- Story 9.3 requires 9.1 (branding data for preview)
- Story 9.4 requires 9.1 and 9.3
- Story 9.5 requires 9.3 (page to navigate to)
- Story 9.6 requires all previous stories

### Key Implementation Files

| File | Story | Purpose |
|------|-------|---------|
| `supabase/migrations/XXXXX_agency_branding.sql` | 9.1 | Database schema |
| `src/hooks/use-agency-branding.ts` | 9.1 | Branding data hook |
| `src/app/(dashboard)/settings/branding/page.tsx` | 9.1 | Admin settings page |
| `src/app/(dashboard)/dashboard/page.tsx` | 9.2 | Dashboard page |
| `src/components/dashboard/tool-card.tsx` | 9.2 | Tool card component |
| `src/app/(dashboard)/one-pager/page.tsx` | 9.3 | One-pager page |
| `src/components/one-pager/one-pager-form.tsx` | 9.3 | Form component |
| `src/components/one-pager/one-pager-preview.tsx` | 9.3 | Preview component |
| `src/lib/one-pager/template.tsx` | 9.4 | PDF template |
| `src/lib/one-pager/generator.ts` | 9.4 | Generation service |
| `src/components/one-pager/one-pager-button.tsx` | 9.5 | Shared button |

---

*Generated by BMAD Epic Tech Context Workflow*
*Epic 9: One-Pager Generation*
*Date: 2025-12-03*
*Author: Sam*
