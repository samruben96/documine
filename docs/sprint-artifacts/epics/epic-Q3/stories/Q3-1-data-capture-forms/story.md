# Story Q3.1: Data Capture Forms (Consolidated)

Status: ready-for-dev

## Story

As an **insurance agent**,
I want **to enter prospect personal information, property details, vehicles, and drivers through structured form tabs**,
So that **I can capture all client data once and use it across multiple carrier quotes**.

## Acceptance Criteria

### Client Info Tab (FR7)

1. **AC-Q3.1-1:** Given the user is on the Client Info tab, when the form loads, then the following fields are displayed: First Name*, Last Name*, Date of Birth*, Email*, Phone*, and Mailing Address (Street, City, State dropdown, ZIP)*

2. **AC-Q3.1-2:** Given required fields, when displayed, then they are marked with a red asterisk (*)

3. **AC-Q3.1-3:** Given the user types in the Phone field, when digits are entered, then the input auto-formats as (XXX) XXX-XXXX while typing

4. **AC-Q3.1-4:** Given the user types in the address Street field, when at least 3 characters are entered, then autocomplete suggestions from Google Places API appear

5. **AC-Q3.1-5:** Given autocomplete suggestions are displayed, when the user selects a suggestion, then all address fields (street, city, state, ZIP) are populated automatically

6. **AC-Q3.1-6:** Given the State dropdown, when opened, then it contains all 50 US states plus DC (51 options)

7. **AC-Q3.1-7:** Given the DOB field, when clicked, then a date picker component opens with MM/DD/YYYY display format

### Property Tab (FR8, FR9)

8. **AC-Q3.1-8:** Given a quote session, when the quote_type is "home" or "bundle", then the Property tab is visible; when "auto", then the Property tab is hidden

9. **AC-Q3.1-9:** Given the Property tab, when the "Same as Mailing Address" checkbox is checked, then the property address fields are populated with values from Client Info mailing address

10. **AC-Q3.1-10:** Given the Property tab, when displayed, then the following fields are shown: Property Address, Year Built (number), Square Footage (number), Construction Type (dropdown: Frame/Masonry/Superior), Roof Type (dropdown: Asphalt/Tile/Metal/Slate/Other), Roof Year (number)

11. **AC-Q3.1-11:** Given the Property tab Coverage section, when displayed, then the following fields are shown: Dwelling Coverage (currency input), Liability Coverage (dropdown: $100K/$300K/$500K/$1M), Deductible (dropdown: $500/$1,000/$2,500/$5,000)

12. **AC-Q3.1-12:** Given currency input fields, when the user enters a number and blurs, then the value displays with $ prefix and thousands separators (e.g., $250,000)

13. **AC-Q3.1-13:** Given the Property tab Risk Factors section, when displayed, then checkboxes for "Has Pool" and "Has Trampoline" are shown

### Auto Tab - Vehicles (FR10, FR11, FR14)

14. **AC-Q3.1-14:** Given a quote session, when the quote_type is "auto" or "bundle", then the Auto tab is visible; when "home", then the Auto tab is hidden

15. **AC-Q3.1-15:** Given the Auto tab, when the user clicks "Add Vehicle" and fewer than 6 vehicles exist, then a new vehicle entry form is created; when 6 vehicles exist, the button is disabled with tooltip "Maximum 6 vehicles"

16. **AC-Q3.1-16:** Given a vehicle entry form, when displayed, then the following fields are shown: Year (dropdown: 1990 to current year + 1), Make (text), Model (text), VIN (text), Usage (dropdown: Commute/Pleasure/Business), Annual Mileage (number)

17. **AC-Q3.1-17:** Given the VIN input field, when the user types, then the input auto-uppercases and validates the 17-character format (alphanumeric excluding I, O, Q)

18. **AC-Q3.1-18:** Given a valid 17-character VIN is entered, when the field loses focus, then the NHTSA VIN decode API is called and Year, Make, Model fields auto-populate on success with message "Vehicle identified: [Year] [Make] [Model]"

19. **AC-Q3.1-19:** Given the VIN decode API call fails, when an error occurs, then a warning message "Couldn't decode VIN - please enter details manually" is shown and manual entry is allowed

20. **AC-Q3.1-20:** Given vehicles have been added, when displayed in the list, then each vehicle shows as a card with format "[Year] [Make] [Model]" (e.g., "2024 Toyota Camry") with Edit and Remove action buttons

21. **AC-Q3.1-21:** Given the user clicks Remove on a vehicle, when clicked, then either a confirmation dialog appears OR an undo toast is shown for 5 seconds before deletion

22. **AC-Q3.1-22:** Given the Auto tab Coverage Preferences section, when displayed, then the following fields are shown (once per quote, not per vehicle): Bodily Injury Liability (dropdown: 50/100, 100/300, 250/500), Property Damage Liability (dropdown: $50K/$100K/$250K), Comprehensive Deductible (dropdown: $250/$500/$1,000), Collision Deductible (dropdown: $250/$500/$1,000), Uninsured Motorist (checkbox)

### Drivers Tab (FR12, FR13)

23. **AC-Q3.1-23:** Given a quote session, when the quote_type is "auto" or "bundle", then the Drivers tab is visible; when "home", then the Drivers tab is hidden

24. **AC-Q3.1-24:** Given the Drivers tab, when the user clicks "Add Driver" and fewer than 8 drivers exist, then a new driver entry form is created; when 8 drivers exist, the button is disabled with tooltip "Maximum 8 drivers"

25. **AC-Q3.1-25:** Given a driver entry form, when displayed, then the following fields are shown: First Name*, Last Name*, Date of Birth*, License Number*, License State* (dropdown), Years Licensed (number: 0-70), Relationship (dropdown: Self/Spouse/Child/Other), Accidents past 5 years (number: 0-10), Violations past 5 years (number: 0-10)

26. **AC-Q3.1-26:** Given a new driver is added and it's the first driver, when the relationship field loads, then it defaults to "Self"

27. **AC-Q3.1-27:** Given a license number has been entered, when the field loses focus, then the value displays masked (e.g., "••••••1234" showing only last 4 characters)

28. **AC-Q3.1-28:** Given drivers have been added, when displayed in the list, then each driver shows as a card with format "[First] [Last] ([Relationship]) - [X] years licensed" (e.g., "John Smith (Self) - 15 years licensed")

29. **AC-Q3.1-29:** Given the user clicks Remove on a driver, when clicked, then a confirmation dialog appears asking "Remove this driver?"

### Tab Completion Indicators

30. **AC-Q3.1-30:** Given form tabs, when all required fields in a section are filled with valid data, then the tab shows a ✓ checkmark completion indicator

31. **AC-Q3.1-31:** Given the Auto or Drivers tab, when items have been added, then the tab label shows count (e.g., "Auto (2 vehicles)", "Drivers (3 drivers)")

## Tasks / Subtasks

### Task 1: Set up form infrastructure and shared utilities (AC: all)
- [ ] 1.1 Install required packages: `use-debounce`, `@react-google-maps/api` (if not present)
- [ ] 1.2 Create `src/lib/quoting/formatters.ts` with phone, currency, date formatting utilities
- [ ] 1.3 Create `src/lib/quoting/validation.ts` with Zod schemas for address, vehicle, driver
- [ ] 1.4 Create `src/lib/quoting/constants.ts` with US_STATES array, coverage options, dropdown values
- [ ] 1.5 Create `src/types/quoting.ts` type definitions (if not complete from Q2)

### Task 2: Implement Client Info Tab (AC: 1-7)
- [ ] 2.1 Create `src/components/quoting/tabs/client-info-tab.tsx` with all personal info fields
- [ ] 2.2 Implement phone number auto-formatting on input
- [ ] 2.3 Create `src/components/quoting/address-autocomplete.tsx` for Google Places integration
- [ ] 2.4 Create `src/hooks/quoting/use-address-autocomplete.ts` hook
- [ ] 2.5 Create server proxy `src/app/api/quoting/places/autocomplete/route.ts` to protect API key
- [ ] 2.6 Create server proxy `src/app/api/quoting/places/details/route.ts` for place details
- [ ] 2.7 Implement address field auto-population from selected suggestion
- [ ] 2.8 Add date picker component for DOB field
- [ ] 2.9 Style required field asterisks

### Task 3: Implement Property Tab (AC: 8-13)
- [ ] 3.1 Create `src/components/quoting/tabs/property-tab.tsx`
- [ ] 3.2 Implement conditional visibility based on quote_type
- [ ] 3.3 Implement "Same as Mailing Address" checkbox logic
- [ ] 3.4 Add property details fields with validation
- [ ] 3.5 Add coverage preference dropdowns
- [ ] 3.6 Implement currency input formatting with $ and commas
- [ ] 3.7 Add risk factor checkboxes

### Task 4: Implement Auto Tab with Vehicle Management (AC: 14-22)
- [ ] 4.1 Create `src/components/quoting/tabs/auto-tab.tsx`
- [ ] 4.2 Create `src/components/quoting/vehicle-card.tsx` for vehicle display
- [ ] 4.3 Implement "Add Vehicle" functionality with max 6 limit
- [ ] 4.4 Create `src/components/quoting/vin-input.tsx` with auto-uppercase and validation
- [ ] 4.5 Create `src/hooks/quoting/use-vin-decode.ts` for NHTSA API integration
- [ ] 4.6 Implement VIN decode auto-populate for year/make/model
- [ ] 4.7 Handle VIN decode failures with fallback to manual entry
- [ ] 4.8 Implement vehicle Edit mode toggle
- [ ] 4.9 Implement vehicle Remove with confirmation/undo
- [ ] 4.10 Add auto coverage preferences section (once per quote)

### Task 5: Implement Drivers Tab with Driver Management (AC: 23-29)
- [ ] 5.1 Create `src/components/quoting/tabs/drivers-tab.tsx`
- [ ] 5.2 Create `src/components/quoting/driver-card.tsx` for driver display
- [ ] 5.3 Implement "Add Driver" functionality with max 8 limit
- [ ] 5.4 Implement first driver "Self" relationship default
- [ ] 5.5 Implement license number masking (show last 4 only)
- [ ] 5.6 Implement driver Edit mode toggle
- [ ] 5.7 Implement driver Remove with confirmation dialog

### Task 6: Implement Tab Completion Indicators (AC: 30-31)
- [ ] 6.1 Create `src/lib/quoting/tab-completion.ts` completion calculation logic
- [ ] 6.2 Update tab navigation to show ✓ for complete sections
- [ ] 6.3 Update tab labels to show item counts (vehicles, drivers)
- [ ] 6.4 Integrate completion logic with existing tab structure from Q2.3

### Task 7: Wire up data persistence (AC: all)
- [ ] 7.1 Create/update `src/app/api/quoting/[id]/client-data/route.ts` PATCH endpoint
- [ ] 7.2 Integrate all tabs with session data loading from `use-quote-session` hook
- [ ] 7.3 Wire up form fields to update client_data JSONB structure
- [ ] 7.4 Implement partial update merging on server (deep merge into client_data)

### Task 8: Write unit tests for utilities (AC: all validation)
- [ ] 8.1 Create `__tests__/lib/quoting/formatters.test.ts` - phone, currency, date formatting
- [ ] 8.2 Create `__tests__/lib/quoting/validation.test.ts` - Zod schema tests
- [ ] 8.3 Create `__tests__/lib/quoting/tab-completion.test.ts` - completion logic tests

### Task 9: Write component tests (AC: all tabs)
- [ ] 9.1 Create `__tests__/components/quoting/tabs/client-info-tab.test.tsx`
- [ ] 9.2 Create `__tests__/components/quoting/tabs/property-tab.test.tsx`
- [ ] 9.3 Create `__tests__/components/quoting/tabs/auto-tab.test.tsx`
- [ ] 9.4 Create `__tests__/components/quoting/tabs/drivers-tab.test.tsx`
- [ ] 9.5 Create `__tests__/components/quoting/vehicle-card.test.tsx`
- [ ] 9.6 Create `__tests__/components/quoting/driver-card.test.tsx`
- [ ] 9.7 Create `__tests__/components/quoting/vin-input.test.tsx`
- [ ] 9.8 Create `__tests__/components/quoting/address-autocomplete.test.tsx`

### Task 10: Write integration and E2E tests (AC: all)
- [ ] 10.1 Create `__tests__/hooks/quoting/use-vin-decode.test.ts` with NHTSA API mock
- [ ] 10.2 Create `__tests__/hooks/quoting/use-address-autocomplete.test.ts` with Places API mock
- [ ] 10.3 Create `__tests__/e2e/quoting/data-capture.spec.ts` - full form flow tests
- [ ] 10.4 Test bundle quote type (all tabs visible)
- [ ] 10.5 Test auto-only quote type (Property tab hidden)
- [ ] 10.6 Test home-only quote type (Auto/Drivers tabs hidden)

### Task 11: Verify build and run full test suite (AC: all)
- [ ] 11.1 Run `npm run build` - verify no type errors
- [ ] 11.2 Run `npm run test` - verify all quoting tests pass
- [ ] 11.3 Manual testing of all tabs and interactions
- [ ] 11.4 Verify Google Places API integration works in dev environment

## Dev Notes

### Architecture Patterns

This story implements the data capture layer from the Architecture document:

- **Data Model:** Uses `QuoteClientData` TypeScript interface with nested `personal`, `property`, and `auto` objects stored as structured JSONB in `quote_sessions.client_data`
- **Components:** Creates form tab components in `src/components/quoting/tabs/` following existing shadcn/ui patterns
- **API Integration:** Uses PATCH `/api/quoting/[id]/client-data` endpoint for partial updates
- **Validation:** Client-side validation with Zod schemas, inline error display on blur

### Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Address autocomplete | Google Places API via server proxy | Protects API key, more control over responses |
| VIN decode | NHTSA vPIC API (direct client call) | Free, no API key, CORS-friendly |
| Form state | react-hook-form with Zod resolver | Consistent with existing patterns, good validation support |
| Currency formatting | Custom formatter function | Simpler than adding a formatting library |
| License masking | Client-side display masking only | Full encryption deferred to Phase 4 |

### External API Integration

**Google Places API:**
- Server proxy at `/api/quoting/places/autocomplete` and `/api/quoting/places/details`
- Uses session tokens for billing optimization (~$2.83/1000 sessions)
- Requires `GOOGLE_PLACES_API_KEY` environment variable (server-side only)

**NHTSA VIN Decode API:**
- Direct client-side call to `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/{vin}?format=json`
- Free, no API key required
- Returns year, make, model from VIN
- Graceful fallback if decode fails

### Project Structure Notes

New files to create:
```
src/
├── components/quoting/
│   ├── tabs/
│   │   ├── client-info-tab.tsx    # NEW
│   │   ├── property-tab.tsx       # NEW
│   │   ├── auto-tab.tsx           # NEW
│   │   └── drivers-tab.tsx        # NEW
│   ├── address-autocomplete.tsx   # NEW
│   ├── vin-input.tsx              # NEW
│   ├── vehicle-card.tsx           # NEW
│   └── driver-card.tsx            # NEW
├── hooks/quoting/
│   ├── use-address-autocomplete.ts # NEW
│   └── use-vin-decode.ts          # NEW
├── lib/quoting/
│   ├── formatters.ts              # NEW
│   ├── validation.ts              # NEW (may exist partially)
│   ├── constants.ts               # NEW
│   └── tab-completion.ts          # NEW
└── app/api/quoting/
    ├── [id]/client-data/route.ts  # NEW
    └── places/
        ├── autocomplete/route.ts  # NEW
        └── details/route.ts       # NEW
```

### Existing Infrastructure to Reuse

| Component | Location | Usage |
|-----------|----------|-------|
| Tabs component | shadcn/ui | Tab navigation (Q2.3 setup) |
| Form, Input, Label | shadcn/ui | Form fields |
| Select | shadcn/ui | Dropdown fields |
| Calendar | shadcn/ui | Date picker |
| Checkbox | shadcn/ui | Boolean fields |
| Button | shadcn/ui | Actions |
| AlertDialog | shadcn/ui | Confirmations |
| toast (Sonner) | Existing pattern | Success/error notifications |
| useQuoteSession | Q2.3 | Load session data |

### FRs Addressed

| FR | Description | Implementation |
|----|-------------|----------------|
| FR7 | Enter personal information | Client Info tab |
| FR8 | Enter property information | Property tab |
| FR9 | Enter property coverage preferences | Property tab coverage section |
| FR10 | Enter vehicle information | Auto tab vehicle forms |
| FR11 | Add multiple vehicles | Auto tab add/remove (max 6) |
| FR12 | Enter driver information | Drivers tab driver forms |
| FR13 | Add multiple drivers | Drivers tab add/remove (max 8) |
| FR14 | Enter auto coverage preferences | Auto tab coverage section |
| FR16 | VIN validation | VIN input validation (17 chars, excludes I/O/Q) |
| FR17 | Address validation | Google Places autocomplete |

### References

- [Source: docs/sprint-artifacts/epics/epic-Q3/tech-spec.md] - Full technical specification
- [Source: docs/features/quoting/architecture.md#Data-Architecture] - Data models
- [Source: docs/features/quoting/architecture.md#Implementation-Patterns] - Auto-save pattern
- [Source: docs/features/quoting/prd.md#Functional-Requirements] - FR7-17
- [Source: docs/features/quoting/epics.md#Epic-Q3] - Story breakdown

### Learnings from Previous Story

**From Story Q2-5-delete-duplicate-sessions (Status: done)**

- **Service Layer Pattern**: `deleteQuoteSession` and `duplicateQuoteSession` functions in `src/lib/quoting/service.ts` demonstrate the service layer pattern to follow for client-data operations
- **API Route Pattern**: `src/app/api/quoting/[id]/route.ts` shows DELETE handler pattern; extend for PATCH client-data endpoint
- **Test Infrastructure**: 117 quoting tests pass - maintain test count; add new tests for form components
- **E2E Pattern**: E2E tests in `__tests__/e2e/quoting/delete-duplicate.spec.ts` show navigation patterns for quoting E2E tests
- **Component Structure**: `QuoteSessionCard` and action menu patterns established - vehicle/driver cards follow similar structure
- **Optimistic UI**: Delete uses optimistic update pattern; consider for form saves

[Source: docs/sprint-artifacts/epics/epic-Q2/stories/Q2-5-delete-duplicate-sessions/story.md#Dev-Agent-Record]

### Environment Variables Required

```bash
# .env.local (add if not present)
GOOGLE_PLACES_API_KEY=xxx  # Server-side only, for Places API proxy
```

### Test Data Fixtures

```typescript
// Use in tests - see tech-spec for full fixtures
export const validVin = '1HGCM82633A004352'; // 2003 Honda Accord
export const invalidVin = 'INVALID12345678';
export const testAddress = {
  street: '123 Main Street',
  city: 'Austin',
  state: 'TX',
  zipCode: '78701',
};
```

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/epics/epic-Q3/stories/Q3-1-data-capture-forms/Q3-1-data-capture-forms.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2025-12-11: Story Q3.1 drafted - Comprehensive data capture forms consolidated story
