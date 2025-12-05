# Objectives and Scope

## In Scope

- **Quote Selection Interface** (Story 7.1) - UI for selecting 2-4 documents for comparison, with upload capability for new quotes
- **Structured Data Extraction** (Story 7.2) - GPT-4o function calling to extract coverage types, limits, deductibles, exclusions, premiums, carrier names, effective dates
- **Comparison Table View** (Story 7.3) - Side-by-side table with difference highlighting, best/worst value indicators
- **Gap & Conflict Detection** (Story 7.4) - Automatic identification of missing coverage, exclusion differences, significant limit/deductible variances
- **Source Citations** (Story 7.5) - Click-to-verify for any extracted value, reusing document viewer highlight pattern
- **Export Functionality** (Story 7.6) - PDF and CSV export of comparison results
- **Comparison History** (Story 7.7) - History table of past comparisons with search, date range filtering, pagination, and bulk delete

## Out of Scope

- **Multi-policy comparison** - Only quote documents, not full policies (post-MVP)
- **Historical comparison** - No tracking of quote changes over time
- **Recommendation engine** - No AI-suggested "best quote" (agents make decisions)
- **Carrier-specific parsers** - Generic extraction, no carrier-specific optimization
- **Comparison templates** - No saved comparison configurations
- **Sharing/collaboration** - No multi-user comparison sessions
