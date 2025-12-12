# Epic Technical Specification: Client Data Capture

Date: 2025-12-11
Author: Sam
Epic ID: Q3
Status: Draft

---

## Overview

Epic Q3 delivers the comprehensive client data capture system for Quoting Helper Phase 3. This is the "enter once" half of the "enter once, use everywhere" value proposition. Agents enter prospect personal information, property details (for home/bundle quotes), vehicle information, and driver data through a structured, tab-based form interface with intelligent validation and auto-save functionality.

The data capture forms build upon the quote session infrastructure from Epic Q2, storing all client data in the `client_data` JSONB column. This structured data becomes the input for Epic Q4's carrier format system, which transforms it into clipboard-ready text for each carrier portal.

**Note on Story Consolidation:** The original 6 stories have been consolidated to 3 stories. Q3.1, Q3.3, Q3.4, and Q3.5 (all form tabs) are combined into a single comprehensive forms story, as they share identical patterns (tab structure, field inputs, validation integration, auto-save). This reduces implementation overhead while maintaining full FR coverage.

## Objectives and Scope

**In Scope:**
- Client Info tab with personal information fields (name, DOB, contact, address)
- Property tab with home details and coverage preferences (home/bundle quotes only)
- Auto tab with vehicle management (add/edit/remove vehicles, up to 6)
- Drivers tab with driver management (add/edit/remove drivers, up to 8)
- Auto-save system that persists data on field blur with debouncing
- Field validation (VIN format, ZIP format, phone formatting, date formatting)
- Currency and phone auto-formatting as users type
- Tab completion indicators showing section progress
- Conditional tab visibility based on quote type

**Out of Scope:**
- Carrier-specific data formatting (Epic Q4)
- Quote result entry (Epic Q5)
- Encrypted storage for sensitive fields like SSN (deferred - mask in UI for now)

**Enhanced Scope (Added):**
- Address autocomplete API integration using Google Places API
- VIN decode API for auto-populating year/make/model from VIN

## System Architecture Alignment

This epic implements the data capture layer from the Architecture document, specifically:

- **Data Model:** Uses `QuoteClientData` TypeScript interface with nested `personal`, `property`, and `auto` objects stored as structured JSONB in `quote_sessions.client_data`
- **Components:** Creates form tab components in `src/components/quoting/` following existing shadcn/ui patterns
- **Auto-Save Pattern:** Implements debounced save on blur using `use-debounce` package as specified in Architecture ADR
- **API Integration:** Uses PATCH `/api/quoting/[id]/client-data` endpoint for partial updates
- **Validation:** Client-side validation with Zod schemas, server-side validation on API routes

**Key Architecture References:**
- Data Models: `QuoteClientData`, `Address`, `Vehicle`, `Driver` interfaces (Architecture §Data Architecture)
- Auto-Save Pattern: 500ms debounce, 2s max wait (Architecture §Implementation Patterns)
- Component Structure: Tab-based sections per UX Design §9.2

## Detailed Design

### Services and Modules

| Module | Location | Responsibility |
|--------|----------|----------------|
| **client-info-tab** | `src/components/quoting/tabs/client-info-tab.tsx` | Personal info form (name, DOB, contact, address) |
| **property-tab** | `src/components/quoting/tabs/property-tab.tsx` | Home details and coverage preferences |
| **auto-tab** | `src/components/quoting/tabs/auto-tab.tsx` | Vehicle list management with add/edit/remove |
| **drivers-tab** | `src/components/quoting/tabs/drivers-tab.tsx` | Driver list management with add/edit/remove |
| **vehicle-card** | `src/components/quoting/vehicle-card.tsx` | Individual vehicle display with edit/remove actions |
| **driver-card** | `src/components/quoting/driver-card.tsx` | Individual driver display with edit/remove actions |
| **address-autocomplete** | `src/components/quoting/address-autocomplete.tsx` | Google Places address input with autocomplete |
| **vin-input** | `src/components/quoting/vin-input.tsx` | VIN input with decode and validation |
| **use-auto-save** | `src/hooks/quoting/use-auto-save.ts` | Debounced auto-save hook |
| **use-address-autocomplete** | `src/hooks/quoting/use-address-autocomplete.ts` | Google Places API integration |
| **use-vin-decode** | `src/hooks/quoting/use-vin-decode.ts` | NHTSA VIN decode API integration |
| **validation** | `src/lib/quoting/validation.ts` | Zod schemas and validation utilities |
| **formatters** | `src/lib/quoting/formatters.ts` | Phone, currency, date formatting utilities |

### Data Models and Contracts

**QuoteClientData (JSONB Schema):**

```typescript
// src/types/quoting.ts

export interface QuoteClientData {
  personal: PersonalInfo;
  property?: PropertyInfo;  // Only for home/bundle
  auto?: AutoInfo;          // Only for auto/bundle
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;      // ISO date YYYY-MM-DD
  email: string;
  phone: string;            // Stored as digits, formatted for display
  mailingAddress: Address;
}

export interface Address {
  street: string;
  unit?: string;
  city: string;
  state: string;            // 2-letter code
  zipCode: string;          // 5 digits or ZIP+4
  placeId?: string;         // Google Places ID for reference
}

export interface PropertyInfo {
  address: Address;
  sameAsMailing: boolean;
  yearBuilt: number;
  squareFootage: number;
  constructionType: 'frame' | 'masonry' | 'superior';
  roofType: 'asphalt' | 'tile' | 'metal' | 'slate' | 'other';
  roofYear: number;
  dwellingCoverage: number;
  liabilityCoverage: number;      // 100000, 300000, 500000, 1000000
  deductible: number;             // 500, 1000, 2500, 5000
  hasPool: boolean;
  hasTrampoline: boolean;
}

export interface AutoInfo {
  vehicles: Vehicle[];
  drivers: Driver[];
  liabilityBodily: string;        // "50/100", "100/300", "250/500"
  liabilityProperty: number;      // 50000, 100000, 250000
  comprehensiveDeductible: number;
  collisionDeductible: number;
  uninsuredMotorist: boolean;
}

export interface Vehicle {
  id: string;                     // UUID for list management
  year: number;
  make: string;
  model: string;
  vin: string;                    // 17 characters, uppercase
  usage: 'commute' | 'pleasure' | 'business';
  annualMileage: number;
}

export interface Driver {
  id: string;                     // UUID for list management
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  licenseNumber: string;
  licenseState: string;           // 2-letter code
  yearsLicensed: number;
  relationship: 'self' | 'spouse' | 'child' | 'other';
  accidents: number;              // Past 5 years
  violations: number;             // Past 5 years
}
```

**Zod Validation Schemas:**

```typescript
// src/lib/quoting/validation.ts

import { z } from 'zod';

export const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  unit: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'Invalid state'),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
  placeId: z.string().optional(),
});

export const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  mailingAddress: addressSchema,
});

export const vehicleSchema = z.object({
  id: z.string().uuid(),
  year: z.number().min(1990).max(new Date().getFullYear() + 1),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  vin: z.string().length(17).regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'Invalid VIN format'),
  usage: z.enum(['commute', 'pleasure', 'business']),
  annualMileage: z.number().min(0).max(100000),
});

export const driverSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  licenseNumber: z.string().min(1, 'License number is required'),
  licenseState: z.string().length(2, 'Invalid state'),
  yearsLicensed: z.number().min(0).max(70),
  relationship: z.enum(['self', 'spouse', 'child', 'other']),
  accidents: z.number().min(0).max(10),
  violations: z.number().min(0).max(10),
});

// VIN validation helper (excludes I, O, Q)
export function isValidVin(vin: string): boolean {
  if (vin.length !== 17) return false;
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin.toUpperCase());
}
```

### APIs and Interfaces

**Internal API - Client Data Save:**

```typescript
// PATCH /api/quoting/[id]/client-data

// Request: Partial update to client_data JSONB
Request: {
  personal?: Partial<PersonalInfo>;
  property?: Partial<PropertyInfo>;
  auto?: Partial<AutoInfo>;
}

// Response
Response: {
  data: { updatedAt: string };
  error: null;
}
```

**External API - Google Places Autocomplete:**

```typescript
// src/hooks/quoting/use-address-autocomplete.ts

// Google Places Autocomplete API
// Endpoint: /api/quoting/places/autocomplete
// Server-side proxy to protect API key

Request: {
  input: string;         // User's typed input
  sessionToken: string;  // For billing optimization
}

Response: {
  predictions: Array<{
    placeId: string;
    description: string;        // Full address string
    mainText: string;           // Street portion
    secondaryText: string;      // City, State, ZIP
  }>;
}

// Place Details (after selection)
// Endpoint: /api/quoting/places/details

Request: {
  placeId: string;
  sessionToken: string;
}

Response: {
  address: Address;  // Parsed into our Address interface
}
```

**External API - NHTSA VIN Decode:**

```typescript
// src/hooks/quoting/use-vin-decode.ts

// NHTSA Vehicle API (free, no key required)
// https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/{vin}?format=json

// Direct client-side call (CORS-friendly)
Response: {
  Results: Array<{
    Variable: string;
    Value: string | null;
  }>;
}

// Parsed result
interface VinDecodeResult {
  year: number;
  make: string;
  model: string;
  vehicleType: string;
  valid: boolean;
  errorMessage?: string;
}
```

### Workflows and Sequencing

**Data Entry Flow:**

```
1. User navigates to /quoting/[id]
   └── Page loads quote session with existing client_data
   └── Tabs render based on quote_type (home/auto/bundle)

2. User enters data in Client Info tab
   └── Each field blur triggers auto-save
   └── Phone auto-formats as (XXX) XXX-XXXX
   └── Address autocomplete suggests options
   └── Selection populates all address fields

3. User moves to Property tab (if home/bundle)
   └── "Same as Mailing" copies address
   └── Currency fields auto-format with $ and commas
   └── Coverage dropdowns show common options

4. User moves to Auto tab (if auto/bundle)
   └── "Add Vehicle" creates new vehicle card
   └── VIN input triggers decode on blur/17 chars
   └── Year/Make/Model auto-populate from VIN
   └── User can override auto-populated values
   └── "Remove" shows confirmation or undo toast

5. User moves to Drivers tab (if auto/bundle)
   └── "Add Driver" creates new driver card
   └── First driver defaults to "Self" relationship
   └── License number masked after entry (••••••1234)

6. Tab completion indicators update
   └── ✓ for complete sections
   └── Count for multi-item (e.g., "2 vehicles")
```

**Auto-Save Sequence:**

```
User types in field
    │
    ▼
Field blur event
    │
    ▼
Queue change in pendingChanges ref
    │
    ▼
Debounce (500ms) ──┐
    │              │ If user types again within 500ms
    │              └── Reset timer
    ▼
Max wait (2s) reached OR debounce fires
    │
    ▼
PATCH /api/quoting/[id]/client-data
    │
    ├── Success: Show "Saved" indicator (2s)
    │
    └── Failure: Show toast with "Retry" button
```

**VIN Decode Sequence:**

```
User enters VIN (17 characters)
    │
    ▼
Field blur OR 17 chars reached
    │
    ▼
Validate format (A-HJ-NPR-Z0-9)
    │
    ├── Invalid: Show "Invalid VIN format" error
    │
    └── Valid: Call NHTSA decode API
              │
              ├── Success: Auto-populate Year, Make, Model
              │            Show "Vehicle identified: 2024 Toyota Camry"
              │
              └── Failure: Show warning "Couldn't decode VIN"
                           Allow manual entry

## Non-Functional Requirements

### Performance

| Metric | Target | Implementation |
|--------|--------|----------------|
| Form tab load | < 200ms | Lazy load tab content, skeleton states |
| Field response | < 100ms | No blocking operations on input |
| Auto-save latency | < 1s | Background PATCH, non-blocking UI |
| Address autocomplete | < 300ms | Debounced 200ms, server-side caching |
| VIN decode | < 2s | NHTSA API direct call, loading spinner |
| Tab switch | < 100ms | Client-side state, no network call |

**Optimization Strategies:**
- Debounce address autocomplete input (200ms) to reduce API calls
- Cache Google Places session tokens for billing efficiency
- Pre-validate fields client-side before server round-trip
- Use optimistic UI for save indicators

### Security

| Concern | Mitigation |
|---------|------------|
| PII in client_data | RLS enforces agency-scoped access; data encrypted at rest via Supabase |
| License numbers | Masked in UI after entry (••••••1234); stored in JSONB (future: encrypted column) |
| Google API key exposure | Server-side proxy for Places API; key never sent to client |
| Input injection | Zod validation on all inputs; parameterized queries via Supabase client |
| XSS in form fields | React's default escaping; no dangerouslySetInnerHTML |

**Sensitive Field Handling:**
- Driver license numbers: Display masked, store full value
- SSN: Not collected in Phase 3 (deferred)
- DOB: Stored as ISO date string, displayed as MM/DD/YYYY

### Reliability/Availability

| Scenario | Behavior |
|----------|----------|
| Auto-save failure | Toast with "Save failed" + retry button; data persisted in local state |
| Google Places unavailable | Fallback to manual address entry; no autocomplete |
| NHTSA VIN API down | Warning message; manual year/make/model entry enabled |
| Network offline | Forms remain functional; saves queue and retry on reconnect |
| Session timeout | Redirect to login; unsaved changes in localStorage for recovery |

**Graceful Degradation:**
- All external API features (address autocomplete, VIN decode) are enhancements
- Core form functionality works without any external dependencies
- Failed saves retry automatically with exponential backoff (max 3 attempts)

### Observability

| Signal | Implementation |
|--------|----------------|
| Auto-save success/failure | Console log in dev; error tracking in production |
| VIN decode attempts | Log VIN (last 4 only), success/failure, response time |
| Address autocomplete usage | Log query count per session for billing monitoring |
| Form completion rates | Track tab completion events for analytics |
| Validation errors | Aggregate error types for UX improvement insights |

**Monitoring:**
- Google Places API usage tracked via Google Cloud Console
- NHTSA API is free/unlimited but log for debugging
- Form abandonment tracking (started but not completed sessions)

## Dependencies and Integrations

### Internal Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Epic Q1 | Complete | Database schema (quote_sessions table with client_data JSONB) |
| Epic Q2 | Complete | Quote session detail page structure, tab navigation |
| `use-quote-session` hook | Q2.3 | Fetch and manage quote session state |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react-hook-form` | ^7.x | Form state management and validation |
| `@hookform/resolvers` | ^3.x | Zod resolver for react-hook-form |
| `zod` | ^3.x | Schema validation (already in project) |
| `use-debounce` | ^10.x | Debounced auto-save callbacks |
| `@react-google-maps/api` | ^2.x | Google Places Autocomplete component |

### External API Integrations

| Service | Type | Cost | Notes |
|---------|------|------|-------|
| **Google Places API** | Autocomplete + Details | FREE tier: 10,000 requests/month each. Beyond: Autocomplete $2.83/1,000, Details $5.00/1,000 | Server-side proxy required; session tokens optimize billing |
| **NHTSA vPIC API** | VIN Decode | Free | No API key; direct client call; rate limit ~5 req/sec |

### Environment Variables (New)

```bash
# .env.local
GOOGLE_PLACES_API_KEY=xxx          # Server-side only
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxx # Client-side for Maps JS SDK (if using Places component)
```

### Existing Infrastructure Reuse

| Component | Usage |
|-----------|-------|
| Supabase Auth | User context for RLS |
| Supabase Client | Database operations |
| shadcn/ui Form | Input, Select, Checkbox, Label, Calendar |
| shadcn/ui Tabs | Tab navigation (already used in Q2.3) |
| Sonner toast | Save success/failure notifications |
| Tailwind CSS | Styling |

## Acceptance Criteria (Authoritative)

### Story Q3.1: Data Capture Forms (Consolidated)

**Client Info Tab (FR7):**
1. AC-3.1.1: Client Info tab displays fields: First Name*, Last Name*, DOB*, Email*, Phone*, Mailing Address (Street, City, State, ZIP)*
2. AC-3.1.2: Required fields marked with red asterisk (*)
3. AC-3.1.3: Phone input auto-formats as (XXX) XXX-XXXX while typing
4. AC-3.1.4: Address field shows autocomplete suggestions from Google Places API
5. AC-3.1.5: Selecting autocomplete suggestion populates all address fields (street, city, state, ZIP)
6. AC-3.1.6: State dropdown contains all 50 US states + DC
7. AC-3.1.7: DOB uses date picker component with MM/DD/YYYY display format

**Property Tab (FR8, FR9):**
8. AC-3.1.8: Property tab visible only for Home and Bundle quote types
9. AC-3.1.9: "Same as Mailing Address" checkbox copies mailing address when checked
10. AC-3.1.10: Property tab displays: Year Built, Square Footage, Construction Type (Frame/Masonry/Superior), Roof Type, Roof Year
11. AC-3.1.11: Coverage section displays: Dwelling Coverage (currency), Liability Coverage (dropdown), Deductible (dropdown)
12. AC-3.1.12: Currency inputs display with $ prefix and thousands separators
13. AC-3.1.13: Risk factors section displays: Has Pool (checkbox), Has Trampoline (checkbox)

**Auto Tab - Vehicles (FR10, FR11, FR14):**
14. AC-3.1.14: Auto tab visible only for Auto and Bundle quote types
15. AC-3.1.15: "Add Vehicle" button creates new vehicle entry (max 6 vehicles)
16. AC-3.1.16: Vehicle fields: Year (dropdown 1990-2026), Make, Model, VIN, Usage (Commute/Pleasure/Business), Annual Mileage
17. AC-3.1.17: VIN input auto-uppercases and validates 17-character format (excludes I, O, Q)
18. AC-3.1.18: Valid VIN triggers NHTSA decode API; auto-populates Year, Make, Model on success
19. AC-3.1.19: VIN decode failure shows warning but allows manual entry
20. AC-3.1.20: Each vehicle displays as card with "2024 Toyota Camry" format and Edit/Remove actions
21. AC-3.1.21: Remove vehicle shows confirmation or undo toast
22. AC-3.1.22: Coverage preferences section (once per quote): Bodily Injury Liability, Property Damage Liability, Comprehensive Deductible, Collision Deductible, Uninsured Motorist checkbox

**Drivers Tab (FR12, FR13):**
23. AC-3.1.23: Drivers tab visible only for Auto and Bundle quote types
24. AC-3.1.24: "Add Driver" button creates new driver entry (max 8 drivers)
25. AC-3.1.25: Driver fields: First Name*, Last Name*, DOB*, License Number*, License State*, Years Licensed, Relationship (Self/Spouse/Child/Other), Accidents (0-10), Violations (0-10)
26. AC-3.1.26: First driver defaults to "Self" relationship
27. AC-3.1.27: License number displays masked after entry (••••••1234)
28. AC-3.1.28: Each driver displays as card with "John Smith (Self) - 15 years licensed" format
29. AC-3.1.29: Remove driver shows confirmation

**Tab Completion Indicators:**
30. AC-3.1.30: Tabs show completion indicator: ✓ when all required fields filled
31. AC-3.1.31: Multi-item tabs show count: "2 vehicles", "3 drivers"

### Story Q3.2: Auto-Save Implementation (FR6, FR18)

32. AC-3.2.1: Data auto-saves on field blur within 500ms (debounced)
33. AC-3.2.2: "Saving..." indicator appears during save operation
34. AC-3.2.3: "Saved" indicator appears on success and auto-dismisses after 2s
35. AC-3.2.4: Save failure shows toast with "Retry" button
36. AC-3.2.5: Rapid changes debounced with 2s max wait (fires even if user keeps typing)
37. AC-3.2.6: Auto-save is non-blocking; user can continue editing other fields
38. AC-3.2.7: Phone numbers auto-format to (XXX) XXX-XXXX on blur
39. AC-3.2.8: Dates display as MM/DD/YYYY format

### Story Q3.3: Field Validation & Formatting (FR16, FR17)

40. AC-3.3.1: VIN validates format: exactly 17 characters, alphanumeric excluding I, O, Q
41. AC-3.3.2: Invalid VIN shows inline error: "Invalid VIN format"
42. AC-3.3.3: Valid VIN shows ✓ indicator
43. AC-3.3.4: ZIP code validates: 5 digits or ZIP+4 format (XXXXX or XXXXX-XXXX)
44. AC-3.3.5: Invalid ZIP shows inline error: "Invalid ZIP code"
45. AC-3.3.6: Email validates standard email format
46. AC-3.3.7: Validation errors appear inline below field on blur
47. AC-3.3.8: Fields with errors have red border highlight
48. AC-3.3.9: Currency fields format with $ prefix and thousands commas on blur

## Traceability Mapping

| AC | FR | Spec Section | Component | Test Approach |
|----|-----|--------------|-----------|---------------|
| AC-3.1.1 | FR7 | Data Models | client-info-tab.tsx | Unit: field rendering |
| AC-3.1.2 | FR7 | UX §7.1 | Form labels | Visual: asterisk present |
| AC-3.1.3 | FR18 | Formatters | formatters.ts | Unit: phone formatting |
| AC-3.1.4 | FR17 | APIs | address-autocomplete.tsx | Integration: Places API mock |
| AC-3.1.5 | FR17 | APIs | use-address-autocomplete.ts | Integration: field population |
| AC-3.1.6 | FR7 | Data Models | US_STATES constant | Unit: all states present |
| AC-3.1.7 | FR7 | UX §7.1 | Calendar component | Visual: date picker |
| AC-3.1.8 | FR8 | Workflows | Tab visibility logic | Unit: quote type conditional |
| AC-3.1.9 | FR8 | UX §9.2 | property-tab.tsx | Unit: checkbox copies address |
| AC-3.1.10 | FR8 | Data Models | property-tab.tsx | Unit: field rendering |
| AC-3.1.11 | FR9 | Data Models | property-tab.tsx | Unit: coverage fields |
| AC-3.1.12 | FR9 | Formatters | formatters.ts | Unit: currency formatting |
| AC-3.1.13 | FR8 | Data Models | property-tab.tsx | Unit: checkbox fields |
| AC-3.1.14 | FR10 | Workflows | Tab visibility logic | Unit: quote type conditional |
| AC-3.1.15 | FR11 | UX §9.2 | auto-tab.tsx | Unit: add vehicle, max 6 |
| AC-3.1.16 | FR10 | Data Models | vehicle-card.tsx | Unit: field rendering |
| AC-3.1.17 | FR16 | Validation | validation.ts | Unit: VIN regex |
| AC-3.1.18 | FR16 | APIs | use-vin-decode.ts | Integration: NHTSA API mock |
| AC-3.1.19 | FR16 | Reliability | vin-input.tsx | Unit: fallback to manual |
| AC-3.1.20 | FR10 | UX §6.1 | vehicle-card.tsx | Visual: card display |
| AC-3.1.21 | FR11 | UX §7.1 | auto-tab.tsx | Unit: remove confirmation |
| AC-3.1.22 | FR14 | Data Models | auto-tab.tsx | Unit: coverage fields |
| AC-3.1.23 | FR12 | Workflows | Tab visibility logic | Unit: quote type conditional |
| AC-3.1.24 | FR13 | UX §9.2 | drivers-tab.tsx | Unit: add driver, max 8 |
| AC-3.1.25 | FR12 | Data Models | driver-card.tsx | Unit: field rendering |
| AC-3.1.26 | FR12 | UX §9.2 | drivers-tab.tsx | Unit: first driver default |
| AC-3.1.27 | FR12 | Security | driver-card.tsx | Visual: license masked |
| AC-3.1.28 | FR12 | UX §6.1 | driver-card.tsx | Visual: card display |
| AC-3.1.29 | FR13 | UX §7.1 | drivers-tab.tsx | Unit: remove confirmation |
| AC-3.1.30 | FR7-14 | UX §6.1.3 | Tab completion logic | Unit: completion calculation |
| AC-3.1.31 | FR11,13 | UX §6.1.3 | Tab completion logic | Unit: count display |
| AC-3.2.1 | FR6 | Auto-Save Pattern | use-auto-save.ts | Integration: debounce timing |
| AC-3.2.2 | FR6 | UX §7.1 | Save indicator | Visual: saving state |
| AC-3.2.3 | FR6 | UX §7.1 | Save indicator | Visual: saved state |
| AC-3.2.4 | FR6 | Reliability | use-auto-save.ts | Unit: error handling |
| AC-3.2.5 | FR6 | Auto-Save Pattern | use-auto-save.ts | Unit: maxWait behavior |
| AC-3.2.6 | FR6 | Performance | use-auto-save.ts | Unit: non-blocking |
| AC-3.2.7 | FR18 | Formatters | formatters.ts | Unit: phone formatting |
| AC-3.2.8 | FR18 | Formatters | formatters.ts | Unit: date formatting |
| AC-3.3.1 | FR16 | Validation | validation.ts | Unit: VIN schema |
| AC-3.3.2 | FR16 | UX §7.1 | vin-input.tsx | Visual: error message |
| AC-3.3.3 | FR16 | UX §7.1 | vin-input.tsx | Visual: success indicator |
| AC-3.3.4 | FR17 | Validation | validation.ts | Unit: ZIP schema |
| AC-3.3.5 | FR17 | UX §7.1 | address fields | Visual: error message |
| AC-3.3.6 | FR7 | Validation | validation.ts | Unit: email schema |
| AC-3.3.7 | FR16,17 | UX §7.1 | Form components | Visual: inline errors |
| AC-3.3.8 | FR16,17 | UX §7.1 | Form components | Visual: error border |
| AC-3.3.9 | FR9 | Formatters | formatters.ts | Unit: currency formatting |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **R1:** Google Places API cost exceeds budget | Medium | Medium | Monitor usage; implement session tokens; consider free alternative (OpenStreetMap Nominatim) |
| **R2:** NHTSA VIN API rate limits hit | Low | Low | Client-side call distributes load; cache decoded VINs in session |
| **R3:** Auto-save race conditions with rapid edits | Medium | Medium | Use debounce with maxWait; server-side last-write-wins with updated_at check |
| **R4:** Large JSONB client_data impacts performance | Low | Medium | Index on session ID only; no queries on JSONB fields; paginate sessions list |
| **R5:** Form complexity overwhelms users | Medium | High | Progressive disclosure; clear section organization; smart defaults |

### Assumptions

| ID | Assumption | Validation |
|----|------------|------------|
| **A1** | Google Places API key already configured in Google Cloud project | Verify GCP project setup; enable Places API |
| **A2** | Users have stable internet for auto-save | Graceful degradation handles offline; local state persists |
| **A3** | NHTSA API remains free and available | No SLA; fallback to manual entry acceptable |
| **A4** | 6 vehicles / 8 drivers sufficient for personal lines | Based on typical household; can increase later if needed |
| **A5** | License number masking sufficient for MVP (vs. encryption) | PII stays in agency-scoped RLS; encryption planned for Phase 4 |

### Open Questions

| ID | Question | Owner | Status |
|----|----------|-------|--------|
| **Q1** | Should we use Google Places Autocomplete widget or server proxy? | Dev | **Decision: Server proxy** - protects API key, more control |
| **Q2** | Do we need VIN check digit validation (position 9)? | Sam | **Decision: No** - NHTSA decode handles validation; overkill for MVP |
| **Q3** | What happens if user enters partial data and leaves? | Dev | **Decision: Auto-save preserves partial data; session stays "Draft"** |
| **Q4** | Should Property tab auto-calculate dwelling coverage from sq ft? | Sam | **Deferred** - E&O risk; let agents enter manually |

## Test Strategy Summary

### Unit Tests

| Area | Coverage | Tools |
|------|----------|-------|
| **Validation schemas** | All Zod schemas (address, vehicle, driver, etc.) | Vitest |
| **Formatters** | Phone, currency, date formatting functions | Vitest |
| **VIN validation** | Format regex, character exclusions | Vitest |
| **Tab completion logic** | Required field detection, count calculation | Vitest |

### Integration Tests

| Area | Coverage | Tools |
|------|----------|-------|
| **Auto-save hook** | Debounce timing, API calls, error handling | Vitest + MSW |
| **Address autocomplete** | Places API mock, field population | Vitest + MSW |
| **VIN decode** | NHTSA API mock, auto-populate behavior | Vitest + MSW |
| **Client data API** | PATCH endpoint, partial updates, RLS | Vitest + Supabase test client |

### Component Tests

| Component | Test Cases |
|-----------|------------|
| **client-info-tab** | Renders all fields; validates on blur; phone formats |
| **property-tab** | Conditional visibility; "Same as Mailing" copies address |
| **auto-tab** | Add/remove vehicles; max 6 limit; VIN input behavior |
| **drivers-tab** | Add/remove drivers; max 8 limit; license masking |
| **vehicle-card** | Edit mode toggle; remove confirmation |
| **driver-card** | Edit mode toggle; relationship display |
| **address-autocomplete** | Suggestions display; selection populates fields |
| **vin-input** | Format validation; decode trigger; auto-populate |

### E2E Tests

| Scenario | Steps |
|----------|-------|
| **Complete bundle quote data entry** | Navigate to session → Fill all tabs → Verify data persists on refresh |
| **Auto-only quote flow** | Create auto quote → Verify Property tab hidden → Add vehicles/drivers |
| **Home-only quote flow** | Create home quote → Verify Auto/Drivers tabs hidden → Fill property |
| **VIN decode happy path** | Enter valid VIN → Verify year/make/model auto-populate |
| **Address autocomplete** | Type address → Select suggestion → Verify all fields populated |
| **Auto-save verification** | Edit field → Blur → Refresh page → Verify data persisted |

### Test Data

```typescript
// __tests__/fixtures/quoting.ts

export const validVin = '1HGCM82633A004352'; // 2003 Honda Accord
export const invalidVin = 'INVALID12345678';

export const testAddress = {
  street: '123 Main Street',
  city: 'Austin',
  state: 'TX',
  zipCode: '78701',
};

export const testVehicle = {
  id: 'test-vehicle-1',
  year: 2024,
  make: 'Toyota',
  model: 'Camry',
  vin: '4T1BF1FK5EU123456',
  usage: 'commute' as const,
  annualMileage: 12000,
};

export const testDriver = {
  id: 'test-driver-1',
  firstName: 'John',
  lastName: 'Smith',
  dateOfBirth: '1985-03-15',
  licenseNumber: 'DL123456789',
  licenseState: 'TX',
  yearsLicensed: 15,
  relationship: 'self' as const,
  accidents: 0,
  violations: 0,
};
```

### Coverage Targets

| Type | Target |
|------|--------|
| Unit tests | 90% for validation.ts, formatters.ts |
| Integration tests | All API endpoints, all hooks |
| Component tests | All form tabs, all card components |
| E2E tests | Critical paths (bundle, auto-only, home-only) |
