# Dev Notes

## Technical Approach

**Upload Zone Component (react-dropzone):**
```typescript
import { useDropzone } from 'react-dropzone';

const { getRootProps, getInputProps, isDragActive } = useDropzone({
  accept: { 'application/pdf': ['.pdf'] },
  maxSize: 50 * 1024 * 1024, // 50MB
  maxFiles: 5,
  onDrop: handleFileDrop,
  onDropRejected: handleRejection,
});
```

**File Validation Schema:**
```typescript
const uploadDocumentSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.type === 'application/pdf', 'Only PDF files are supported')
    .refine((file) => file.size <= 50 * 1024 * 1024, 'File size must be less than 50MB'),
});
```

**Storage Path Pattern:**
```typescript
const storagePath = `${agencyId}/${documentId}/${filename}`;
await supabase.storage.from('documents').upload(storagePath, file);
```

**Document Record Creation:**
```typescript
const { data: document } = await supabase.from('documents').insert({
  id: documentId,
  agency_id: agencyId,
  uploaded_by: userId,
  filename: file.name,
  storage_path: storagePath,
  status: 'processing',
}).select().single();
```

## Dependencies

**New Package Required:**
- `react-dropzone` ^14.3.5 - Drag-and-drop file upload handling

**Already Installed:**
- `@supabase/supabase-js` - Storage and database operations
- `zod` - Validation (use `.issues` not `.errors` per project pattern)
- `sonner` - Toast notifications
- `lucide-react` - Icons

## Files to Create/Modify

**Create:**
- `src/components/documents/upload-zone.tsx` - Upload zone component
- `src/lib/documents/upload.ts` - Storage upload service
- `src/lib/documents/service.ts` - Document CRUD operations
- `src/app/(dashboard)/documents/actions.ts` - Server actions

**Modify:**
- `src/app/(dashboard)/documents/page.tsx` - Integrate upload zone

## Styling Notes

Per UX Specification:
- Trustworthy Slate theme: primary #475569
- Dashed border for drop zone (border-dashed)
- Hover/active state uses primary color
- No spinners > 200ms (use shimmer/skeleton if needed)
- Clean, minimal layout - no visual clutter

## Error Handling Pattern

From previous stories (architecture.md):
```typescript
// Application errors use custom classes
class ValidationError extends Error {
  code = 'VALIDATION_ERROR' as const;
}

// API responses follow format:
// Success: { data: T, error: null }
// Error: { data: null, error: { code: string, message: string } }
```

## RLS Considerations

Storage policies (from tech spec) require:
- Upload only to own agency folder
- Path first segment must match user's agency_id
- Policies already created in Epic 1.4

## Project Structure Notes

- Component path follows existing pattern: `src/components/documents/`
- Service path follows existing pattern: `src/lib/documents/`
- Server actions in page-specific `actions.ts` file

## References

- [Source: docs/sprint-artifacts/tech-spec-epic-4.md#Story-4.1]
- [Source: docs/epics.md#Story-4.1]
- [Source: docs/architecture.md#File-Upload-Pattern]
- [Source: docs/architecture.md#Implementation-Patterns]

## Learnings from Previous Story

**From Story 3-6-settings-ux-enhancements (Status: done)**

- **React 19 Patterns**: useOptimistic hook available for immediate UI feedback
- **CSS Media Queries**: Use `@media (hover: hover/none)` for touch device detection
- **Tailwind Group Class**: Use `group` and `group-hover:` for hover-reveal patterns
- **Animation Timing**: Keep animations under 300ms for snappy feel
- **Testing Patterns**: 280 tests passing, build succeeds - maintain this baseline
- **Skeleton Loading**: shadcn/ui Skeleton component established at `src/components/ui/skeleton.tsx`
- **Router Refresh**: Use `router.refresh()` instead of `window.location.reload()`

[Source: stories/3-6-settings-ux-enhancements.md#Dev-Agent-Record]
