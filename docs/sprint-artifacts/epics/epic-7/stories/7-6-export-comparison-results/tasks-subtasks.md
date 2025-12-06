# Tasks / Subtasks

- [x] Task 1: Add Export Dropdown Component (AC: 7.6.1)
  - [x] Create `src/components/compare/export-button.tsx`
  - [x] Use shadcn/ui DropdownMenu component
  - [x] Style with Download icon and chevron
  - [x] Accept `onExportPdf` and `onExportCsv` callbacks
  - [x] Add to compare/[id]/page.tsx header area

- [x] Task 2: Implement CSV Export Service (AC: 7.6.4, 7.6.5)
  - [x] Create `src/lib/compare/export.ts`
  - [x] Implement `generateCsvContent(result: ComparisonTableData): string`
  - [x] Handle proper CSV escaping (quotes, commas, newlines)
  - [x] Generate Blob and trigger download
  - [x] Use file-saver library

- [x] Task 3: Implement PDF Export Service (AC: 7.6.2, 7.6.3)
  - [x] Install @react-pdf/renderer and file-saver
  - [x] Create `src/lib/compare/pdf-export.tsx` with React PDF components
  - [x] Design PDF layout: header, date, table, gaps summary
  - [x] Implement best/worst indicator styling in PDF (green/red colors, ● and ○ indicators)
  - [x] Handle page breaks for long tables (ROWS_PER_PAGE = 25)
  - [x] Generate and download PDF file with landscape A4 orientation

- [x] Task 4: Wire Up Export Handlers (AC: 7.6.5, 7.6.6)
  - [x] Add export functions to compare/[id]/page.tsx
  - [x] Implement loading state management with useState
  - [x] Generate timestamp for filenames (formatDateForFilename)
  - [x] Handle errors with toast notification (sonner)

- [x] Task 5: Add Loading State UI (AC: 7.6.6)
  - [x] Show spinner in export button during generation (Loader2)
  - [x] Disable button during export
  - [x] Show "Generating PDF..." text during PDF export

- [x] Task 6: Unit Tests
  - [x] Test CSV generation with various data types
  - [x] Test CSV escaping edge cases (commas, quotes, newlines)
  - [x] Test filename format generation (YYYY-MM-DD)
  - [x] Test export button rendering and dropdown
  - [x] Create `__tests__/lib/compare/export.test.ts` (19 tests)
  - [x] Create `__tests__/components/compare/export-button.test.tsx` (10 tests)

- [x] Task 7: E2E Tests
  - [x] Create `__tests__/e2e/comparison-export.spec.ts`
  - [x] Test clicking Export button opens dropdown
  - [x] Test CSV export triggers download
  - [x] Test PDF export shows loading state
  - [x] Test dropdown has both PDF and CSV options

---
