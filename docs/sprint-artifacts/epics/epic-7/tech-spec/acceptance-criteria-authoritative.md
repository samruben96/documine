# Acceptance Criteria (Authoritative)

## Story 7.1: Quote Selection Interface

| ID | Criterion |
|----|-----------|
| AC-7.1.1 | Compare page (`/compare`) shows document cards with selection checkboxes |
| AC-7.1.2 | Only documents with status='ready' are selectable |
| AC-7.1.3 | Selection count displayed: "X of 4 selected" |
| AC-7.1.4 | Compare button disabled until 2+ documents selected |
| AC-7.1.5 | Compare button disabled and tooltip shown when 5th document attempted |
| AC-7.1.6 | "Upload new quotes" opens upload zone; new docs appear in selection |
| AC-7.1.7 | Clicking Compare navigates to comparison view with loading state |

## Story 7.2: Quote Data Extraction

| ID | Criterion |
|----|-----------|
| AC-7.2.1 | Extraction uses GPT-5.1 function calling with defined schema (CFG constraints) |
| AC-7.2.2 | carrierName, coverages array extracted from each document |
| AC-7.2.3 | Each coverage item includes type, limit, deductible, sourceRef |
| AC-7.2.4 | Exclusions extracted with category classification |
| AC-7.2.5 | Extraction results cached in quote_extractions table |
| AC-7.2.6 | Subsequent comparisons use cache (no re-extraction) |
| AC-7.2.7 | Extraction completes within 60 seconds per document |
| AC-7.2.8 | Failed extraction returns partial result with error indicator |

## Story 7.3: Comparison Table View

| ID | Criterion |
|----|-----------|
| AC-7.3.1 | Table displays columns: Field, Quote 1, Quote 2, [Quote 3], [Quote 4] |
| AC-7.3.2 | Column headers show carrier names |
| AC-7.3.3 | Rows cover: all coverage types, deductibles, premium, effective dates |
| AC-7.3.4 | Best value in row marked with green indicator (●) |
| AC-7.3.5 | Worst value in row marked with red indicator (○) |
| AC-7.3.6 | Rows with differences have subtle highlight |
| AC-7.3.7 | "Not found" cells display "—" in muted text |
| AC-7.3.8 | Table has sticky header and first column |

## Story 7.4: Gap & Conflict Identification

| ID | Criterion |
|----|-----------|
| AC-7.4.1 | Gaps identified when coverage present in some quotes but missing in others |
| AC-7.4.2 | Gap rows show warning icon (⚠) and amber background |
| AC-7.4.3 | Conflicts identified for exclusion differences (e.g., flood excluded vs included) |
| AC-7.4.4 | Summary banner: "X potential gaps, Y conflicts identified" |
| AC-7.4.5 | Clicking summary item scrolls to relevant row |
| AC-7.4.6 | Severity levels (high/medium/low) based on coverage type |

## Story 7.5: Source Citations in Comparison

| ID | Criterion |
|----|-----------|
| AC-7.5.1 | Each cell with extracted value has "View source" link/icon |
| AC-7.5.2 | Clicking source opens document viewer modal |
| AC-7.5.3 | Document viewer scrolls to relevant page |
| AC-7.5.4 | Source passage highlighted with yellow background |
| AC-7.5.5 | Inferred values (no direct source) show "Inferred" tooltip |

## Story 7.6: Export Comparison Results

| ID | Criterion |
|----|-----------|
| AC-7.6.1 | Export dropdown offers PDF and CSV options |
| AC-7.6.2 | PDF includes: header, date, carrier names, full table, gaps summary |
| AC-7.6.3 | PDF highlights preserved (best/worst indicators) |
| AC-7.6.4 | CSV contains all data in tabular format |
| AC-7.6.5 | File downloads automatically with timestamp filename |
| AC-7.6.6 | Export button shows loading state during generation |

## Story 7.7: Comparison History

| ID | Criterion |
|----|-----------|
| AC-7.7.1 | History table displays: checkbox, date, document filenames, status badge; sorted most-recent-first |
| AC-7.7.2 | Clicking row navigates to `/compare/[id]}` loading stored comparison (no re-extraction) |
| AC-7.7.3 | Delete icon triggers confirmation dialog; row fades out with optimistic UI |
| AC-7.7.4 | Search filters by document filenames; date range filter with From/To inputs and presets |
| AC-7.7.5 | Empty state shows "No comparisons yet" with CTA to create first comparison |
| AC-7.7.6 | Pagination (20 per page) with controls at bottom |
| AC-7.7.7 | Bulk delete: checkbox column, "Delete Selected (N)" action, confirmation dialog |
| AC-7.7.8 | Header checkbox selects/deselects all visible rows |
