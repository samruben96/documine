# The Change

## Problem Statement

Independent insurance agents need comprehensive policy data to perform thorough quote analysis for clients. The current extraction captures basic coverage limits and deductibles, but agents also need:

1. **Policy form details** - Is this occurrence or claims-made? What ISO forms?
2. **Endorsement information** - Does it have CG 20 10? Waiver of subrogation?
3. **Carrier financial data** - AM Best rating, admitted status
4. **Premium breakdown** - Per-coverage allocation, taxes, fees
5. **Gap analysis** - What's missing compared to industry standards or other quotes?

Without this data, agents still manually hunt through PDFs to answer client questions about policy quality and contract requirements.

## Proposed Solution

Extend the existing extraction schema and GPT-5.1 extraction service to capture:

1. **12 additional coverage types** (D&O, EPLI, Pollution, Builders Risk, etc.)
2. **Policy metadata** (ISO form numbers, occurrence vs claims-made, audit provisions)
3. **Enhanced limits** (SIR vs deductible, aggregate limits, coinsurance)
4. **Endorsements array** (form numbers, broadening/restricting classification)
5. **Carrier information** (AM Best rating, admitted status)
6. **Premium breakdown** (per-coverage, taxes, fees)
7. **Automated gap analysis** (AI-powered identification of missing coverages/endorsements)

The extraction remains a single GPT-5.1 call using `zodResponseFormat` with an extended schema. UI components are updated to display new data with collapsible sections for progressive disclosure.

## Scope

**In Scope:**
- Extended TypeScript types and Zod schemas
- Updated extraction prompt with new field mappings
- Enhanced comparison table with endorsement matrix
- Enhanced one-pager PDF template
- Gap analysis detection logic
- Schema migration (EXTRACTION_VERSION bump)
- Backward compatibility for existing extractions

**Out of Scope:**
- AM Best API integration (manual rating from document only)
- Industry-specific templates (future epic)
- AI-powered coverage recommendations (future epic)
- Multi-page one-pager (keep to 1-2 pages max)

---
