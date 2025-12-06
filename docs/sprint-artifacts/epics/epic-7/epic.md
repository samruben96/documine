# Epic 7: Quote Comparison

> **Related:** Story files at [`docs/sprint-artifacts/epics/epic-7/stories/`](../sprint-artifacts/epics/epic-7/stories/)

**Goal:** Enable users to compare multiple insurance quotes side-by-side, with automatic extraction of key data points, difference highlighting, and source verification.

**User Value:** Users can quickly compare carrier quotes to find the best coverage for their clients, identifying gaps and differences without manual spreadsheet work.

**FRs Addressed:** FR20, FR21, FR22, FR23, FR24, FR25, FR26

**Note:** Renumbered from Epic 6 (2025-12-02) to allow Epic 5 Cleanup first.

---

## Story 7.1: Quote Selection Interface

As a **user**,
I want **to select multiple documents for comparison**,
So that **I can compare quotes from different carriers**.

**Acceptance Criteria:**

**Given** I click "Compare" in the header navigation
**When** the comparison page loads (`/compare`)
**Then** I see a quote selection interface:
- "Select quotes to compare" heading
- Document cards showing available documents
- Checkbox on each card for selection
- Selected count: "2 of 4 selected"

**And** selection constraints:
- Minimum 2 documents required
- Maximum 4 documents allowed
- If <2 selected: "Compare" button disabled
- If at 4: additional selections blocked with tooltip "Maximum 4 quotes"

**And** alternative flow - upload new quotes:
- "Upload new quotes" button
- Opens upload zone (same as document upload)
- Newly uploaded docs appear in selection list

**And** when I click "Compare":
- Navigate to comparison view
- Show extraction progress

**Prerequisites:** Story 4.3

**Technical Notes:**
- Page: `@/app/(dashboard)/compare/page.tsx`
- Reuse document card component with selection variant
- Store selected document IDs in local state or URL params
- Filter to show only ready documents (not processing/failed)

---

## Story 7.2: Quote Data Extraction

As the **system**,
I want **to extract structured data from insurance quote documents**,
So that **quotes can be compared in a standardized format**.

**Acceptance Criteria:**

**Given** documents are selected for comparison
**When** extraction runs
**Then** the following fields are extracted from each quote:
- Carrier name
- Coverage type(s): Liability, Property, Auto, Umbrella, etc.
- Limits: Per occurrence, aggregate, per person, etc.
- Deductibles: Per claim, per occurrence
- Premium: Annual, monthly, or as stated
- Effective dates
- Named insured
- Key exclusions (list)

**And** extraction uses GPT-4o function calling:
- Structured output schema defines expected fields
- Document chunks as context
- Handles varied formats across carriers

**And** extraction progress shown:
- Per-document progress: "Extracting Hartford quote..."
- Per-field progress (optional): Show fields as they're extracted
- Total: "Extracting 3 of 4 quotes..."

**And** extraction handles edge cases:
- Field not found → null value with "Not found" display
- Ambiguous value → extract best match, flag for review
- Multiple policies in one doc → extract first/primary

**And** source references stored:
- Each extracted value includes page number
- Enables "view source" on any cell

**Prerequisites:** Story 6.1, Story 4.6

**Technical Notes:**
- API route: POST `/api/compare` with document IDs
- Use GPT-4o with function calling for structured extraction
- Schema defines all extractable fields with types
- Cache extraction results in database (don't re-extract same doc)
- Consider: extraction at upload time vs. on-demand (on-demand for MVP)

---

## Story 7.3: Comparison Table View

As a **user**,
I want **to see extracted quote data in a side-by-side table**,
So that **I can easily compare coverage details**.

**Acceptance Criteria:**

**Given** quote extraction is complete
**When** I view the comparison table
**Then** I see a table with:
- Columns: Field name, Quote 1, Quote 2, Quote 3, Quote 4 (as applicable)
- Rows: One per extracted field
- Column headers: Carrier name

**And** table formatting:
- Sticky header row (carrier names)
- Sticky first column (field names)
- Horizontal scroll if needed (4 quotes)
- Zebra striping for readability

**And** difference highlighting:
- Cells with different values: subtle highlight
- Best value in row: green indicator (●)
- Worst/lowest value: red indicator (○)
- "Best/worst" logic:
  - Limits: higher is better
  - Deductibles: lower is better
  - Premium: lower is better

**And** "Not found" handling:
- Gray text: "—" or "Not found"
- Doesn't participate in best/worst comparison

**And** table layout per UX spec:
- Trustworthy Slate colors
- Clean borders
- Readable typography

**Prerequisites:** Story 6.2

**Technical Notes:**
- Component: `@/components/compare/comparison-table.tsx`
- Best/worst logic configurable per field type
- Consider virtualized table for performance (probably overkill for 4 cols)
- Table responsive: horizontal scroll on smaller screens

---

## Story 7.4: Gap & Conflict Identification

As a **user**,
I want **to see coverage gaps and conflicts highlighted**,
So that **I can identify potential issues before recommending a quote**.

**Acceptance Criteria:**

**Given** quote comparison data is displayed
**When** I view gaps and conflicts
**Then** gaps are identified and flagged:
- Coverage present in one quote but missing in another
- Highlighted with warning icon (⚠) and amber background
- Tooltip: "Coverage not included in this quote"

**And** conflicts are identified:
- Same coverage with significantly different terms
- Example: one quote excludes flood, another includes
- Highlighted with conflict icon
- Tooltip explains the conflict

**And** a summary section shows:
- "3 potential gaps identified"
- "1 coverage conflict"
- Clicking summary scrolls to relevant rows

**And** gap/conflict detection covers:
- Missing coverage types
- Significantly different limits (>50% variance)
- Exclusion differences
- Deductible variances (>100% difference)

**Prerequisites:** Story 6.3

**Technical Notes:**
- Gap detection logic in extraction API response or client-side
- Define thresholds for "significant" differences
- Conflict types: missing, exclusion, limit_variance, deductible_variance
- Store gap/conflict data with comparison results

---

## Story 7.5: Source Citations in Comparison

As a **user**,
I want **to verify any extracted value by viewing its source**,
So that **I can trust the comparison data**.

**Acceptance Criteria:**

**Given** I view the comparison table
**When** I hover over or click a cell value
**Then** I see a "View source" option:
- Small link/icon in cell corner
- Or cell click shows popover with value + source link

**And** clicking "View source":
- Opens document viewer in modal or side panel
- Scrolls to relevant page
- Highlights the source passage (same as Q&A citations)

**And** source display shows:
- Document name
- Page number
- Excerpt of source text

**And** cells without source (AI inferred):
- No source link
- Tooltip: "Value inferred from document context"

**Prerequisites:** Story 6.3, Story 5.5

**Technical Notes:**
- Reuse document viewer component
- Modal or slide-out panel for source view
- Source citation stored during extraction
- Same highlight logic as chat source citations

---

## Story 7.6: Export Comparison Results

As a **user**,
I want **to export comparison results**,
So that **I can share them with clients or save for records**.

**Acceptance Criteria:**

**Given** I have a completed comparison
**When** I click "Export"
**Then** I see export options:
- PDF export (formatted comparison table)
- CSV export (raw data for spreadsheets)

**And** PDF export includes:
- docuMINE header/branding
- Comparison date
- Document names (carrier quotes compared)
- Full comparison table with highlighting
- Gaps/conflicts summary
- Footer: "Generated by docuMINE"

**And** CSV export includes:
- Header row: Field, Quote1, Quote2, Quote3, Quote4
- Data rows for all fields
- No styling (plain data)

**And** export completes:
- Progress indicator while generating
- Downloads automatically
- Success toast: "Comparison exported"

**And** filename format:
- PDF: `docuMINE-comparison-{date}.pdf`
- CSV: `docuMINE-comparison-{date}.csv`

**Prerequisites:** Story 6.3

**Technical Notes:**
- PDF generation: react-pdf or server-side with puppeteer
- CSV: simple text generation, blob download
- Consider client-side generation for speed
- PDF should render cleanly for printing

---
