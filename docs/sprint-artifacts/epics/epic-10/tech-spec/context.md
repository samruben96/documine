# Context

## Available Documents

| Document | Status | Key Insights |
|----------|--------|--------------|
| Architecture | ✅ Loaded | GPT-5.1 with zodResponseFormat, Supabase storage, OpenAI SDK 6.9.1 |
| PRD | ✅ Loaded | 95%+ accuracy requirement, trust transparency, source citations |
| Epic 10 Definition | ✅ Loaded | 11 stories, 26 points, industry research from IIAT/IRMI/AmTrust |
| Existing Extraction Code | ✅ Loaded | `src/lib/compare/extraction.ts`, `src/types/compare.ts` |
| Package.json | ✅ Loaded | Next.js 16, React 19, OpenAI 6.9.1, Zod 4.1.13 |

## Project Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.4 | App Router, SSR |
| React | 19.2.0 | UI Framework |
| TypeScript | 5.x | Language |
| Supabase | 2.84.0 | Database, Auth, Storage |
| OpenAI SDK | 6.9.1 | GPT-5.1 extraction with zodResponseFormat |
| Zod | 4.1.13 | Schema validation |
| Vitest | 4.0.14 | Unit testing |
| Playwright | 1.57.0 | E2E testing |
| @react-pdf/renderer | 4.3.1 | PDF generation |
| @tanstack/react-table | 8.21.3 | Comparison tables |

## Existing Codebase Structure

**Current Extraction System:**
- `src/types/compare.ts` - Types and Zod schemas for extraction
- `src/lib/compare/extraction.ts` - GPT-5.1 extraction service
- `src/lib/compare/diff.ts` - Comparison diff engine
- `src/components/compare/comparison-table.tsx` - UI component
- `src/components/one-pager/` - PDF generation components

**Current QuoteExtraction Schema:**
```typescript
interface QuoteExtraction {
  carrierName: string | null;
  policyNumber: string | null;
  namedInsured: string | null;
  effectiveDate: string | null;
  expirationDate: string | null;
  annualPremium: number | null;
  coverages: CoverageItem[];      // 9 coverage types
  exclusions: ExclusionItem[];    // 7 exclusion categories
  deductibles: DeductibleItem[];
  extractedAt: string;
  modelUsed: string;
}
```

**Current Coverage Types (9):**
- general_liability, property, auto_liability, auto_physical_damage
- umbrella, workers_comp, professional_liability, cyber, other

---
