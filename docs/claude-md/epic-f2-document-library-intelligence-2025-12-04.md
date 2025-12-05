# Epic F2: Document Library & Intelligence (2025-12-04)

## AI Tagging Service Pattern (Story F2.3)

**Pattern:** GPT-5.1 structured output for auto-tagging documents during processing.

```typescript
// src/lib/documents/ai-tagging.ts
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface TagResult {
  tags: string[];           // 3-5 relevant tags
  summary: string;          // 1-2 sentence summary
  documentType: 'quote' | 'general';
}

export async function generateDocumentTags(
  chunks: string[],
  timeoutMs = 5000
): Promise<TagResult | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-5.1',
      messages: [
        { role: 'system', content: TAGGING_SYSTEM_PROMPT },
        { role: 'user', content: chunks.slice(0, 5).join('\n\n---\n\n') },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'document_tags',
          schema: tagSchema,
        },
      },
      temperature: 0.1,
    }, { signal: controller.signal });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('AI tagging failed:', error);
    return null;  // Graceful degradation
  } finally {
    clearTimeout(timeout);
  }
}
```

**Key Points:**
- Uses `json_schema` response_format (not zodResponseFormat in Edge Functions)
- 5-second timeout with AbortController
- First 5 chunks (~5 pages) as context
- Graceful degradation - returns null on failure, processing continues
- Integrated in Edge Function after chunking step

**Edge Function Integration:**
```typescript
// Step 6.5: AI Tagging (after chunking, before completion)
try {
  const tagResult = await generateDocumentTags(chunks);
  if (tagResult) {
    await supabase.from('documents').update({
      ai_tags: tagResult.tags,
      ai_summary: tagResult.summary,
      document_type: tagResult.documentType,
    }).eq('id', documentId);
  }
} catch (error) {
  log.warn('AI tagging failed, continuing', { documentId });
  // Don't throw - document processing should complete
}
```

## Document Table Component (Story F2.6)

**Pattern:** @tanstack/react-table with shadcn Table primitives.

```typescript
// src/components/documents/document-table.tsx
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Column definitions with custom sorting
const columns: ColumnDef<DocumentTableRow>[] = [
  {
    accessorKey: 'filename',
    header: ({ column }) => <SortableHeader column={column} title="Name" />,
    cell: ({ row }) => <NameCell row={row} />,
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.display_name || rowA.original.filename;
      const b = rowB.original.display_name || rowB.original.filename;
      return a.localeCompare(b);
    },
  },
  // ... more columns
];

// Default sort: newest first
const [sorting, setSorting] = useState<SortingState>([
  { id: 'created_at', desc: true },
]);

const table = useReactTable({
  data: documents,
  columns,
  state: { sorting },
  onSortingChange: setSorting,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
});
```

**Features:**
- Sortable columns with arrow indicators
- Sticky header (z-index: 10)
- Row click navigates to document viewer
- Hover reveals actions dropdown
- Tags overflow with "+N" indicator

## Dropdown Menu Fix (Radix/shadcn Conflict)

**Issue:** DropdownMenu trigger with shadcn Button doesn't open.

**Root Cause:** shadcn's `Button` component with `asChild` on `DropdownMenuTrigger` conflicts with Radix UI click handling.

**Solution:**
```typescript
// ❌ Bad - dropdown won't open
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  ...
</DropdownMenu>

// ✅ Good - use native button + modal={false}
<DropdownMenu modal={false}>
  <DropdownMenuTrigger asChild>
    <button
      type="button"
      className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-slate-100"
    >
      <MoreHorizontal className="h-4 w-4" />
    </button>
  </DropdownMenuTrigger>
  ...
</DropdownMenu>
```

**Key Points:**
- Use native `<button>` instead of shadcn `Button` for triggers
- Add `modal={false}` to DropdownMenu to prevent focus lock issues
- Move `onClick={(e) => e.stopPropagation()}` to wrapper div, not button

## Document Type Categorization (Story F2.2)

**Schema:**
```sql
ALTER TABLE documents
ADD COLUMN document_type varchar(20) DEFAULT 'quote'
  CHECK (document_type IN ('quote', 'general'));

CREATE INDEX idx_documents_type ON documents(agency_id, document_type);
```

**TypeScript:**
```typescript
type DocumentType = 'quote' | 'general';

// Filter for compare page - only show quotes
const { data } = await supabase
  .from('documents')
  .select('*')
  .or('document_type.eq.quote,document_type.is.null');  // null = quote (backward compat)
```

**UI Components:**
- `DocumentTypeBadge` - Blue for Quote, Gray for General
- `DocumentTypeToggle` - Dropdown to change type with optimistic updates

## Tag Display Pattern (Story F2.3, F2.6)

**Pattern:** Show 3 tags with overflow indicator.

```typescript
// Tags column in table
const visibleTags = tags.slice(0, 3);
const remaining = tags.length - 3;

return (
  <Tooltip>
    <TooltipTrigger>
      <div className="flex items-center gap-1">
        {visibleTags.map((tag, i) => (
          <span key={i} className="px-1.5 py-0.5 rounded text-xs bg-slate-100">
            {tag}
          </span>
        ))}
        {remaining > 0 && (
          <span className="text-xs text-slate-400">+{remaining}</span>
        )}
      </div>
    </TooltipTrigger>
    <TooltipContent>
      <p>{tags.join(', ')}</p>
      {summary && <p className="text-slate-400 mt-1">{summary}</p>}
    </TooltipContent>
  </Tooltip>
);
```

## Test Data Attributes

**Document Library Components:**
- `data-testid="document-table"` - Table container
- `data-testid="document-row"` - Individual row
- `data-testid="upload-button"` - Upload dialog trigger
- `data-testid="empty-state"` - Empty state container
