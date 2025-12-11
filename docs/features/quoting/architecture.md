# Quoting Helper (Phase 3) - Architecture

**Author:** Sam
**Date:** 2025-12-10
**Version:** 1.0

---

## Executive Summary

Quoting Helper is a feature module within docuMINE that enables insurance agents to enter client data once and copy carrier-formatted output to clipboard. This architecture extends the existing docuMINE platform with new data models, API routes, and a carrier format system while leveraging existing infrastructure (auth, RLS, comparison engine).

**Key Architectural Decisions:**
- Quote sessions stored in Supabase with agency-scoped RLS
- Carrier formats defined as TypeScript functions (not stored in DB)
- Client data stored as structured JSONB for flexibility
- Integration with existing comparison infrastructure via adapter pattern

---

## Decision Summary

| Category | Decision | Rationale |
|----------|----------|-----------|
| Data Storage | Supabase PostgreSQL | Consistent with docuMINE, RLS for multi-tenancy |
| Client Data Model | Structured JSONB | Flexibility for varying insurance data, easy iteration |
| Carrier Formats | TypeScript functions | Type-safe, testable, version-controlled |
| Auto-save | Debounced on blur | UX requirement, prevents data loss |
| Quote Results | Separate table | Clean separation, enables comparison integration |
| Comparison Integration | Adapter pattern | Transforms quote results to existing comparison format |

---

## Project Structure (Additions)

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── quoting/                    # NEW: Quoting feature
│   │       ├── page.tsx                # Quote sessions list
│   │       └── [id]/
│   │           └── page.tsx            # Quote session detail (tabs)
│   └── api/
│       └── quoting/                    # NEW: Quoting API
│           ├── route.ts                # GET list, POST create session
│           └── [id]/
│               ├── route.ts            # GET/PATCH/DELETE session
│               ├── client-data/
│               │   └── route.ts        # PATCH client data (auto-save)
│               ├── carriers/
│               │   └── route.ts        # GET carrier list with status
│               ├── format/
│               │   └── [carrier]/
│               │       └── route.ts    # GET formatted clipboard data
│               ├── quotes/
│               │   ├── route.ts        # GET/POST quote results
│               │   └── [quoteId]/
│               │       └── route.ts    # PATCH/DELETE quote result
│               └── comparison/
│                   └── route.ts        # POST generate comparison
├── components/
│   └── quoting/                        # NEW: Quoting components
│       ├── quote-session-card.tsx
│       ├── quote-session-form.tsx
│       ├── client-info-tab.tsx
│       ├── property-tab.tsx
│       ├── auto-tab.tsx
│       ├── drivers-tab.tsx
│       ├── carriers-tab.tsx
│       ├── results-tab.tsx
│       ├── carrier-action-row.tsx
│       ├── copy-button.tsx
│       └── quote-result-form.tsx
├── lib/
│   └── quoting/                        # NEW: Quoting business logic
│       ├── carriers/
│       │   ├── index.ts                # Carrier registry
│       │   ├── types.ts                # Carrier format types
│       │   ├── progressive.ts          # Progressive formatter
│       │   └── travelers.ts            # Travelers formatter
│       ├── validation.ts               # VIN, address validation
│       ├── comparison-adapter.ts       # Transform to comparison format
│       └── service.ts                  # Quote session service
├── hooks/
│   └── quoting/                        # NEW: Quoting hooks
│       ├── use-quote-sessions.ts       # List sessions
│       ├── use-quote-session.ts        # Single session
│       ├── use-auto-save.ts            # Debounced auto-save
│       └── use-clipboard-copy.ts       # Copy with feedback
└── types/
    └── quoting.ts                      # NEW: Quoting types
```

---

## Data Architecture

### New Tables

```sql
-- Quote Sessions (main entity)
create table quote_sessions (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id),
  user_id uuid not null references users(id),

  -- Basic info
  prospect_name text not null,
  quote_type text not null default 'bundle', -- 'home' | 'auto' | 'bundle'
  status text not null default 'draft', -- 'draft' | 'in_progress' | 'quotes_received' | 'complete'

  -- Client data stored as structured JSONB
  client_data jsonb not null default '{}',

  -- Metadata
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Quote Results (per-carrier quotes received)
create table quote_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references quote_sessions(id) on delete cascade,
  agency_id uuid not null references agencies(id),

  -- Carrier info
  carrier_code text not null, -- 'progressive' | 'travelers' | etc.
  carrier_name text not null,

  -- Quote details
  premium_annual decimal(10, 2),
  premium_monthly decimal(10, 2),
  deductible_home decimal(10, 2),
  deductible_auto decimal(10, 2),

  -- Coverage details as JSONB (flexible per carrier)
  coverages jsonb not null default '{}',

  -- Status
  status text not null default 'quoted', -- 'quoted' | 'declined' | 'not_competitive'

  -- Attached document (optional)
  document_storage_path text,

  -- Metadata
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_quote_sessions_agency on quote_sessions(agency_id);
create index idx_quote_sessions_user on quote_sessions(user_id);
create index idx_quote_sessions_status on quote_sessions(status);
create index idx_quote_results_session on quote_results(session_id);
create index idx_quote_results_agency on quote_results(agency_id);
```

### RLS Policies

```sql
-- Enable RLS
alter table quote_sessions enable row level security;
alter table quote_results enable row level security;

-- Quote sessions scoped to agency
create policy "Quote sessions scoped to agency" on quote_sessions
  for all using (agency_id = (select agency_id from users where id = auth.uid()));

-- Quote results scoped to agency
create policy "Quote results scoped to agency" on quote_results
  for all using (agency_id = (select agency_id from users where id = auth.uid()));
```

### Client Data Schema (JSONB)

```typescript
// src/types/quoting.ts

export interface QuoteClientData {
  // Personal Information
  personal: {
    firstName: string;
    lastName: string;
    dateOfBirth: string; // ISO date
    email: string;
    phone: string;
    mailingAddress: Address;
  };

  // Property Information (home/bundle)
  property?: {
    address: Address;
    yearBuilt: number;
    squareFootage: number;
    constructionType: 'frame' | 'masonry' | 'superior';
    roofType: 'asphalt' | 'tile' | 'metal' | 'slate' | 'other';
    roofYear: number;

    // Coverage preferences
    dwellingCoverage: number;
    liabilityCoverage: number;
    deductible: number;

    // Risk factors
    hasPool: boolean;
    hasTrampoline: boolean;
    claimsHistory: ClaimRecord[];
  };

  // Auto Information (auto/bundle)
  auto?: {
    vehicles: Vehicle[];
    drivers: Driver[];

    // Coverage preferences
    liabilityBodily: string; // e.g., "100/300"
    liabilityProperty: number;
    comprehensiveDeductible: number;
    collisionDeductible: number;
    uninsuredMotorist: boolean;
  };
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Vehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  vin: string;
  usage: 'commute' | 'pleasure' | 'business';
  annualMileage: number;
}

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  licenseNumber: string;
  licenseState: string;
  yearsLicensed: number;
  relationship: 'self' | 'spouse' | 'child' | 'other';
  accidents: number;
  violations: number;
}

export interface ClaimRecord {
  year: number;
  type: string;
  amount: number;
}
```

---

## Carrier Format System

### Architecture

Carrier formats are implemented as TypeScript functions that transform `QuoteClientData` into carrier-specific clipboard text.

```
┌─────────────────────────────────────────────────────────────┐
│                    Carrier Format System                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  QuoteClientData ──► CarrierFormatter ──► Clipboard Text    │
│                                                             │
│  ┌─────────────────┐   ┌─────────────────────────────────┐ │
│  │ client_data     │   │ formatForProgressive(data)      │ │
│  │ (JSONB)         │──►│ formatForTravelers(data)        │ │
│  │                 │   │ formatForSafeco(data) (future)  │ │
│  └─────────────────┘   └─────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Carrier Registry

```typescript
// src/lib/quoting/carriers/index.ts

import { progressiveFormatter } from './progressive';
import { travelersFormatter } from './travelers';
import type { CarrierFormatter, CarrierInfo } from './types';

export const CARRIERS: Record<string, CarrierInfo> = {
  progressive: {
    code: 'progressive',
    name: 'Progressive',
    portalUrl: 'https://forageint.progressive.com/',
    logoPath: '/carriers/progressive.svg',
    formatter: progressiveFormatter,
    linesOfBusiness: ['auto', 'home', 'bundle'],
  },
  travelers: {
    code: 'travelers',
    name: 'Travelers',
    portalUrl: 'https://www.travelers.com/agentlink',
    logoPath: '/carriers/travelers.svg',
    formatter: travelersFormatter,
    linesOfBusiness: ['auto', 'home', 'bundle'],
  },
};

export function getCarrier(code: string): CarrierInfo | undefined {
  return CARRIERS[code];
}

export function getSupportedCarriers(): CarrierInfo[] {
  return Object.values(CARRIERS);
}
```

### Carrier Formatter Interface

```typescript
// src/lib/quoting/carriers/types.ts

import type { QuoteClientData } from '@/types/quoting';

export interface CarrierFormatter {
  /**
   * Format client data for clipboard copy
   * Returns tab-delimited text optimized for pasting into carrier portal
   */
  formatForClipboard(data: QuoteClientData): string;

  /**
   * Generate preview of formatted data (for UI display)
   */
  generatePreview(data: QuoteClientData): FormattedPreview;

  /**
   * Validate that required fields are present for this carrier
   */
  validateRequiredFields(data: QuoteClientData): ValidationResult;
}

export interface CarrierInfo {
  code: string;
  name: string;
  portalUrl: string;
  logoPath: string;
  formatter: CarrierFormatter;
  linesOfBusiness: ('home' | 'auto' | 'bundle')[];
}

export interface FormattedPreview {
  sections: {
    label: string;
    fields: { name: string; value: string }[];
  }[];
}

export interface ValidationResult {
  valid: boolean;
  missingFields: string[];
}
```

### Example Formatter (Progressive)

```typescript
// src/lib/quoting/carriers/progressive.ts

import type { CarrierFormatter, FormattedPreview, ValidationResult } from './types';
import type { QuoteClientData } from '@/types/quoting';

export const progressiveFormatter: CarrierFormatter = {
  formatForClipboard(data: QuoteClientData): string {
    const lines: string[] = [];

    // Personal Info - tab-delimited for easy paste
    const p = data.personal;
    lines.push(`${p.firstName}\t${p.lastName}`);
    lines.push(formatDate(p.dateOfBirth));
    lines.push(p.email);
    lines.push(formatPhone(p.phone));
    lines.push(`${p.mailingAddress.street}`);
    lines.push(`${p.mailingAddress.city}\t${p.mailingAddress.state}\t${p.mailingAddress.zipCode}`);

    // Property Info (if applicable)
    if (data.property) {
      lines.push(''); // Blank line separator
      lines.push(`Property: ${data.property.address.street}`);
      lines.push(`Year Built: ${data.property.yearBuilt}`);
      lines.push(`Sq Ft: ${data.property.squareFootage}`);
      lines.push(`Construction: ${data.property.constructionType}`);
      lines.push(`Dwelling Coverage: $${data.property.dwellingCoverage.toLocaleString()}`);
    }

    // Auto Info (if applicable)
    if (data.auto) {
      lines.push('');
      data.auto.vehicles.forEach((v, i) => {
        lines.push(`Vehicle ${i + 1}: ${v.year} ${v.make} ${v.model}`);
        lines.push(`VIN: ${v.vin}`);
      });

      data.auto.drivers.forEach((d, i) => {
        lines.push(`Driver ${i + 1}: ${d.firstName} ${d.lastName}`);
        lines.push(`DOB: ${formatDate(d.dateOfBirth)}`);
        lines.push(`License: ${d.licenseNumber} (${d.licenseState})`);
      });
    }

    return lines.join('\n');
  },

  generatePreview(data: QuoteClientData): FormattedPreview {
    // Return structured preview for UI display
    const sections = [];

    sections.push({
      label: 'Personal Information',
      fields: [
        { name: 'Name', value: `${data.personal.firstName} ${data.personal.lastName}` },
        { name: 'DOB', value: formatDate(data.personal.dateOfBirth) },
        { name: 'Email', value: data.personal.email },
        { name: 'Phone', value: formatPhone(data.personal.phone) },
      ],
    });

    // Add property/auto sections as applicable...

    return { sections };
  },

  validateRequiredFields(data: QuoteClientData): ValidationResult {
    const missing: string[] = [];

    if (!data.personal.firstName) missing.push('First Name');
    if (!data.personal.lastName) missing.push('Last Name');
    if (!data.personal.dateOfBirth) missing.push('Date of Birth');
    // ... more validation

    return { valid: missing.length === 0, missingFields: missing };
  },
};

// Helper functions
function formatDate(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}
```

---

## API Contracts

### Quote Sessions

**GET /api/quoting**
```typescript
// List quote sessions for current user
Response: {
  data: QuoteSession[];
  error: null;
}
```

**POST /api/quoting**
```typescript
// Create new quote session
Request: {
  prospectName: string;
  quoteType: 'home' | 'auto' | 'bundle';
}
Response: {
  data: QuoteSession;
  error: null;
}
```

**GET /api/quoting/[id]**
```typescript
// Get quote session with client data
Response: {
  data: QuoteSession & { clientData: QuoteClientData };
  error: null;
}
```

**PATCH /api/quoting/[id]/client-data**
```typescript
// Auto-save client data (partial update)
Request: Partial<QuoteClientData>
Response: {
  data: { updatedAt: string };
  error: null;
}
```

### Carrier Format

**GET /api/quoting/[id]/format/[carrier]**
```typescript
// Get formatted clipboard text for carrier
Response: {
  data: {
    clipboardText: string;
    preview: FormattedPreview;
    validation: ValidationResult;
  };
  error: null;
}
```

### Quote Results

**POST /api/quoting/[id]/quotes**
```typescript
// Add quote result from carrier
Request: {
  carrierCode: string;
  premiumAnnual: number;
  premiumMonthly?: number;
  deductibleHome?: number;
  deductibleAuto?: number;
  coverages: Record<string, unknown>;
  status: 'quoted' | 'declined' | 'not_competitive';
}
Response: {
  data: QuoteResult;
  error: null;
}
```

### Comparison Generation

**POST /api/quoting/[id]/comparison**
```typescript
// Generate comparison document from quote results
Request: {
  quoteIds: string[];
  options?: {
    coveragesToInclude?: string[];
  };
}
Response: {
  data: {
    comparisonId: string;
    documentUrl: string;
  };
  error: null;
}
```

---

## Integration Points

### Comparison Engine Adapter

Transform quote results to existing comparison document format:

```typescript
// src/lib/quoting/comparison-adapter.ts

import type { QuoteResult } from '@/types/quoting';
import type { ComparisonDocument } from '@/types/compare';

export function adaptQuoteResultsToComparison(
  sessionName: string,
  results: QuoteResult[]
): ComparisonDocument {
  return {
    title: `Quote Comparison - ${sessionName}`,
    generatedAt: new Date().toISOString(),
    carriers: results.map(r => ({
      name: r.carrierName,
      premium: {
        annual: r.premiumAnnual,
        monthly: r.premiumMonthly,
      },
      coverages: mapCoverages(r.coverages),
      deductibles: {
        home: r.deductibleHome,
        auto: r.deductibleAuto,
      },
    })),
  };
}

function mapCoverages(raw: Record<string, unknown>): CoverageItem[] {
  // Map carrier-specific coverage format to standardized format
  // ...
}
```

### Existing Infrastructure Reuse

| Component | Reuse Strategy |
|-----------|----------------|
| Authentication | Use existing Supabase Auth via `createClient()` |
| RLS | Apply same agency-scoping pattern |
| File Storage | Use existing `documents` bucket for quote PDFs |
| Comparison Engine | Call existing comparison generation with adapter |
| Toast Notifications | Use existing Sonner toast pattern |
| Form Components | Use existing shadcn/ui form components |

---

## Implementation Patterns

### Auto-Save Pattern

```typescript
// src/hooks/quoting/use-auto-save.ts

import { useCallback, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';

export function useAutoSave(sessionId: string) {
  const pendingChanges = useRef<Partial<QuoteClientData>>({});

  const saveToServer = useDebouncedCallback(
    async () => {
      if (Object.keys(pendingChanges.current).length === 0) return;

      const changes = { ...pendingChanges.current };
      pendingChanges.current = {};

      await fetch(`/api/quoting/${sessionId}/client-data`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
    },
    500, // 500ms debounce
    { maxWait: 2000 } // Force save after 2s of continuous changes
  );

  const queueChange = useCallback((path: string, value: unknown) => {
    // Deep merge change into pending changes
    setNestedValue(pendingChanges.current, path, value);
    saveToServer();
  }, [saveToServer]);

  return { queueChange };
}
```

### Copy to Clipboard Pattern

```typescript
// src/hooks/quoting/use-clipboard-copy.ts

import { useState, useCallback } from 'react';

export function useClipboardCopy() {
  const [copiedCarrier, setCopiedCarrier] = useState<string | null>(null);

  const copyToClipboard = useCallback(async (
    carrier: string,
    text: string
  ): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCarrier(carrier);

      // Reset after 2 seconds
      setTimeout(() => setCopiedCarrier(null), 2000);

      return true;
    } catch (error) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();

      const success = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (success) {
        setCopiedCarrier(carrier);
        setTimeout(() => setCopiedCarrier(null), 2000);
      }

      return success;
    }
  }, []);

  return { copyToClipboard, copiedCarrier };
}
```

### Form Field Change Handler

```typescript
// Pattern for form fields with auto-save

function ClientInfoTab({ sessionId }: { sessionId: string }) {
  const { queueChange } = useAutoSave(sessionId);

  return (
    <Input
      name="firstName"
      defaultValue={data.personal.firstName}
      onBlur={(e) => queueChange('personal.firstName', e.target.value)}
    />
  );
}
```

---

## Security Architecture

### Data Protection

| Data Type | Protection |
|-----------|------------|
| Personal Info (name, DOB) | RLS agency isolation |
| Contact Info (email, phone) | RLS agency isolation |
| SSN (drivers) | **Encrypted column** + RLS |
| License Numbers | **Encrypted column** + RLS |
| VIN | Plain text (not sensitive) |
| Addresses | RLS agency isolation |

### Encrypted Columns

```sql
-- For sensitive fields, use pgcrypto encryption
alter table quote_sessions add column
  encrypted_sensitive_data bytea;

-- Encrypt on write, decrypt on read via service functions
```

### API Security

- All endpoints require authentication (middleware)
- Agency scoping via RLS on all queries
- Rate limiting inherited from Vercel/Supabase
- Input validation on all user data

---

## Performance Considerations

| Operation | Target | Strategy |
|-----------|--------|----------|
| Session list load | < 500ms | Index on agency_id, paginate |
| Client data save | < 1s | Debounced, non-blocking |
| Clipboard format | < 200ms | Client-side computation |
| Comparison generation | < 3s | Async, existing infrastructure |

---

## Development Environment

### Prerequisites

- Existing docuMINE development setup
- No additional services required for Phase 3

### Database Migration

```bash
# Create migration for quoting tables
npx supabase migration new add_quoting_tables

# Apply migration
npx supabase db push
```

### Type Generation

```bash
# Regenerate types after migration
npm run generate-types
```

---

## Architecture Decision Records (ADRs)

### ADR-010: Structured JSONB for Client Data

**Decision:** Store client data as structured JSONB rather than normalized tables.

**Rationale:**
- Insurance data varies by carrier and line of business
- Allows rapid iteration without migrations
- Single read/write for entire client profile
- TypeScript types provide schema validation at runtime

**Trade-offs:**
- Can't query individual fields efficiently (acceptable - we query by session)
- Need defensive mapping when reading (standard pattern in docuMINE)

### ADR-011: TypeScript Carrier Formatters

**Decision:** Implement carrier formats as TypeScript functions, not database-stored templates.

**Rationale:**
- Type-safe transformation of client data
- Testable in isolation
- Version-controlled with code
- Easy to add new carriers (new .ts file)

**Trade-offs:**
- Adding carriers requires code deployment (acceptable for Phase 3)
- Phase 4 may need more dynamic approach for user-added carriers

### ADR-012: Adapter Pattern for Comparison Integration

**Decision:** Use adapter function to transform quote results to existing comparison format.

**Rationale:**
- Reuse existing comparison infrastructure
- No changes to comparison engine
- Clean separation of concerns
- Easier to maintain both systems

---

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: 2025-12-10_
_For: Sam_
