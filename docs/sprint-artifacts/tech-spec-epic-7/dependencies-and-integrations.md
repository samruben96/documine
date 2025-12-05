# Dependencies and Integrations

## External Dependencies

| Dependency | Purpose | Fallback |
|------------|---------|----------|
| **OpenAI GPT-5.1** | Structured data extraction via function calling (400K context, CFG) | Claude Sonnet 4.5 via OpenRouter |
| **Supabase** | Database, storage, auth, RLS | None (core infrastructure) |
| **react-pdf** | PDF export generation | @react-pdf/renderer |

## Internal Dependencies (Existing Components)

| Component | Location | Usage in Epic 7 |
|-----------|----------|-----------------|
| Document list/cards | `src/components/documents/` | QuoteSelector reuses DocumentCard |
| Upload zone | `src/components/documents/upload-zone.tsx` | Upload new quotes in compare flow |
| Document viewer | `src/components/documents/document-viewer.tsx` | Source citation navigation |
| Highlight logic | `src/hooks/use-document-highlight.ts` | Reuse for source verification |
| Auth middleware | `src/middleware.ts` | Protect compare routes |
| Supabase clients | `src/lib/supabase/` | Database operations |
| Logger | `src/lib/utils/logger.ts` | Structured logging |

## New Dependencies to Add

```json
// package.json additions
{
  "dependencies": {
    "@react-pdf/renderer": "^3.4.4",  // PDF export
    "file-saver": "^2.0.5"            // CSV download
  },
  "devDependencies": {
    "@types/file-saver": "^2.0.7"
  }
}
```

## Migration Dependencies

Story 7.1 requires database migration:
- `quote_extractions` table
- `comparisons` table
- RLS policies

Must be applied before any other Epic 7 stories.
