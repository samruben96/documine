# Consistency Rules

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Database tables | snake_case, plural | `documents`, `chat_messages` |
| Database columns | snake_case | `agency_id`, `created_at` |
| TypeScript types | PascalCase | `Document`, `ChatMessage` |
| TypeScript variables | camelCase | `documentId`, `agencyId` |
| React components | PascalCase | `DocumentViewer`, `ChatMessage` |
| React component files | kebab-case | `document-viewer.tsx` |
| API routes | kebab-case | `/api/documents`, `/api/chat` |
| Environment variables | SCREAMING_SNAKE_CASE | `OPENAI_API_KEY` |
| CSS classes | Tailwind utilities | `flex items-center gap-2` |

## UI Component Conventions

**Design System:** All UI components follow the docuMINE Design System (see `docs/architecture/uiux-architecture.md#design-system`)

### Typography

Use centralized typography utilities from `src/lib/typography.ts`:

```typescript
import { typography, spacing } from '@/lib/typography';

// DO: Use typography constants
<h1 className={typography.pageTitle}>Page Title</h1>
<p className={typography.body}>Body text</p>

// DON'T: Hardcode typography classes
<h1 className="text-2xl font-semibold text-slate-900">Page Title</h1>
```

### Component Styling

| Component | Required Pattern | Example |
|-----------|------------------|---------|
| Cards | Use Card component with explicit variant | `<Card hoverable>` for clickable cards |
| Buttons | Use Button component with variant | `<Button variant="secondary">` |
| Badges | Use StatusBadge for status indicators | `<StatusBadge status="success">` |
| Forms | Use spacing.form for field gaps | `<div className={spacing.form}>` |
| Page Layout | bg-slate-50, max-w-5xl, p-6 | See Page Layout Pattern |

### Dark Mode

All components must include explicit dark mode variants:

```typescript
// DO: Explicit dark mode classes
className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"

// DON'T: Rely on CSS variable inheritance
className="bg-card text-foreground"
```

**Reference:** Epic Design-Refresh (DR.1-DR.10) - Completed 2025-12-11

## Code Organization

| Type | Location | Pattern |
|------|----------|---------|
| Pages | `src/app/` | App Router conventions |
| Shared components | `src/components/` | Feature folders |
| UI primitives | `src/components/ui/` | shadcn/ui components |
| Server utilities | `src/lib/` | Client instances, helpers |
| React hooks | `src/hooks/` | `use-*.ts` |
| Types | `src/types/` | Shared type definitions |
| Database migrations | `supabase/migrations/` | Numbered SQL files |
| Edge functions | `supabase/functions/` | One folder per function |

## Error Handling

```typescript
// Application errors - use custom error classes
class DocumentNotFoundError extends Error {
  code = 'DOCUMENT_NOT_FOUND' as const;
  constructor(documentId: string) {
    super(`Document ${documentId} not found`);
  }
}

// API route error handling
export async function GET(request: Request) {
  try {
    // ... logic
  } catch (error) {
    if (error instanceof DocumentNotFoundError) {
      return Response.json(
        { data: null, error: { code: error.code, message: error.message } },
        { status: 404 }
      );
    }
    // Log unexpected errors, return generic message
    console.error('Unexpected error:', error);
    return Response.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
```

## Logging Strategy

```typescript
// Use structured logging
const log = {
  info: (message: string, data?: Record<string, unknown>) =>
    console.log(JSON.stringify({ level: 'info', message, ...data, timestamp: new Date().toISOString() })),
  error: (message: string, error: Error, data?: Record<string, unknown>) =>
    console.error(JSON.stringify({ level: 'error', message, error: error.message, stack: error.stack, ...data, timestamp: new Date().toISOString() })),
  warn: (message: string, data?: Record<string, unknown>) =>
    console.warn(JSON.stringify({ level: 'warn', message, ...data, timestamp: new Date().toISOString() })),
};

// Usage
log.info('Document processing started', { documentId, agencyId });
log.error('Failed to process document', error, { documentId });
```
