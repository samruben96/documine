# Story 7.5: Source Citations in Comparison

**Epic:** 7 - Quote Comparison
**Priority:** P0
**Effort:** M (4-6 hours)
**Added:** 2025-12-03
**Status:** Ready for Review

---

## User Story

As a **user comparing insurance quotes**,
I want **to verify any extracted value by viewing its source in the document**,
So that **I can trust the comparison data and catch any extraction errors**.

---

## Context

This is the fifth story in Epic 7: Quote Comparison. It adds source citation verification to the comparison table, maintaining the trust-transparent approach that is central to docuMINE's value proposition.

Building on the ComparisonTable from Stories 7.3-7.4, this story adds:

1. **View Source Links** - Each cell with extracted data shows a "View source" link/icon
2. **Document Viewer Modal** - Clicking opens the document viewer in a modal
3. **Page Navigation** - Document viewer scrolls to the relevant page
4. **Text Highlighting** - Source passage highlighted with yellow background
5. **Inferred Value Handling** - Values without direct sources show "Inferred" tooltip

This story reuses the document viewer component and highlighting logic from Epic 5 (Story 5.5), ensuring consistency across the chat and comparison experiences.

---

## Previous Story Learnings

**From Story 7.4 (Gap & Conflict Identification) - Completed 2025-12-03:**

- **GapConflictBanner Created**: `src/components/compare/gap-conflict-banner.tsx` with collapsible list and click-to-scroll
- **Row Annotation Pattern**: `annotateRowsWithIssues()` adds `isGap`, `gapSeverity`, `isConflict` to rows
- **Scroll-to-Row**: Uses `data-field` attribute and `scrollIntoView({ behavior: 'smooth', block: 'center' })`
- **59 Tests**: Established patterns in `__tests__/lib/compare/gap-conflict-detection.test.ts`

**From Story 5.5 (Document Viewer with Highlight Navigation) - Completed 2025-12-01:**

- **DocumentViewer Component**: `src/components/documents/document-viewer.tsx` with PDF.js integration
- **Highlight Logic**: `useDocumentHighlight` hook for passage highlighting
- **Page Navigation**: `scrollToPage()` function with smooth scroll
- **Highlight Styling**: Yellow background (#fef08a) with fade after 3 seconds

**Key Files to Reuse:**
- `src/components/documents/document-viewer.tsx` - PDF viewer component
- `src/hooks/use-document-highlight.ts` - Highlight management (if exists)
- `src/types/compare.ts` - SourceReference type already defined

**Patterns to Maintain:**
- Yellow highlight (#fef08a) for source passages - consistent with chat citations
- Modal pattern for document viewer - reuse Sheet or Dialog component
- Source reference format: `{ pageNumber, textExcerpt, chunkId }`

[Source: docs/sprint-artifacts/story-7.4-gap-conflict-identification.md#Dev-Agent-Record]
[Source: docs/sprint-artifacts/story-5.5-document-viewer-with-highlight-navigation.md]

---

## Acceptance Criteria

### AC-7.5.1: View Source Link
**Given** a cell with an extracted value in the comparison table
**When** I view the cell
**Then** a small "View source" link or icon is visible (corner of cell)
**And** the link is styled subtly (muted color, small size)
**And** hover state makes it more prominent

### AC-7.5.2: Document Viewer Modal
**Given** I click the "View source" link on a cell
**When** the modal opens
**Then** I see the document viewer component
**And** the modal header shows the document/carrier name
**And** the modal has a close button (X or "Close")
**And** clicking outside the modal closes it

### AC-7.5.3: Page Navigation
**Given** the document viewer modal opens for a source citation
**When** the viewer loads
**Then** the PDF scrolls to the page number from the source reference
**And** the page number input shows the current page
**And** I can navigate to other pages if needed

### AC-7.5.4: Source Text Highlighting
**Given** the document viewer modal opens for a source citation
**When** the relevant page is visible
**Then** the source passage is highlighted with yellow background (#fef08a)
**And** the highlight has slight padding around the text
**And** the highlight fades after 3 seconds (or persists on click)

### AC-7.5.5: Inferred Values Handling
**Given** a cell with an extracted value that has status='inferred'
**When** I view the cell
**Then** there is no "View source" link
**And** hovering shows tooltip: "Value inferred from document context"
**And** the cell has a subtle visual indicator (dashed border or italic text)

---

## Tasks / Subtasks

- [x] Task 1: Add Source Link to Table Cells (AC: 7.5.1)
  - [x] Update `CellValue` in `comparison-table.tsx` with sourcePages prop
  - [x] Add ExternalLink icon from Lucide
  - [x] Style link as subtle, positioned after value
  - [x] Show link only when `sourcePages.length > 0`
  - [x] Add hover state styling

- [x] Task 2: Create SourceViewerModal Component (AC: 7.5.2)
  - [x] Create `src/components/compare/source-viewer-modal.tsx`
  - [x] Use shadcn/ui Dialog component
  - [x] Accept props: `documentId`, `pageNumber`, `carrierName`, `open`, `onOpenChange`
  - [x] Render carrier name in header
  - [x] Handle loading state for PDF

- [x] Task 3: Integrate DocumentViewer in Modal (AC: 7.5.3, 7.5.4)
  - [x] Import and render `DocumentViewer` component
  - [x] Call `scrollToPage()` after PDF loads
  - [x] Call `highlightSource()` for page-level pulse
  - [x] PDF controls work in modal context

- [x] Task 4: Implement Text Highlighting (AC: 7.5.4)
  - [x] Reuse DocumentViewer's highlightSource API
  - [x] Page-level pulse animation on open
  - [x] Note: Full text highlighting requires bounding box data (future enhancement)

- [x] Task 5: Handle Inferred Values (AC: 7.5.5)
  - [x] Check `sourcePages.length === 0` for inferred detection
  - [x] Hide source link for inferred values
  - [x] Add Tooltip with "Value inferred from document context"
  - [x] Add Info icon for visual indicator

- [x] Task 6: Wire Up Click Handler (AC: 7.5.1, 7.5.2)
  - [x] Add state for modal in ExtractionSummaryView
  - [x] Pass onSourceClick handler to ComparisonTable
  - [x] Open modal on source link click
  - [x] Close modal on backdrop click or close button

- [x] Task 7: Unit Tests
  - [x] Test source link renders when sourcePages present
  - [x] Test source link hidden when sourcePages empty
  - [x] Test click handler called with correct arguments
  - [x] Test SourceViewerModal component rendering
  - [x] Added to `__tests__/components/compare/comparison-table.test.tsx`
  - [x] Created `__tests__/components/compare/source-viewer-modal.test.tsx`

- [x] Task 8: E2E Tests
  - [x] Created `__tests__/e2e/source-citations.spec.ts`
  - [x] Test clicking source link opens modal
  - [x] Test modal shows correct document/carrier name
  - [x] Test modal closes on backdrop click and Escape key

---

## Dev Notes

### Source Reference Structure

The `SourceReference` type is already defined in `src/types/compare.ts`:

```typescript
interface SourceReference {
  pageNumber: number;
  textExcerpt: string;  // 100-200 chars
  chunkId: string;
}
```

### Cell Component Enhancement

```tsx
// In comparison-table.tsx - CellValue rendering

function CellValue({
  value,
  documentId,
  onViewSource,
}: {
  value: CellValue;
  documentId: string;
  onViewSource: (documentId: string, sourceRef: SourceReference) => void;
}) {
  const showSourceLink = value.sourceRef && value.status !== 'inferred';
  const isInferred = value.status === 'inferred';

  return (
    <div className="relative group">
      <span className={cn(isInferred && "italic text-muted-foreground")}>
        {value.displayValue}
      </span>

      {showSourceLink && (
        <button
          onClick={() => onViewSource(documentId, value.sourceRef!)}
          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="View source in document"
        >
          <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
        </button>
      )}

      {isInferred && (
        <Tooltip>
          <TooltipTrigger>
            <Info className="h-3 w-3 text-muted-foreground ml-1" />
          </TooltipTrigger>
          <TooltipContent>
            Value inferred from document context
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
```

### SourceViewerModal Component

```tsx
// src/components/compare/source-viewer-modal.tsx

interface SourceViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentName: string;
  pageNumber: number;
  textExcerpt?: string;
}

export function SourceViewerModal({
  isOpen,
  onClose,
  documentId,
  documentName,
  pageNumber,
  textExcerpt,
}: SourceViewerModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {documentName}
          </DialogTitle>
          <DialogDescription>
            Page {pageNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <DocumentViewer
            documentId={documentId}
            initialPage={pageNumber}
            highlightText={textExcerpt}
            embedded={true}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Highlight Implementation

The DocumentViewer may need enhancement to support text highlighting:

```typescript
// Option 1: If DocumentViewer already supports highlighting
<DocumentViewer
  documentId={documentId}
  initialPage={pageNumber}
  highlightText={textExcerpt}  // New prop
/>

// Option 2: If highlight needs to be implemented
// Use PDF.js text layer to find and highlight matching text
useEffect(() => {
  if (!textExcerpt) return;

  // Find text in PDF.js text layer
  const textLayer = document.querySelector('.react-pdf__Page__textContent');
  if (!textLayer) return;

  // Search for matching text and add highlight
  const walker = document.createTreeWalker(textLayer, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.textContent?.includes(textExcerpt.substring(0, 50))) {
      // Add highlight span
      const range = document.createRange();
      range.selectNode(node);
      const highlight = document.createElement('mark');
      highlight.className = 'source-highlight animate-fade-highlight';
      range.surroundContents(highlight);
      break;
    }
  }
}, [textExcerpt, pageNumber]);
```

### CSS for Highlight Animation

```css
/* In globals.css */
.source-highlight {
  background-color: #fef08a; /* yellow-200 */
  padding: 0.125rem 0.25rem;
  border-radius: 0.125rem;
}

@keyframes fade-highlight {
  0% { background-color: #fef08a; }
  70% { background-color: #fef08a; }
  100% { background-color: transparent; }
}

.animate-fade-highlight {
  animation: fade-highlight 3s ease-out forwards;
}
```

### Project Structure Notes

```
src/components/compare/
├── quote-selector.tsx          # Selection interface (Story 7.1) ✅
├── selection-counter.tsx       # Selection count (Story 7.1) ✅
├── extraction-card.tsx         # Extraction display (Story 7.2) ✅
├── comparison-table.tsx        # Side-by-side table (Story 7.3) ✅ - EXTEND
├── gap-conflict-banner.tsx     # Warning summary (Story 7.4) ✅
├── source-viewer-modal.tsx     # Document viewer modal (NEW)
└── index.ts                    # Exports
```

### State Management

```typescript
// In comparison page or ComparisonTable
const [sourceModal, setSourceModal] = useState<{
  documentId: string;
  documentName: string;
  pageNumber: number;
  textExcerpt?: string;
} | null>(null);

function handleViewSource(documentId: string, sourceRef: SourceReference) {
  const document = result.documents.find(d => d.id === documentId);
  setSourceModal({
    documentId,
    documentName: document?.name ?? 'Document',
    pageNumber: sourceRef.pageNumber,
    textExcerpt: sourceRef.textExcerpt,
  });
}
```

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-7.md#Story-7.5]
- [Source: docs/architecture.md#Trust-Transparent-AI-Responses]
- [Source: docs/epics.md#Story-7.5]
- [Source: docs/sprint-artifacts/story-5.5-document-viewer-with-highlight-navigation.md]

---

## Dev Agent Record

### Context Reference

docs/sprint-artifacts/7-5-source-citations-in-comparison.context.xml

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

N/A

### Completion Notes List

1. **CellValue Extended** - Added `sourcePages?: number[]` to CellValue interface in `diff.ts`
2. **buildCell Updated** - Now accepts and passes through sourcePages parameter
3. **Coverage Row Builders** - Pass sourcePages from CoverageItem to cell values
4. **TableCell Component** - Shows ExternalLink icon when sourcePages present, Info icon for inferred values
5. **SourceViewerModal Created** - New component with Dialog, DocumentViewer integration, PDF URL fetching
6. **Compare Page Updated** - Added modal state and onSourceClick handler to ExtractionSummaryView
7. **Page Navigation** - Uses scrollToPage() and highlightSource() after PDF loads
8. **Note on Full Text Highlighting** - AC-7.5.4 partially implemented; page-level pulse works, but full text highlighting requires bounding box data from extraction (not currently available)

### File List

**New Files:**
- `src/components/compare/source-viewer-modal.tsx` - Document viewer modal component
- `__tests__/components/compare/source-viewer-modal.test.tsx` - Unit tests
- `__tests__/e2e/source-citations.spec.ts` - E2E tests

**Modified Files:**
- `src/lib/compare/diff.ts` - Extended CellValue with sourcePages, updated buildCell and row builders
- `src/components/compare/comparison-table.tsx` - Added onSourceClick prop, source link rendering, inferred value tooltip
- `src/app/(dashboard)/compare/[id]/page.tsx` - Added modal state, SourceViewerModal rendering
- `__tests__/components/compare/comparison-table.test.tsx` - Added source citations and inferred values tests

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-12-03 | SM (Bob) | Created story from Epic 7 Tech Spec via create-story workflow |
| 2025-12-03 | Dev Agent (Amelia) | Implemented story: source links, modal, page navigation, inferred values, tests |
