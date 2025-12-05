# Story 10.2: Policy Form & Structure Metadata

**Epic:** Epic 10 - Enhanced Quote Extraction & Analysis
**Points:** 2
**Priority:** P0 - Core extraction enhancement
**Status:** DONE

## Story

As an insurance agent, I need to see policy form details (ISO vs proprietary, occurrence vs claims-made) extracted from quotes so I can compare the underlying policy structure across carriers.

## Acceptance Criteria

### AC-10.2.1: Form Type Classification
- [x] Extract whether policy is ISO, proprietary, or manuscript form
- [x] TypeScript type: `FormType = 'iso' | 'proprietary' | 'manuscript'`
- [x] Zod schema validates form type enum

### AC-10.2.2: Policy Type (Occurrence vs Claims-Made)
- [x] Identify occurrence vs claims-made policies
- [x] TypeScript type: `PolicyType = 'occurrence' | 'claims-made'`
- [x] Critical for liability coverage comparison

### AC-10.2.3: ISO Form Numbers
- [x] Extract form numbers (CG 0001, CP 0010, CA 0001, etc.)
- [x] Array of strings to handle multiple forms
- [x] Preserve exact formatting from document

### AC-10.2.4: Audit Provisions
- [x] Extract audit type: annual, monthly, final, none
- [x] TypeScript type: `AuditType = 'annual' | 'monthly' | 'final' | 'none'`

### AC-10.2.5: Claims-Made Specific Fields
- [x] Extract retroactive date for claims-made policies
- [x] Extract extended reporting period options (tail coverage)
- [x] Fields null for occurrence policies

### AC-10.2.6: Source Pages
- [x] Track page numbers where metadata was found
- [x] `sourcePages: number[]` array

### AC-10.2.7: Default Handling
- [x] All fields default to null if not found
- [x] No errors for missing metadata
- [x] Graceful fallback in UI

## Implementation Summary

### Files Changed

| File | Action | Description |
|------|--------|-------------|
| `src/types/compare.ts` | MODIFY | Added FormType, PolicyType, AuditType, AdmittedStatus types; PolicyMetadata interface; policyMetadataSchema Zod |
| `src/lib/compare/extraction.ts` | MODIFY | Added extraction prompt instructions for policy metadata |
| `__tests__/types/compare.test.ts` | MODIFY | Added 6 tests for PolicyMetadata schema validation |

### Types Added

```typescript
export type FormType = 'iso' | 'proprietary' | 'manuscript';
export type PolicyType = 'occurrence' | 'claims-made';
export type AuditType = 'annual' | 'monthly' | 'final' | 'none';

export interface PolicyMetadata {
  formType: FormType | null;
  formNumbers: string[];
  policyType: PolicyType | null;
  retroactiveDate: string | null;
  extendedReportingPeriod: string | null;
  auditType: AuditType | null;
  sourcePages: number[];
}
```

### Extraction Prompt Additions

Added to EXTRACTION_SYSTEM_PROMPT:
- Form Type detection indicators
- ISO form number extraction
- Occurrence vs claims-made identification
- Retroactive date for claims-made
- Audit provision type detection

## Test Coverage

- 6 unit tests for PolicyMetadata schema
- Tests for all form types (iso, proprietary, manuscript)
- Tests for all policy types (occurrence, claims-made)
- Tests for all audit types (annual, monthly, final, none)
- Tests for claims-made with retroactive date
- Tests for default null handling

## Notes

- PolicyMetadata is nullable at QuoteExtraction level
- Version bumped to EXTRACTION_VERSION = 3 to invalidate cache
- Prompt token budget remains within limits (~4,200 tokens total)

---

_Implemented: 2025-12-04_
_Author: Claude (epic-yolo mode)_
