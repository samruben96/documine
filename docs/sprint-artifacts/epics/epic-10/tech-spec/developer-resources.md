# Developer Resources

## File Paths Reference

**Types:**
- `src/types/compare.ts` - All extraction types
- `src/types/database.types.ts` - Generated Supabase types

**Services:**
- `src/lib/compare/extraction.ts` - Extraction service
- `src/lib/compare/diff.ts` - Diff engine
- `src/lib/compare/gap-analysis.ts` - NEW: Gap detection

**Components:**
- `src/components/compare/comparison-table.tsx` - Main comparison UI
- `src/components/compare/endorsement-matrix.tsx` - NEW: Endorsement comparison
- `src/components/compare/gap-conflict-banner.tsx` - Gap display
- `src/components/one-pager/one-pager-pdf-document.tsx` - PDF generation

**Tests:**
- `__tests__/lib/compare/extraction.test.ts`
- `__tests__/lib/compare/gap-analysis.test.ts` - NEW
- `__tests__/components/compare/endorsement-matrix.test.tsx` - NEW
- `__tests__/e2e/enhanced-extraction.spec.ts` - NEW

## Key Code Locations

| Purpose | File:Line |
|---------|-----------|
| CoverageType enum | `src/types/compare.ts:20` |
| QuoteExtraction interface | `src/types/compare.ts:164` |
| Zod extraction schema | `src/types/compare.ts:278` |
| EXTRACTION_VERSION | `src/types/compare.ts:194` |
| System prompt | `src/lib/compare/extraction.ts:38` |
| GPT extraction call | `src/lib/compare/extraction.ts:331` |
| Diff engine | `src/lib/compare/diff.ts:1` |
| Gap detection | `src/lib/compare/gap-analysis.ts` - NEW |

## Testing Locations

- Unit: `__tests__/lib/compare/`
- Component: `__tests__/components/compare/`
- E2E: `__tests__/e2e/`

## Documentation to Update

- `CLAUDE.md` - Add Epic 10 patterns and conventions
- `docs/architecture.md` - Document enhanced extraction schema
- `docs/epics/epic-10-enhanced-quote-extraction.md` - Update with implementation notes

---
