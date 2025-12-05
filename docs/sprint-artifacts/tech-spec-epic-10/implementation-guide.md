# Implementation Guide

## Setup Steps

1. Create feature branch: `git checkout -b epic-10-enhanced-extraction`
2. Verify dev environment: `npm run dev`
3. Review existing extraction tests: `npm test -- extraction`
4. Prepare test documents: 5 commercial insurance quotes with varied formats

## Implementation Steps (Story Order)

**Phase 1: Foundation (Stories 10.1 + 10.10)**

1. **Story 10.1: Extended Coverage Types**
   - Add 12 new coverage types to `CoverageType`
   - Update `COVERAGE_TYPES` array
   - Update extraction prompt mappings
   - Add tests for new type recognition

2. **Story 10.10: Extraction Prompt Engineering**
   - Extend `EXTRACTION_SYSTEM_PROMPT` with new sections
   - Add few-shot examples
   - Benchmark accuracy on test corpus
   - Iterate until 95%+ accuracy maintained

**Phase 2: Data Fields (Stories 10.2-10.6, parallel)**

3. **Story 10.2: Policy Metadata**
   - Add `PolicyMetadata` interface
   - Add Zod schema
   - Update extraction prompt
   - Add tests

4. **Story 10.3: Enhanced Limits**
   - Extend `CoverageItem` with new fields
   - Add SIR vs deductible distinction
   - Update Zod schema
   - Add tests

5. **Story 10.4: Endorsements (Priority)**
   - Add `Endorsement` interface
   - Add endorsements array to extraction
   - Critical endorsement detection
   - Add tests

6. **Story 10.5: Carrier Information**
   - Add `CarrierInfo` interface
   - AM Best rating extraction
   - Admitted status detection
   - Add tests

7. **Story 10.6: Premium Breakdown**
   - Add `PremiumBreakdown` interface
   - Per-coverage premium extraction
   - Taxes/fees separation
   - Add tests

**Phase 3: Analysis (Story 10.7)**

8. **Story 10.7: Gap Analysis**
   - Create `gap-analysis.ts` service
   - Implement detection rules
   - Calculate risk scores
   - Add tests

**Phase 4: UI/UX (Stories 10.8-10.9)**

9. **Story 10.8: Enhanced Comparison Table**
   - Add collapsible sections
   - Create `EndorsementMatrix` component
   - Create `PremiumBreakdownTable` component
   - Add tests

10. **Story 10.9: Enhanced One-Pager**
    - Update `OnePagerPdfDocument`
    - Add policy metadata section
    - Add endorsements summary
    - Add premium breakdown
    - Add tests

**Phase 5: Testing (Story 10.11)**

11. **Story 10.11: Testing & Migration**
    - Backward compatibility testing
    - Schema migration testing
    - Performance testing
    - Accuracy benchmarking report

**Phase 6: Pipeline Integration (Story 10.12)**

12. **Story 10.12: Extraction at Upload Time** (NEW - 2025-12-04)
    - Trigger GPT-5.1 extraction when document processing completes
    - Store `extraction_data` JSONB in documents table
    - Skip extraction for `document_type='general'` documents
    - Enable chat Q&A to use structured data for direct field queries
    - Show carrier/premium in document library
    - Comparisons use pre-extracted data (cache hit optimization)
    - Source citations preserved for structured data answers
    - 60-second timeout, graceful degradation on failure

## Testing Strategy

**Unit Tests (per story):**
- Schema validation for all new interfaces
- Zod schema parsing edge cases
- Gap analysis detection rules
- UI component rendering

**Integration Tests:**
- Full extraction flow with mock GPT response
- Cache invalidation on version bump
- Backward compatibility: v1 extractions still load

**E2E Tests:**
- Upload quote → extract → view enhanced comparison
- Endorsement matrix displays correctly
- Gap analysis banners appear
- One-pager includes new sections

**Accuracy Benchmarking (Story 10.11):**
- 5 real commercial quotes (varied carriers)
- Pre/post accuracy comparison
- Target: 95%+ on existing fields, 90%+ on new fields
- Document extraction accuracy in test report

## Acceptance Criteria Summary

| Story | Key ACs |
|-------|---------|
| 10.1 | 12 new coverage types extracted correctly |
| 10.2 | Policy type (occurrence/claims-made) identified 95%+ |
| 10.3 | SIR distinguished from deductible, aggregates extracted |
| 10.4 | Critical endorsements (CG 20 10, etc.) detected 95%+ |
| 10.5 | AM Best rating extracted when present |
| 10.6 | Per-coverage premium breakdown when itemized |
| 10.7 | Missing coverages, endorsement gaps flagged |
| 10.8 | Collapsible sections, endorsement matrix works |
| 10.9 | One-pager includes new sections, fits 2 pages max |
| 10.10 | Existing extraction accuracy maintained 95%+ |
| 10.11 | All tests pass, v1 extractions backward compatible |
| 10.12 | Extraction at upload, chat uses structured data, source citations work |

---
