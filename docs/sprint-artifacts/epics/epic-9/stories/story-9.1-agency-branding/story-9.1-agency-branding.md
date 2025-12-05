# Story 9.1: Agency Branding

**Status:** done (code-reviewed 2025-12-04)

---

## User Story

As an **agency admin**,
I want to configure my agency's branding (logo, colors, contact info),
So that all generated one-pagers automatically include our professional identity.

---

## Acceptance Criteria

### AC-9.1.1: Branding Settings Page
**Given** I am logged in as an agency admin
**When** I navigate to Settings → Branding
**Then** I see a form to configure agency branding

### AC-9.1.2: Logo Upload
**Given** I am on the branding settings page
**When** I upload a logo image (PNG/JPG, max 2MB)
**Then** the logo is saved to Supabase Storage and displayed in preview

### AC-9.1.3: Color Configuration
**Given** I am on the branding settings page
**When** I select primary and secondary colors
**Then** the colors are saved and shown in preview swatches

### AC-9.1.4: Contact Information
**Given** I am on the branding settings page
**When** I enter phone, email, address, and website
**Then** the contact info is saved to the database

### AC-9.1.5: Admin-Only Access
**Given** I am logged in as a regular member (not admin)
**When** I try to access branding settings
**Then** I am redirected or see an unauthorized message

### AC-9.1.6: Branding Persistence
**Given** branding has been configured
**When** any agency member generates a one-pager
**Then** the saved branding is used

---

## Implementation Details

### Tasks / Subtasks

- [x] Create Supabase migration adding branding columns to `agencies` table (AC: #4, #6)
  - `logo_url text`
  - `primary_color varchar(7) DEFAULT '#2563eb'`
  - `secondary_color varchar(7) DEFAULT '#1e40af'`
  - `phone varchar(20)`
  - `branding_email varchar(255)` (renamed to avoid conflict)
  - `address text`
  - `website varchar(255)`
- [x] Regenerate TypeScript types after migration (AC: #6)
- [x] Create `branding` storage bucket with RLS policies (AC: #2)
- [x] Create `useAgencyBranding` hook to fetch branding data (AC: #6)
- [x] Create `LogoUpload` component with react-dropzone (AC: #2)
- [x] Create `ColorPicker` component for color selection (AC: #3)
- [x] Create `BrandingForm` component with all fields (AC: #1, #3, #4)
- [x] Create Branding tab in existing Settings page (AC: #1)
- [x] Add admin role check to protect branding settings (AC: #5)
- [x] Write unit tests for branding hook (AC: #6) - 13 tests
- [x] Write component tests for ColorPicker (AC: #3) - 11 tests

### Technical Summary

This story establishes the foundation for agency branding that will be used throughout the one-pager feature. We add new columns to the existing `agencies` table rather than creating a new table, keeping the data model simple. Logo images are stored in Supabase Storage with agency-scoped paths, and the branding hook provides easy access to branding data from any component.

### Project Structure Notes

- **Files to create:**
  - `src/app/(dashboard)/settings/branding/page.tsx`
  - `src/components/settings/branding-form.tsx`
  - `src/components/settings/logo-upload.tsx`
  - `src/components/settings/color-picker.tsx`
  - `src/hooks/use-agency-branding.ts`
  - `supabase/migrations/XXXXX_agency_branding.sql`
- **Files to modify:**
  - `src/types/database.types.ts` (regenerated)
- **Expected test locations:**
  - `__tests__/hooks/use-agency-branding.test.ts`
  - `__tests__/components/settings/branding-form.test.tsx`
- **Estimated effort:** 3 story points
- **Prerequisites:** None

### Key Code References

| File | Purpose |
|------|---------|
| `src/components/documents/upload-zone.tsx` | Pattern for react-dropzone file upload |
| `src/app/(dashboard)/settings/page.tsx` | Existing settings page structure |
| `src/hooks/use-agency-id.ts` | Pattern for agency-scoped hooks |

---

## Context References

**Tech-Spec:** [tech-spec-epic-9.md](./tech-spec-epic-9.md) - Primary context document containing:
- Database migration details
- Storage bucket configuration
- Component structure guidance

**Architecture:** [architecture.md](../architecture.md)
- Storage policies pattern
- RLS configuration

---

## Dev Agent Record

### Context Reference
- [9-1-agency-branding.context.xml](./9-1-agency-branding.context.xml)

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
- Fixed infinite re-render bug in `useAgencyBranding` hook - `createClient()` was being called on every render and included in `useCallback` dependencies. Fixed with `useMemo`.
- Fixed server→client component boundary error - Lucide icons cannot be passed as props from server components. Fixed with icon name string map pattern.
- Fixed settings page scroll issue - parent layout had `overflow-hidden`. Fixed by adding `h-full overflow-auto` wrapper.

### Completion Notes
All 6 ACs implemented:
- AC-9.1.1: Branding tab added to Settings page (admin only)
- AC-9.1.2: LogoUpload component with react-dropzone, 2MB limit, PNG/JPG validation
- AC-9.1.3: ColorPicker component with hex input, native color picker, preset swatches
- AC-9.1.4: BrandingForm component with phone, email, address, website fields
- AC-9.1.5: Admin role check - Branding tab only visible to admins
- AC-9.1.6: useAgencyBranding hook with fetch, update, uploadLogo, removeLogo, refetch

### Files Modified
**Created:**
- `src/hooks/use-agency-branding.ts` - Branding data hook
- `src/components/settings/logo-upload.tsx` - Logo upload component
- `src/components/settings/color-picker.tsx` - Color picker component
- `src/components/settings/branding-form.tsx` - Branding form component
- `src/components/settings/branding-tab.tsx` - Branding tab wrapper
- `__tests__/hooks/use-agency-branding.test.ts` - 13 unit tests
- `__tests__/components/settings/color-picker.test.tsx` - 11 unit tests

**Modified:**
- `src/app/(dashboard)/settings/page.tsx` - Added Branding tab (admin only), added scroll wrapper
- `src/types/database.types.ts` - Regenerated with branding columns

**Migrations Applied:**
- `add_agency_branding_columns` - Added logo_url, primary_color, secondary_color, phone, branding_email, address, website
- `create_branding_storage_bucket` - Created branding bucket with admin-only upload RLS policies

### Test Results
- 24 new tests (13 hook + 11 component)
- All 1139 tests passing

---

## Review Notes

**Reviewer:** Claude Opus 4.5 (code-review workflow)
**Date:** 2025-12-04

### AC Verification

| AC | Status | Evidence |
|----|--------|----------|
| AC-9.1.1 | PASS | `src/app/(dashboard)/settings/page.tsx:122` - Branding tab added, `src/components/settings/branding-form.tsx` renders complete form |
| AC-9.1.2 | PASS | `src/components/settings/logo-upload.tsx:56-65` - react-dropzone with PNG/JPG accept, 2MB maxSize |
| AC-9.1.3 | PASS | `src/components/settings/color-picker.tsx` - hex input, native color picker, 10 preset swatches |
| AC-9.1.4 | PASS | `src/components/settings/branding-form.tsx:177-262` - phone, email, address, website fields with validation |
| AC-9.1.5 | PASS | `src/app/(dashboard)/settings/page.tsx:122,157` - `isAdmin` check gates Branding tab visibility |
| AC-9.1.6 | PASS | `src/hooks/use-agency-branding.ts` - fetch, update, uploadLogo, removeLogo, refetch methods |

### Database Verification

- Migration `add_agency_branding_columns` applied: logo_url, primary_color, secondary_color, phone, branding_email, address, website
- Migration `create_branding_storage_bucket` applied: branding bucket with admin-only upload RLS

### Test Coverage

- `__tests__/hooks/use-agency-branding.test.ts` - 13 tests (all passing)
- `__tests__/components/settings/color-picker.test.tsx` - 11 tests (all passing)

### Code Quality

| Aspect | Assessment |
|--------|------------|
| Type Safety | Excellent - AgencyBranding interface properly typed |
| Error Handling | Good - toast notifications for all operations |
| Loading States | Good - Loader2 spinner used appropriately |
| React Best Practices | Fixed - useMemo for supabase client prevents re-renders |

### Issues Found & Resolved During Dev

1. **Infinite re-render bug** - `createClient()` in dependency array caused loop. Fixed with `useMemo`.
2. **Scroll issue** - Settings page couldn't scroll to Save button. Fixed with `h-full overflow-auto` wrapper.

### Recommendation

**APPROVED** - All ACs verified, tests passing, code quality good.
