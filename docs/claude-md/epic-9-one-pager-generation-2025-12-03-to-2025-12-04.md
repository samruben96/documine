# Epic 9: One-Pager Generation (2025-12-03 to 2025-12-04)

## One-Pager Entry Points (Story 9.5)

**Pattern:** Consistent navigation buttons across multiple pages using shared component.

```typescript
import { OnePagerButton } from '@/components/one-pager/one-pager-button';

// From comparison results - uses comparisonId
<OnePagerButton comparisonId={comparisonId} />

// From document viewer - uses documentId
<OnePagerButton documentId={documentId} size="sm" />

// Icon-only mode for compact layouts (e.g., table rows)
<OnePagerButton comparisonId={id} iconOnly />
```

**Entry Points:**
| Location | Component | Query Param |
|----------|-----------|-------------|
| `/compare/[id]` header | OnePagerButton | `?comparisonId=[id]` |
| `/compare` history row | Icon with tooltip | `?comparisonId=[id]` |
| `/documents/[id]` header | OnePagerButton | `?documentId=[id]` |

**Visibility Rules:**
- Comparison page: Only show for `status === 'complete' || status === 'partial'`
- Document viewer: Only show for `status === 'ready'`
- History rows: Only for complete/partial comparisons

## Live Preview Pattern (Story 9.3, 9.4)

**Pattern:** Debounced form updates with live preview.

```typescript
// In form component
const [formData, setFormData] = useState({ clientName: '', agentNotes: '' });

// Debounced callback to parent
const debouncedUpdate = useMemo(
  () => debounce((data) => onChange(data), debounceMs),
  [onChange, debounceMs]
);

useEffect(() => {
  debouncedUpdate(formData);
}, [formData, debouncedUpdate]);
```

**Preview Component Props:**
```typescript
interface OnePagerPreviewProps {
  clientName: string;
  agentNotes: string;
  extractions: QuoteExtraction[];
  branding: AgencyBranding | null;
  isUpdating?: boolean;  // Show reduced opacity during updates
}
```

## PDF Generation Pattern (Story 9.4)

**Pattern:** Client-side PDF generation using @react-pdf/renderer.

```typescript
import { pdf } from '@react-pdf/renderer';
import { OnePagerPdfDocument } from '@/components/one-pager/one-pager-pdf-document';

async function generatePdf(props: OnePagerPdfProps): Promise<Blob> {
  const doc = <OnePagerPdfDocument {...props} />;
  const blob = await pdf(doc).toBlob();
  return blob;
}

// Download trigger
const blob = await generatePdf(props);
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = `docuMINE-one-pager-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
link.click();
URL.revokeObjectURL(url);
```

**PDF Document Structure:**
- Letter size (8.5" x 11")
- Agency header with branding
- Client information section
- Quote overview (single) or comparison table (multi)
- Coverage highlights / comparison grid
- Gaps section (for comparisons)
- Agent notes (if provided)
- Footer with agency contact

## Agency Branding Hook (Story 9.1)

**Pattern:** Fetch and manage agency branding with optimistic updates.

```typescript
import { useAgencyBranding } from '@/hooks/use-agency-branding';

const { branding, isLoading, updateBranding, uploadLogo, removeLogo } = useAgencyBranding(agencyId);

// Update branding
await updateBranding({
  primaryColor: '#2563eb',
  phone: '555-1234',
});

// Upload logo (validates type and size)
const logoUrl = await uploadLogo(file); // PNG/JPG only, max 2MB

// Remove logo
await removeLogo();
```

**Branding Fields:**
- `name`: Agency name
- `logoUrl`: Logo image URL (nullable)
- `primaryColor`: Primary brand color (default: #2563eb)
- `secondaryColor`: Secondary brand color (default: #1e40af)
- `phone`, `email`, `address`, `website`: Contact info

## useOnePagerData Hook (Story 9.3)

**Pattern:** Smart data loading based on entry mode.

```typescript
import { useOnePagerData } from '@/hooks/use-one-pager-data';

// Entry mode determined from searchParams
const { data, isLoading, error, loadComparison, loadDocument } = useOnePagerData(
  comparisonId,  // from searchParams
  documentId     // from searchParams
);

// data.entryMode: 'comparison' | 'document' | 'select'
// data.extractions: QuoteExtraction[]
// data.defaultClientName: string (from namedInsured)
// data.selectableDocuments: SelectableDocument[] (for select mode)
```

## Test Data Attributes

**One-Pager Components:**
- `data-testid="one-pager-button"` - Entry point button
- `data-testid="one-pager-preview"` - Live preview panel
- `data-testid="client-name-input"` - Client name field
- `data-testid="agent-notes-input"` - Agent notes textarea
- `data-testid="download-button"` - PDF download button
- `data-testid="generate-button"` - Generate from selection button
- `data-one-pager-button` - History row icon button

## Color Formatting

**Pattern:** Convert hex to RGB for PDF rendering.

```typescript
// @react-pdf/renderer uses RGB arrays, not hex
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [37, 99, 235]; // Default blue
}

// Usage in PDF styles
backgroundColor: `rgb(${hexToRgb(branding.primaryColor).join(',')})`
```

## One-Pager 406 Error Fix (Story 10.9, 2025-12-04)

**Issue:** One-pager page stuck on "Loading..." with HTTP 406 error when loading document by ID.

**Root Cause:** `useOnePagerData` hook used `.single()` to query `quote_extractions` table. When no extraction exists for a document, PostgREST returns 406 (PGRST116). Same bug pattern as Story 6.1.

**Resolution:**
1. Changed `.single()` to `.maybeSingle()` for quote_extractions query
2. Added fallback to check `documents.extraction_data` column (Story 10.12 cache)

**Files Changed:**
- `src/hooks/use-one-pager-data.ts` - Lines 140-157
- `__tests__/hooks/use-one-pager-data.test.ts` - Updated mocks to use `maybeSingle`

**Key Pattern:**
```typescript
// ❌ Bad - throws 406 when no extraction exists
const { data } = await supabase
  .from('quote_extractions')
  .select('*')
  .eq('document_id', id)
  .single();

// ✅ Good - returns null gracefully
const { data } = await supabase
  .from('quote_extractions')
  .select('*')
  .eq('document_id', id)
  .maybeSingle();

// Fallback to documents.extraction_data if no quote_extractions entry
if (!extraction && docData.extraction_data) {
  extraction = docData.extraction_data as unknown as QuoteExtraction;
}
```
