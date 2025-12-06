# Story 10.1: Extended Coverage Types Schema

**Status:** done
**Points:** 3
**Epic:** 10 - Enhanced Quote Extraction & Analysis
**Priority:** P0 - Foundation (do with 10.10)

---

## Story

As an **insurance agent**,
I want **the extraction system to recognize 12 additional coverage types commonly found in commercial policies**,
so that **I can compare quotes across all coverage categories without manually identifying coverage types**.

---

## Acceptance Criteria

| AC ID | Acceptance Criteria | Priority |
|-------|---------------------|----------|
| AC-10.1.1 | `CoverageType` TypeScript enum includes 12 new coverage types: epli, d_and_o, crime, pollution, inland_marine, builders_risk, business_interruption, product_liability, garage_liability, liquor_liability, medical_malpractice, fiduciary | Must |
| AC-10.1.2 | Zod schema `coverageItemSchema` updated to accept new coverage types | Must |
| AC-10.1.3 | Extraction prompt mappings added for all new coverage types with common variations (e.g., "D&O" → d_and_o, "Directors and Officers" → d_and_o) | Must |
| AC-10.1.4 | Existing extractions with original 9 coverage types continue to work (backward compatible) | Must |
| AC-10.1.5 | `COVERAGE_TYPES` array includes all 21 types for iteration/validation | Must |
| AC-10.1.6 | Coverage type icons/display names added for UI rendering | Should |
| AC-10.1.7 | Unit tests verify all 21 coverage types are recognized | Must |

---

## Tasks / Subtasks

### Task 1: Extend CoverageType TypeScript Type (AC-10.1.1)

- [ ] 1.1 Open `src/types/compare.ts`
- [ ] 1.2 Add 12 new coverage types to `CoverageType` union:
  ```typescript
  | 'epli'                    // Employment Practices Liability
  | 'd_and_o'                 // Directors & Officers
  | 'crime'                   // Crime / Fidelity
  | 'pollution'               // Pollution Liability
  | 'inland_marine'           // Inland Marine / Equipment
  | 'builders_risk'           // Builders Risk
  | 'business_interruption'   // Business Interruption / Loss of Income
  | 'product_liability'       // Product Liability
  | 'garage_liability'        // Garage Liability
  | 'liquor_liability'        // Liquor Liability
  | 'medical_malpractice'     // Medical Malpractice
  | 'fiduciary'               // Fiduciary Liability
  ```
- [ ] 1.3 Update `COVERAGE_TYPES` array to include all 21 types

### Task 2: Update Zod Schema (AC-10.1.2)

- [ ] 2.1 Update `coverageItemSchema` z.enum to include new types
- [ ] 2.2 Update `EXTRACT_QUOTE_DATA_FUNCTION.parameters.properties.coverages.items.properties.type.enum`
- [ ] 2.3 Run `npm run build` to verify no type errors

### Task 3: Add Coverage Type Display Names & Icons (AC-10.1.6)

- [ ] 3.1 Create `COVERAGE_TYPE_DISPLAY` map in `src/types/compare.ts`:
  ```typescript
  export const COVERAGE_TYPE_DISPLAY: Record<CoverageType, { label: string; icon: string }> = {
    general_liability: { label: 'General Liability', icon: 'Shield' },
    property: { label: 'Property', icon: 'Building' },
    // ... existing ...
    epli: { label: 'Employment Practices', icon: 'Users' },
    d_and_o: { label: 'Directors & Officers', icon: 'Briefcase' },
    // ... new types ...
  };
  ```
- [ ] 3.2 Export for use in UI components

### Task 4: Update Extraction Prompt (AC-10.1.3)

- [ ] 4.1 Open `src/lib/compare/extraction.ts`
- [ ] 4.2 Add new coverage type mappings to `EXTRACTION_SYSTEM_PROMPT`:
  ```
  COVERAGE TYPE MAPPINGS (EXTENDED):
  - "EPLI", "Employment Practices Liability", "EPL" → epli
  - "D&O", "Directors and Officers", "Directors & Officers Liability" → d_and_o
  - "Crime", "Fidelity", "Employee Dishonesty" → crime
  - "Pollution", "Environmental Liability", "Pollution Legal Liability" → pollution
  - "Inland Marine", "Equipment Floater", "Contractors Equipment" → inland_marine
  - "Builders Risk", "Course of Construction" → builders_risk
  - "Business Interruption", "BI", "Loss of Income", "Business Income" → business_interruption
  - "Product Liability", "Products-Completed Operations" → product_liability
  - "Garage Liability", "Garagekeepers" → garage_liability
  - "Liquor Liability", "Dram Shop" → liquor_liability
  - "Medical Malpractice", "Medical Professional Liability" → medical_malpractice
  - "Fiduciary Liability", "Fiduciary" → fiduciary
  ```

### Task 5: Bump Extraction Version (AC-10.1.4)

- [ ] 5.1 Update `EXTRACTION_VERSION` from 1 to 2 in `src/types/compare.ts`
- [ ] 5.2 Verify cache invalidation logic in `extraction.ts` handles version mismatch

### Task 6: Add Unit Tests (AC-10.1.7)

- [ ] 6.1 Create/update `__tests__/types/compare.test.ts`
- [ ] 6.2 Test all 21 coverage types are in `COVERAGE_TYPES` array
- [ ] 6.3 Test Zod schema accepts all 21 coverage types
- [ ] 6.4 Test display names exist for all coverage types
- [ ] 6.5 Run `npm test` - all tests pass

### Task 7: Verify Build & Backward Compatibility (AC-10.1.4, AC-10.1.5)

- [ ] 7.1 Run `npm run build` - no errors
- [ ] 7.2 Verify existing extraction tests still pass
- [ ] 7.3 Document any migration notes

---

## Dev Notes

### Architecture Patterns

**Schema Evolution Strategy (from tech-spec):**
- Extend existing types, don't replace
- All new coverage types are additions to the existing 9
- `EXTRACTION_VERSION` bump invalidates cached extractions
- Old extractions continue to render; new types are simply additional options

**Type Safety:**
- Zod schema must match TypeScript types exactly
- Function calling schema must match Zod schema
- Use `as const` for enum arrays where appropriate

### Source Tree Components

| File | Action | Purpose |
|------|--------|---------|
| `src/types/compare.ts:20-42` | MODIFY | Add 12 new coverage types to CoverageType |
| `src/types/compare.ts:31-41` | MODIFY | Add new types to COVERAGE_TYPES array |
| `src/types/compare.ts:232-254` | MODIFY | Update coverageItemSchema z.enum |
| `src/types/compare.ts:329-340` | MODIFY | Update function calling schema enum |
| `src/lib/compare/extraction.ts:38-73` | MODIFY | Add prompt mappings for new types |
| `src/types/compare.ts:194` | MODIFY | Bump EXTRACTION_VERSION to 2 |
| `__tests__/types/compare.test.ts` | CREATE/MODIFY | Add coverage type tests |

### Testing Standards

Per project testing conventions:
- Unit tests in `__tests__/` mirroring source structure
- Use Vitest with happy-dom environment
- Coverage target: >80%
- Test file naming: `*.test.ts`

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-10.md#Extended Coverage Types]
- [Source: docs/epics/epic-10-enhanced-quote-extraction.md#Story 10.1]
- [Source: src/types/compare.ts - Existing CoverageType definition]

---

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/10-1-extended-coverage-types.context.xml

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

1. **AC-10.1.1 (CoverageType enum)**: Added 12 new types to union at `src/types/compare.ts:31-43`
2. **AC-10.1.2 (Zod schema)**: Updated `coverageItemSchema` z.enum at lines 294-318
3. **AC-10.1.3 (Prompt mappings)**: Added EXTENDED COVERAGE TYPE MAPPINGS in `src/lib/compare/extraction.ts:60-72`
4. **AC-10.1.4 (Backward compat)**: Original 9 types preserved, version bumped to 2
5. **AC-10.1.5 (COVERAGE_TYPES array)**: Extended to 21 types at lines 49-72
6. **AC-10.1.6 (Display names)**: Created COVERAGE_TYPE_DISPLAY map at lines 78-101
7. **AC-10.1.7 (Unit tests)**: Created 17 tests in `__tests__/types/compare.test.ts`
8. **Additional fix**: Updated COVERAGE_SEVERITY and COVERAGE_TYPE_LABELS in diff.ts

### File List

| File | Action | Lines Changed |
|------|--------|---------------|
| `src/types/compare.ts` | MODIFIED | +60 lines (types, array, display map, version) |
| `src/lib/compare/extraction.ts` | MODIFIED | +12 lines (prompt mappings) |
| `src/lib/compare/diff.ts` | MODIFIED | +24 lines (severity map, labels) |
| `__tests__/types/compare.test.ts` | CREATED | 175 lines (17 tests) |
| `docs/sprint-artifacts/10-1-extended-coverage-types.context.xml` | CREATED | Story context |

---

## Change Log

| Date | Author | Changes |
|------|--------|---------|
| 2025-12-04 | Bob (SM) | Story drafted from Epic 10 tech-spec |
