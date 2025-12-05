# Detailed Design

## Services and Modules

| Module | Responsibility | Inputs | Outputs |
|--------|---------------|--------|---------|
| `useAgencyBranding` | Fetch agency branding data | `agencyId` | `AgencyBranding` object |
| `useOnePagerData` | Prepare data for PDF generation | `comparisonId` or `documentId` | `OnePagerData` object |
| `generateOnePager` | Create PDF blob from data | `OnePagerData`, `AgencyBranding` | `Blob` (PDF) |
| `OnePagerTemplate` | React PDF document component | Props with all data | `@react-pdf/renderer` Document |

## Data Models and Contracts

### Agency Branding (Database Schema Addition)

```sql
-- Migration: Add branding columns to agencies table
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS primary_color varchar(7) DEFAULT '#2563eb';
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS secondary_color varchar(7) DEFAULT '#1e40af';
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS phone varchar(20);
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS branding_email varchar(255);  -- Renamed to avoid conflict with agency email
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS website varchar(255);

-- Index for quick branding lookups (agencies already indexed by id)
-- No additional index needed
```

### TypeScript Types

```typescript
// src/lib/one-pager/types.ts

export interface AgencyBranding {
  name: string;              // From agencies.name
  logoUrl: string | null;    // Logo in Supabase Storage
  primaryColor: string;      // Hex code (default: #2563eb)
  secondaryColor: string;    // Hex code (default: #1e40af)
  phone: string | null;
  email: string | null;      // Branding email (may differ from agency admin email)
  address: string | null;
  website: string | null;
}

export interface OnePagerData {
  // Mode determines data source
  mode: 'comparison' | 'document' | 'select';

  // From comparison (mode === 'comparison')
  comparison?: {
    id: string;
    headers: string[];        // Carrier names
    rows: ComparisonRow[];    // From diff.ts
    gaps: GapWarning[];
    conflicts: ConflictWarning[];
  };

  // From document (mode === 'document')
  document?: {
    id: string;
    name: string;
    summary: string;          // AI-generated summary
    keyPoints: string[];      // Extracted highlights
  };

  // User-entered fields
  clientName: string;
  agentNotes: string;
  agentName: string;          // From user profile

  // Metadata
  generatedAt: Date;
}

export interface OnePagerConfig {
  showGaps: boolean;          // Default: true
  showPremiumSummary: boolean; // Default: true
  showAgentNotes: boolean;    // Default: true if notes provided
}
```

## APIs and Interfaces

### No New API Endpoints Required

One-pager generation is client-side only (using @react-pdf/renderer). Data fetching uses existing endpoints:

| Data Source | Endpoint | Notes |
|-------------|----------|-------|
| Comparison Data | GET `/api/compare?id=xxx` | Existing from Story 7.3 |
| Document Data | GET `/api/documents/:id` | Existing from Epic 4 |
| Agency Branding | Direct Supabase query | New columns on `agencies` table |
| User Profile | `useUser()` hook | For agent name |

### Branding Update (Admin Only)

```typescript
// Client-side update via Supabase client
// No API route needed - RLS policies handle authorization

const updateBranding = async (branding: Partial<AgencyBranding>) => {
  const { error } = await supabase
    .from('agencies')
    .update({
      logo_url: branding.logoUrl,
      primary_color: branding.primaryColor,
      secondary_color: branding.secondaryColor,
      phone: branding.phone,
      branding_email: branding.email,
      address: branding.address,
      website: branding.website,
    })
    .eq('id', agencyId);

  if (error) throw error;
};
```

## Workflows and Sequencing

### One-Pager Generation Flow

```
1. User clicks "Generate One-Pager" button
   ├── From Comparison Results: /one-pager?comparisonId=xxx
   ├── From Document Viewer: /one-pager?documentId=xxx
   └── From Dashboard: /one-pager (select mode)

2. One-Pager Page loads
   ├── Parse query params to determine mode
   ├── Fetch data based on mode:
   │   ├── comparison: GET /api/compare?id=xxx
   │   ├── document: GET /api/documents/:id
   │   └── select: Show selector UI
   └── Fetch agency branding: SELECT from agencies

3. User configures one-pager
   ├── Enter client name (required)
   ├── Enter agent notes (optional)
   └── Preview updates in real-time

4. User clicks "Download"
   ├── generateOnePager() creates PDF blob
   ├── Logo fetched and converted to base64
   ├── file-saver triggers download
   └── Filename: docuMINE-one-pager-YYYY-MM-DD.pdf
```

### Logo Upload Flow

```
1. Admin navigates to Settings → Branding
2. Admin drops/selects logo image
   ├── Validate: PNG/JPG, max 2MB, max 800x200px
   └── Show preview
3. On save:
   ├── Upload to Supabase Storage: branding/{agencyId}/logo.{ext}
   ├── Get public URL
   └── Update agencies.logo_url
```

---
