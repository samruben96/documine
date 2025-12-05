# Previous Story Learnings

**From Story 7.5 (Source Citations in Comparison) - Ready for Review 2025-12-03:**

- **SourceViewerModal Created**: `src/components/compare/source-viewer-modal.tsx` with Dialog and DocumentViewer integration
- **CellValue Extended**: Added `sourcePages?: number[]` for source references
- **TableCell Component**: Shows ExternalLink for sources, Info icon for inferred values
- **ComparisonTable Props**: Now includes `onSourceClick` callback for modal handling
- **39 Unit Tests**: Established patterns for comparison component testing

**From Story 7.3-7.4 (Comparison Table + Gap Detection):**

- **DiffEngine**: `src/lib/compare/diff.ts` with full comparison logic
- **ComparisonTable**: `src/components/compare/comparison-table.tsx` renders the full table
- **GapConflictBanner**: `src/components/compare/gap-conflict-banner.tsx` displays warnings
- **ComparisonResult Type**: Contains all data needed for export

**Key Files to Reuse:**
- `src/lib/compare/diff.ts` - ComparisonResult, ComparisonRow types
- `src/types/compare.ts` - All comparison types
- `src/components/compare/comparison-table.tsx` - Table structure reference

**Patterns to Maintain:**
- Button styling with dropdown menu pattern (shadcn/ui DropdownMenu)
- Loading states with spinner icon
- File download using Blob URL pattern or file-saver library

[Source: docs/sprint-artifacts/story-7.5-source-citations-in-comparison.md#Dev-Agent-Record]
[Source: docs/sprint-artifacts/tech-spec-epic-7.md#Story-7.6]

---
