# Test Strategy Summary

## Unit Tests

| Component | Test Focus | Location |
|-----------|------------|----------|
| DiffEngine | Best/worst calculation, gap detection, conflict identification | `__tests__/lib/compare/diff.test.ts` |
| ExtractionService | Schema validation, source reference extraction | `__tests__/lib/compare/extraction.test.ts` |
| CompareService | Orchestration, caching logic, error handling | `__tests__/lib/compare/service.test.ts` |
| Type guards | QuoteExtraction, ComparisonResult validation | `__tests__/types/compare.test.ts` |

## Integration Tests

| Flow | Test Scenario |
|------|---------------|
| Compare API | POST /api/compare with valid documents returns comparison |
| Compare API | POST with invalid documentIds returns 400 |
| Compare API | POST with documents from other agency returns 403 |
| Extraction | Cached extraction returned on second request |
| Export | GET /api/compare/:id/export?format=pdf returns valid PDF |

## E2E Tests (Playwright)

| Test | Steps |
|------|-------|
| `compare-flow.spec.ts` | Navigate to /compare → Select 2 docs → Click Compare → Verify table renders |
| `compare-selection.spec.ts` | Try to select 5 docs → Verify blocked at 4 |
| `compare-source-citation.spec.ts` | Click cell source → Verify document viewer opens at page |
| `compare-export.spec.ts` | Click Export PDF → Verify download triggers |
| `compare-gaps.spec.ts` | Compare docs with gap → Verify warning banner appears |
| `compare-history.spec.ts` | View history → Click row → Verify comparison loads |
| `compare-history-search.spec.ts` | Enter search term → Verify table filters |
| `compare-history-delete.spec.ts` | Click delete → Confirm → Verify row removed |
| `compare-history-bulk-delete.spec.ts` | Select multiple → Bulk delete → Confirm → Verify all removed |

## Test Data

**Quote Samples for Testing:**

| Sample | Purpose | Characteristics |
|--------|---------|-----------------|
| `hartford-gl-sample.pdf` | Standard GL quote | All fields present, clean format |
| `travelers-package.pdf` | Package policy | Multiple coverage types |
| `liberty-minimal.pdf` | Minimal quote | Missing several fields |
| `acme-nonstandard.pdf` | Edge case | Unusual format, tests extraction resilience |

**Test Extraction Assertions:**

```typescript
// Example test case for extraction
const hartfordExtraction = await extractQuoteData(hartfordDoc);
expect(hartfordExtraction.carrierName).toBe('Hartford');
expect(hartfordExtraction.coverages).toHaveLength(3);
expect(hartfordExtraction.coverages[0].type).toBe('general_liability');
expect(hartfordExtraction.coverages[0].limit).toBe(1000000);
expect(hartfordExtraction.coverages[0].sourceRef.pageNumber).toBe(2);
```

## Manual Testing Checklist

- [ ] Compare 2 quotes from different carriers
- [ ] Compare 4 quotes (maximum)
- [ ] Verify best/worst highlighting is correct
- [ ] Click source citation → document opens at correct page
- [ ] Verify gap warning for quote missing coverage
- [ ] Export PDF and verify formatting
- [ ] Export CSV and verify data integrity
- [ ] Mobile: Verify table scrolls horizontally
- [ ] Test with 50-page quote document (performance)

---
