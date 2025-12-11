# Quoting Helper (Phase 3) - Epic Breakdown

**Author:** Sam
**Date:** 2025-12-10
**Project Level:** Feature Module
**Target Scale:** MVP - 2 carriers (Progressive, Travelers)

---

## Overview

This document provides the complete epic and story breakdown for Quoting Helper Phase 3, decomposing the 42 functional requirements from the [PRD](./prd.md) into implementable stories.

**Living Document Notice:** This is the initial version incorporating PRD, UX Design, and Architecture context.

---

## Epic Summary

| Epic | Title | User Value | Stories | FRs Covered |
|------|-------|------------|---------|-------------|
| Q1 | Foundation & Navigation | Access quoting from docuMINE | 3 | FR39-42 |
| Q2 | Quote Session Management | Create, view, manage quote sessions | 5 | FR1-6, FR15 |
| Q3 | Client Data Capture | Enter client info with smart forms | 6 | FR7-18 |
| Q4 | Carrier Copy System | Copy formatted data to clipboard | 4 | FR19-24, FR35-36 |
| Q5 | Quote Results & Comparison | Enter results, generate comparison | 5 | FR25-34, FR37-38 |

**Total:** 5 Epics, 23 Stories

---

## Functional Requirements Inventory

### Quote Session Management (FR1-6)
- **FR1:** Users can create a new quote session for a prospect
- **FR2:** Users can save quote sessions and resume them later
- **FR3:** Users can view a list of their quote sessions with status indicators
- **FR4:** Users can delete quote sessions they no longer need
- **FR5:** Users can duplicate an existing quote session as a starting point
- **FR6:** System auto-saves quote session data as users enter information

### Client Data Capture (FR7-18)
- **FR7:** Users can enter prospect personal information (name, DOB, contact)
- **FR8:** Users can enter property information (address, construction, year built)
- **FR9:** Users can enter property coverage preferences (dwelling, liability, deductibles)
- **FR10:** Users can enter vehicle information (year, make, model, VIN)
- **FR11:** Users can add multiple vehicles to a quote session
- **FR12:** Users can enter driver information (name, DOB, license, history)
- **FR13:** Users can add multiple drivers to a quote session
- **FR14:** Users can enter auto coverage preferences (liability, comp, collision)
- **FR15:** Users can select quote type (Home only, Auto only, Bundle)
- **FR16:** System validates VIN format and provides feedback
- **FR17:** System standardizes and validates addresses
- **FR18:** System auto-formats phone numbers and dates

### Carrier Output Generation (FR19-24)
- **FR19:** Users can copy client data formatted for Progressive to clipboard
- **FR20:** Users can copy client data formatted for Travelers to clipboard
- **FR21:** Users can open carrier agent portals in new browser tab
- **FR22:** System displays visual confirmation when data is copied
- **FR23:** Users can preview formatted data before copying
- **FR24:** System formats data appropriately for each carrier's portal

### Quote Result Entry (FR25-29)
- **FR25:** Users can enter quote results (premium, coverages, deductibles)
- **FR26:** Users can attach PDF quote documents to a quote result
- **FR27:** Users can edit previously entered quote results
- **FR28:** Users can mark a carrier as "declined" or "not competitive"
- **FR29:** System displays entered quotes in a summary view

### Comparison Document Generation (FR30-34)
- **FR30:** Users can generate comparison doc when 2+ quotes entered
- **FR31:** System creates comparison using existing docuMINE infrastructure
- **FR32:** Users can customize which coverages appear in comparison
- **FR33:** Users can export comparison document as PDF
- **FR34:** Users can share comparison document link with prospects

### Carrier Management (FR35-38)
- **FR35:** System displays list of supported carriers with status
- **FR36:** Users can select which carriers to include in a quote session
- **FR37:** Users can set preferred/default carriers in their profile
- **FR38:** System tracks which carriers user has portal access to

### Navigation & Integration (FR39-42)
- **FR39:** Quoting feature is accessible from main docuMINE navigation
- **FR40:** Users can access quoting from the docuMINE dashboard
- **FR41:** Quote sessions are associated with the user's account
- **FR42:** System integrates with existing docuMINE authentication

---

## FR Coverage Map

| FR | Epic | Story |
|----|------|-------|
| FR1 | Q2 | Q2.2 |
| FR2 | Q2 | Q2.3 |
| FR3 | Q2 | Q2.4 |
| FR4 | Q2 | Q2.5 |
| FR5 | Q2 | Q2.5 |
| FR6 | Q3 | Q3.2 |
| FR7 | Q3 | Q3.1 |
| FR8 | Q3 | Q3.3 |
| FR9 | Q3 | Q3.3 |
| FR10 | Q3 | Q3.4 |
| FR11 | Q3 | Q3.4 |
| FR12 | Q3 | Q3.5 |
| FR13 | Q3 | Q3.5 |
| FR14 | Q3 | Q3.4 |
| FR15 | Q2 | Q2.2 |
| FR16 | Q3 | Q3.6 |
| FR17 | Q3 | Q3.6 |
| FR18 | Q3 | Q3.2 |
| FR19 | Q4 | Q4.2 |
| FR20 | Q4 | Q4.2 |
| FR21 | Q4 | Q4.3 |
| FR22 | Q4 | Q4.1 |
| FR23 | Q4 | Q4.4 |
| FR24 | Q4 | Q4.2 |
| FR25 | Q5 | Q5.1 |
| FR26 | Q5 | Q5.1 |
| FR27 | Q5 | Q5.1 |
| FR28 | Q5 | Q5.1 |
| FR29 | Q5 | Q5.2 |
| FR30 | Q5 | Q5.3 |
| FR31 | Q5 | Q5.3 |
| FR32 | Q5 | Q5.4 |
| FR33 | Q5 | Q5.4 |
| FR34 | Q5 | Q5.4 |
| FR35 | Q4 | Q4.3 |
| FR36 | Q4 | Q4.3 |
| FR37 | Q5 | Q5.5 |
| FR38 | Q5 | Q5.5 |
| FR39 | Q1 | Q1.2 |
| FR40 | Q1 | Q1.3 |
| FR41 | Q1 | Q1.1 |
| FR42 | Q1 | Q1.1 |

---

## Epic Q1: Foundation & Navigation

**Goal:** Enable users to access the Quoting feature from within docuMINE with proper authentication and navigation integration.

**User Value:** Agents can navigate to quoting seamlessly from their existing docuMINE workflow.

**FRs Covered:** FR39, FR40, FR41, FR42

---

### Story Q1.1: Database Schema & RLS Setup

As an **insurance agent**,
I want **my quote sessions to be securely stored and isolated to my agency**,
So that **my client data is protected and only I can access my quotes**.

**Acceptance Criteria:**

**Given** the database migration is applied
**When** a user creates a quote session
**Then** the session is automatically scoped to their agency via RLS

**And** the `quote_sessions` table exists with columns: id, agency_id, user_id, prospect_name, quote_type, status, client_data (JSONB), created_at, updated_at
**And** the `quote_results` table exists with columns: id, session_id, agency_id, carrier_code, carrier_name, premium_annual, premium_monthly, deductible_home, deductible_auto, coverages (JSONB), status, document_storage_path, created_at, updated_at
**And** RLS policies enforce agency-scoped access on both tables
**And** indexes exist on agency_id, user_id, and session_id columns

**Prerequisites:** None (foundation story)

**Technical Notes:**
- Create Supabase migration: `supabase/migrations/TIMESTAMP_add_quoting_tables.sql`
- Follow existing RLS pattern from `documents` table
- Use `gen_random_uuid()` for primary keys
- JSONB columns for flexible schema (client_data, coverages)
- Reference Architecture doc section "Data Architecture"

---

### Story Q1.2: Sidebar Navigation Integration

As an **insurance agent**,
I want **to see "Quoting" in the docuMINE sidebar navigation**,
So that **I can easily access the quoting feature from anywhere in the app**.

**Acceptance Criteria:**

**Given** the user is logged into docuMINE
**When** they view the sidebar navigation
**Then** a "Quoting" menu item appears below existing navigation items

**And** the Quoting icon is consistent with docuMINE's icon style (Lucide icons)
**And** clicking "Quoting" navigates to `/quoting`
**And** the active state is highlighted when on any `/quoting/*` route
**And** the navigation item uses Electric Blue accent color when active

**Prerequisites:** Q1.1

**Technical Notes:**
- Update `src/components/layout/sidebar.tsx`
- Add route to existing navigation array
- Use `ClipboardList` or similar Lucide icon
- Follow existing active route detection pattern

---

### Story Q1.3: Dashboard Quick Access Card

As an **insurance agent**,
I want **to see a Quoting quick access card on my dashboard**,
So that **I can quickly start a new quote from my home screen**.

**Acceptance Criteria:**

**Given** the user is on the docuMINE dashboard
**When** the dashboard loads
**Then** a "Quoting" card appears showing:
  - Title: "Quoting"
  - Subtitle: "Enter once, use everywhere"
  - Count of active quote sessions (draft + in_progress)
  - "New Quote" and "View All" action buttons

**And** clicking "New Quote" opens the new quote modal/flow
**And** clicking "View All" navigates to `/quoting`
**And** the card matches existing dashboard card styling

**Prerequisites:** Q1.1, Q1.2

**Technical Notes:**
- Add card component to dashboard page
- Query quote_sessions count for current user
- Reuse existing dashboard card component pattern

---

## Epic Q2: Quote Session Management

**Goal:** Enable users to create, view, and manage quote sessions for prospects.

**User Value:** Agents can start quotes, return to incomplete sessions, and organize their quoting workflow.

**FRs Covered:** FR1, FR2, FR3, FR4, FR5, FR15

---

### Story Q2.1: Quote Sessions List Page

As an **insurance agent**,
I want **to see a list of all my quote sessions**,
So that **I can quickly find and resume work on any quote**.

**Acceptance Criteria:**

**Given** the user navigates to `/quoting`
**When** the page loads
**Then** a list of quote sessions displays with:
  - Prospect name (title)
  - Quote type badge (Home / Auto / Bundle)
  - Status indicator (Draft / In Progress / Quotes Received / Complete)
  - Created date
  - Carrier count ("3 carriers quoted")
  - Action menu (⋮ with Edit, Duplicate, Delete)

**And** sessions are sorted by most recently updated first
**And** clicking a session card navigates to `/quoting/[id]`
**And** the "New Quote" button is prominent in the page header
**And** empty state shows: "No quotes yet. Start your first quote to save time on carrier portals." with "New Quote" CTA

**Prerequisites:** Q1.1, Q1.2

**Technical Notes:**
- Create `src/app/(dashboard)/quoting/page.tsx`
- Create `src/components/quoting/quote-session-card.tsx`
- Use existing Card component from shadcn/ui
- Reference UX Design section 9.1 for layout
- Fetch sessions via `/api/quoting` endpoint

---

### Story Q2.2: Create New Quote Session

As an **insurance agent**,
I want **to create a new quote session for a prospect**,
So that **I can start entering their information**.

**Acceptance Criteria:**

**Given** the user clicks "New Quote"
**When** the create modal/dialog opens
**Then** the user can enter:
  - Prospect name (required, text input)
  - Quote type selection (Home / Auto / Bundle radio buttons)

**And** "Bundle" is selected by default
**And** clicking "Create Quote" creates the session and navigates to `/quoting/[id]`
**And** clicking "Cancel" closes the modal without creating
**And** the prospect name field is auto-focused
**And** form validates that prospect name is not empty

**Prerequisites:** Q2.1

**Technical Notes:**
- Create `src/components/quoting/new-quote-dialog.tsx`
- Use Dialog component from shadcn/ui
- POST to `/api/quoting` endpoint
- Create API route: `src/app/api/quoting/route.ts`
- Return created session with redirect

---

### Story Q2.3: Quote Session Detail Page Structure

As an **insurance agent**,
I want **to view and edit a quote session with organized tabs**,
So that **I can enter all client information in a logical flow**.

**Acceptance Criteria:**

**Given** the user navigates to `/quoting/[id]`
**When** the page loads
**Then** the page displays:
  - Back link: "← Back to Quotes"
  - Header: Prospect name + Quote type badge
  - Tab navigation: Client Info | Property | Auto | Drivers | Carriers | Results
  - Active tab content area
  - Session status in header

**And** tabs show completion indicators:
  - ✓ checkmark when section is complete
  - Count for multi-item sections (e.g., "2 vehicles", "2 drivers")
**And** Property tab is hidden for Auto-only quotes
**And** Auto/Drivers tabs are hidden for Home-only quotes
**And** the Client Info tab is active by default

**Prerequisites:** Q2.2

**Technical Notes:**
- Create `src/app/(dashboard)/quoting/[id]/page.tsx`
- Use Tabs component from shadcn/ui
- Conditional tab rendering based on quote_type
- Create tab content components (placeholder for now)
- Reference UX Design section 9.2 for layout

---

### Story Q2.4: Quote Session Status Management

As an **insurance agent**,
I want **the system to automatically update quote session status**,
So that **I can see the progress of each quote at a glance**.

**Acceptance Criteria:**

**Given** a quote session exists
**When** the session state changes
**Then** status automatically updates:
  - "Draft" - Created but no client data entered
  - "In Progress" - Some client data entered
  - "Quotes Received" - At least one quote result entered
  - "Complete" - Comparison document generated

**And** status badge color reflects state:
  - Draft: Gray
  - In Progress: Yellow/Amber
  - Quotes Received: Blue
  - Complete: Green

**Prerequisites:** Q2.3

**Technical Notes:**
- Status calculation in API or client-side
- Add status badge component
- Update on relevant mutations (save, quote entry, comparison)

---

### Story Q2.5: Delete and Duplicate Quote Sessions

As an **insurance agent**,
I want **to delete unwanted quote sessions and duplicate existing ones**,
So that **I can manage my quotes efficiently and save time on similar prospects**.

**Acceptance Criteria:**

**Given** the user clicks the action menu on a quote session
**When** they select "Delete"
**Then** a confirmation dialog appears: "Delete this quote session? This cannot be undone."
**And** confirming deletes the session and all associated quote results
**And** canceling returns to the list

**Given** the user clicks the action menu on a quote session
**When** they select "Duplicate"
**Then** a new session is created with:
  - Prospect name: "[Original Name] (Copy)"
  - Same quote type
  - All client data copied
  - No quote results copied
  - Status: "Draft"
**And** user is navigated to the new session

**Prerequisites:** Q2.1

**Technical Notes:**
- Add AlertDialog for delete confirmation
- DELETE `/api/quoting/[id]` endpoint
- POST `/api/quoting/[id]/duplicate` endpoint
- Use database cascade delete for quote_results

---

## Epic Q3: Client Data Capture

**Goal:** Enable users to enter comprehensive client information with smart forms, validation, and auto-save.

**User Value:** Agents enter client data once in a structured, validated form that auto-saves their work.

**FRs Covered:** FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR16, FR17, FR18

---

### Story Q3.1: Client Info Tab - Personal Information

As an **insurance agent**,
I want **to enter prospect personal information**,
So that **I can capture the basic client details needed for quoting**.

**Acceptance Criteria:**

**Given** the user is on the Client Info tab
**When** the form loads
**Then** the following fields are displayed:
  - First Name (required)
  - Last Name (required)
  - Date of Birth (required, date picker)
  - Email (required, email format validation)
  - Phone (required, auto-formatted as (XXX) XXX-XXXX)
  - Mailing Address (street, city, state dropdown, ZIP)

**And** required fields are marked with red asterisk (*)
**And** validation errors appear inline below fields on blur
**And** state dropdown contains all US states
**And** phone number auto-formats as user types

**Prerequisites:** Q2.3

**Technical Notes:**
- Create `src/components/quoting/client-info-tab.tsx`
- Use react-hook-form with zod validation
- Phone formatting: strip non-digits, format (XXX) XXX-XXXX
- Date picker from shadcn/ui Calendar component
- Follow form field patterns from existing docuMINE forms

---

### Story Q3.2: Auto-Save Implementation

As an **insurance agent**,
I want **my quote data to automatically save as I enter it**,
So that **I never lose work and can resume anytime**.

**Acceptance Criteria:**

**Given** the user is entering data in any form field
**When** the field loses focus (blur event)
**Then** the changed data is saved automatically within 500ms

**And** a subtle "Saving..." indicator appears during save
**And** the indicator changes to "Saved" on success (auto-dismiss after 2s)
**And** if save fails, a toast error appears with retry option
**And** save is non-blocking - user can continue typing in other fields
**And** rapid changes are debounced (500ms delay, 2s max wait)

**Prerequisites:** Q3.1

**Technical Notes:**
- Create `src/hooks/quoting/use-auto-save.ts`
- Use debounce from 'use-debounce' package
- PATCH `/api/quoting/[id]/client-data` endpoint
- Reference Architecture doc "Auto-Save Pattern"
- Optimistic UI - show "Saved" before server confirms

---

### Story Q3.3: Property Tab - Home Information

As an **insurance agent**,
I want **to enter property information for home quotes**,
So that **I can capture the details needed for homeowners insurance**.

**Acceptance Criteria:**

**Given** the user is on the Property tab (visible for Home/Bundle quotes)
**When** the form loads
**Then** the following fields are displayed:

**Property Address Section:**
- Same as Mailing checkbox (auto-copies address)
- Street, City, State, ZIP (with address validation)

**Property Details Section:**
- Year Built (number, 1800-current year)
- Square Footage (number, min 100)
- Construction Type (dropdown: Frame, Masonry, Superior)
- Roof Type (dropdown: Asphalt, Tile, Metal, Slate, Other)
- Roof Year (number, year built - current year)

**Coverage Preferences Section:**
- Dwelling Coverage (currency input, $50,000 - $5,000,000)
- Liability Coverage (dropdown: $100K, $300K, $500K, $1M)
- Deductible (dropdown: $500, $1,000, $2,500, $5,000)

**Risk Factors Section (optional):**
- Has Pool (checkbox)
- Has Trampoline (checkbox)

**And** currency inputs are formatted with $ and commas
**And** "Same as Mailing" checkbox copies address when checked
**And** form auto-saves on field blur

**Prerequisites:** Q3.2

**Technical Notes:**
- Create `src/components/quoting/property-tab.tsx`
- Currency formatting helper function
- Address copy logic when checkbox toggled
- Store in client_data.property JSONB path

---

### Story Q3.4: Auto Tab - Vehicles

As an **insurance agent**,
I want **to add vehicles to the quote session**,
So that **I can capture auto insurance details for all household vehicles**.

**Acceptance Criteria:**

**Given** the user is on the Auto tab (visible for Auto/Bundle quotes)
**When** the form loads
**Then** a vehicle list section displays with "Add Vehicle" button

**Given** the user clicks "Add Vehicle"
**When** the vehicle form appears
**Then** the following fields are displayed:
  - Year (dropdown: 1990 - current year + 1)
  - Make (text input with common suggestions)
  - Model (text input)
  - VIN (text input, 17 characters, uppercase auto-format)
  - Usage (dropdown: Commute, Pleasure, Business)
  - Annual Mileage (number input)

**And** each vehicle card shows: "2024 Toyota Camry" with Edit/Remove actions
**And** VIN field shows validation status (✓ valid, ⚠ invalid format)
**And** removing a vehicle shows inline confirmation or undo toast
**And** maximum 6 vehicles per session

**Coverage Preferences Section (once per quote, not per vehicle):**
- Bodily Injury Liability (dropdown: 50/100, 100/300, 250/500)
- Property Damage Liability (dropdown: $50K, $100K, $250K)
- Comprehensive Deductible (dropdown: $250, $500, $1,000)
- Collision Deductible (dropdown: $250, $500, $1,000)
- Uninsured Motorist (checkbox)

**Prerequisites:** Q3.2

**Technical Notes:**
- Create `src/components/quoting/auto-tab.tsx`
- Create `src/components/quoting/vehicle-card.tsx`
- VIN validation: 17 chars, alphanumeric except I, O, Q
- Store vehicles in client_data.auto.vehicles array
- Generate unique ID for each vehicle (uuid)

---

### Story Q3.5: Drivers Tab

As an **insurance agent**,
I want **to add drivers to the quote session**,
So that **I can capture information for all household drivers**.

**Acceptance Criteria:**

**Given** the user is on the Drivers tab (visible for Auto/Bundle quotes)
**When** the form loads
**Then** a driver list section displays with "Add Driver" button

**Given** the user clicks "Add Driver"
**When** the driver form appears
**Then** the following fields are displayed:
  - First Name (required)
  - Last Name (required)
  - Date of Birth (required, date picker)
  - License Number (required, will be encrypted)
  - License State (dropdown: US states)
  - Years Licensed (number: 0-70)
  - Relationship (dropdown: Self, Spouse, Child, Other)
  - Accidents (past 5 years) (number: 0-10)
  - Violations (past 5 years) (number: 0-10)

**And** each driver card shows: "John Smith (Self) - 15 years licensed"
**And** first driver defaults to "Self" relationship
**And** removing a driver shows confirmation
**And** maximum 8 drivers per session
**And** License number field shows masked after entry (••••••1234)

**Prerequisites:** Q3.2

**Technical Notes:**
- Create `src/components/quoting/drivers-tab.tsx`
- Create `src/components/quoting/driver-card.tsx`
- Store drivers in client_data.auto.drivers array
- License number encryption at rest (future - mask in UI for now)
- Sensitive field handling per Architecture doc

---

### Story Q3.6: Field Validation & Formatting

As an **insurance agent**,
I want **my inputs to be validated and formatted automatically**,
So that **I enter accurate data without manual formatting**.

**Acceptance Criteria:**

**VIN Validation (FR16):**
**Given** the user enters a VIN
**When** the VIN is 17 characters
**Then** the system validates the format (no I, O, Q characters)
**And** shows ✓ for valid format, ⚠ for invalid

**Address Validation (FR17):**
**Given** the user enters an address
**When** the ZIP code is entered
**Then** the system validates ZIP format (5 digits or ZIP+4)
**And** auto-suggests city/state based on ZIP (if API available)

**Phone Formatting (FR18):**
**Given** the user types a phone number
**When** digits are entered
**Then** the system auto-formats as (XXX) XXX-XXXX

**Date Formatting:**
**Given** the user selects a date
**When** the date picker closes
**Then** the date displays in MM/DD/YYYY format

**Currency Formatting:**
**Given** the user enters a currency amount
**When** the field loses focus
**Then** the value displays with $ prefix and thousands commas

**Prerequisites:** Q3.1

**Technical Notes:**
- Create `src/lib/quoting/validation.ts`
- VIN check digit validation (optional enhancement)
- Consider address autocomplete API integration (future)
- Use input masking library or custom handlers

---

## Epic Q4: Carrier Copy System

**Goal:** Enable users to copy client data formatted for specific carriers and access carrier portals.

**User Value:** Agents click "Copy for Progressive" and get perfectly formatted data ready to paste into the carrier portal.

**FRs Covered:** FR19, FR20, FR21, FR22, FR23, FR24, FR35, FR36

---

### Story Q4.1: Copy Button Component with Feedback

As an **insurance agent**,
I want **to click a copy button and see clear confirmation**,
So that **I know my data was successfully copied to clipboard**.

**Acceptance Criteria:**

**Given** the user clicks "Copy for [Carrier]"
**When** the copy succeeds
**Then** the button transforms:
  - Text changes from "Copy Data" to "Copied ✓"
  - Background changes to success green tint
  - Checkmark icon appears
  - Button stays in "Copied" state for 2 seconds
  - Then resets to default state

**And** screen readers announce "Copied to clipboard" (aria-live)
**And** if copy fails, button shows "Failed - Click to retry"
**And** copy works via keyboard (Enter/Space)

**Prerequisites:** Q3.1

**Technical Notes:**
- Create `src/components/quoting/copy-button.tsx`
- Create `src/hooks/quoting/use-clipboard-copy.ts`
- Use Clipboard API with fallback (see Architecture doc)
- Reference UX Design section 6.1.4 for component spec

---

### Story Q4.2: Carrier Format Functions (Progressive & Travelers)

As an **insurance agent**,
I want **my client data formatted specifically for each carrier's portal**,
So that **I can paste the data efficiently without reformatting**.

**Acceptance Criteria:**

**Given** client data is entered
**When** the user requests formatted data for Progressive
**Then** the clipboard contains:
  - Personal info in Progressive's expected format
  - Property details (if applicable) formatted for Progressive
  - Vehicle/driver info (if applicable) formatted for Progressive
  - Tab-delimited where appropriate for form paste

**Given** client data is entered
**When** the user requests formatted data for Travelers
**Then** the clipboard contains data formatted for Travelers' portal format

**And** dates are formatted consistently (MM/DD/YYYY)
**And** phone numbers are formatted consistently
**And** blank/missing fields are handled gracefully

**Prerequisites:** Q4.1

**Technical Notes:**
- Create `src/lib/quoting/carriers/progressive.ts`
- Create `src/lib/quoting/carriers/travelers.ts`
- Create `src/lib/quoting/carriers/types.ts`
- Create `src/lib/quoting/carriers/index.ts` (registry)
- Follow CarrierFormatter interface from Architecture doc
- GET `/api/quoting/[id]/format/[carrier]` endpoint

---

### Story Q4.3: Carriers Tab with Action Rows

As an **insurance agent**,
I want **to see all supported carriers with copy and portal actions**,
So that **I can quickly copy data and open portals for each carrier I want to quote**.

**Acceptance Criteria:**

**Given** the user is on the Carriers tab
**When** the tab loads
**Then** a list of carriers displays, each row showing:
  - Carrier logo (24x24)
  - Carrier name
  - Status badge: "Not Started" | "Copied" | "Quote Entered"
  - "Copy Data" button (primary style)
  - "Open Portal" button (ghost style, external link icon)

**And** Progressive and Travelers are shown for MVP
**And** clicking "Open Portal" opens carrier URL in new tab
**And** status updates to "Copied" when data is copied
**And** status updates to "Quote Entered" when result is saved

**Prerequisites:** Q4.1, Q4.2

**Technical Notes:**
- Create `src/components/quoting/carriers-tab.tsx`
- Create `src/components/quoting/carrier-action-row.tsx`
- Store carrier logos in `/public/carriers/`
- Carrier list from registry (getSupportedCarriers)
- Track copy status in local state or session storage

---

### Story Q4.4: Data Preview Before Copy

As an **insurance agent**,
I want **to preview the formatted data before copying**,
So that **I can verify the information is correct**.

**Acceptance Criteria:**

**Given** the user is on the Carriers tab
**When** they click a "Preview" button/link for a carrier
**Then** a modal/popover displays the formatted data:
  - Organized by section (Personal, Property, Auto)
  - Field names and values clearly shown
  - "Copy" button at the bottom of preview
  - "Close" button to dismiss

**And** preview shows validation warnings if data is incomplete
**And** missing required fields are highlighted

**Prerequisites:** Q4.2

**Technical Notes:**
- Add preview action to CarrierActionRow
- Use FormattedPreview type from carrier formatter
- Sheet or Dialog for preview display
- Show validation result with missing fields

---

## Epic Q5: Quote Results & Comparison

**Goal:** Enable users to enter quote results from carriers and generate comparison documents.

**User Value:** Agents record quotes received, compare them side-by-side, and generate client-ready comparison documents.

**FRs Covered:** FR25, FR26, FR27, FR28, FR29, FR30, FR31, FR32, FR33, FR34, FR37, FR38

---

### Story Q5.1: Quote Result Entry Form

As an **insurance agent**,
I want **to enter quote results received from a carrier**,
So that **I can record and compare quotes**.

**Acceptance Criteria:**

**Given** the user clicks "Enter Quote" for a carrier
**When** the form opens (modal or inline expansion)
**Then** the following fields are displayed:
  - Premium - Annual (required, currency)
  - Premium - Monthly (optional, currency, auto-calculated from annual ÷ 12)
  - Home Deductible (if applicable, currency)
  - Auto Deductible (if applicable, currency)
  - Status (dropdown: Quoted, Declined, Not Competitive)
  - Attach Quote PDF (file upload, optional)

**And** saving the quote updates the carrier row status to "Quote Entered"
**And** the quote summary displays inline: "$1,234/yr | $1,000 deductible"
**And** "Edit Quote" link allows modifying previously entered quotes

**Prerequisites:** Q4.3

**Technical Notes:**
- Create `src/components/quoting/quote-result-form.tsx`
- POST/PATCH `/api/quoting/[id]/quotes` endpoints
- File upload to existing documents storage bucket
- Store in quote_results table

---

### Story Q5.2: Results Tab - Quote Summary View

As an **insurance agent**,
I want **to see all entered quotes in a summary view**,
So that **I can quickly compare results across carriers**.

**Acceptance Criteria:**

**Given** the user is on the Results tab
**When** the tab loads
**Then** a summary table/cards display all entered quotes:
  - Carrier name and logo
  - Annual premium (highlighted)
  - Monthly premium
  - Deductibles
  - Status badge
  - "Edit" and "Remove" actions

**And** quotes are sorted by premium (lowest first)
**And** premium differences are highlighted (e.g., "$200 more than lowest")
**And** empty state: "Get quotes from carriers, then enter results here."

**Prerequisites:** Q5.1

**Technical Notes:**
- Create `src/components/quoting/results-tab.tsx`
- Fetch quote results via API
- Calculate and display premium comparisons
- Use Table component for comparison view

---

### Story Q5.3: Generate Comparison Document

As an **insurance agent**,
I want **to generate a comparison document from entered quotes**,
So that **I can send a professional comparison to my client**.

**Acceptance Criteria:**

**Given** the user has entered 2+ quotes
**When** they click "Generate Comparison"
**Then** the existing docuMINE comparison engine generates a document showing:
  - Side-by-side carrier comparison
  - Premium comparison
  - Coverage comparison
  - Deductible comparison

**And** the button is disabled until 2+ quotes are entered
**And** button shows count: "Generate Comparison (3 quotes)"
**And** generation completes within 3 seconds
**And** result opens in comparison viewer

**Prerequisites:** Q5.2

**Technical Notes:**
- Create `src/lib/quoting/comparison-adapter.ts`
- POST `/api/quoting/[id]/comparison` endpoint
- Use adaptQuoteResultsToComparison function
- Integrate with existing comparison infrastructure

---

### Story Q5.4: Comparison Export & Sharing

As an **insurance agent**,
I want **to export the comparison as PDF and share with prospects**,
So that **I can deliver a professional comparison document**.

**Acceptance Criteria:**

**Given** a comparison document is generated
**When** the user clicks "Export PDF"
**Then** a PDF downloads with the comparison content

**Given** a comparison document is generated
**When** the user clicks "Share Link"
**Then** a shareable link is copied to clipboard
**And** toast confirms: "Link copied! Share this with your client."

**And** the user can customize which coverages appear before generating
**And** shared link is accessible without authentication (public view)

**Prerequisites:** Q5.3

**Technical Notes:**
- Leverage existing PDF export functionality
- Leverage existing comparison sharing infrastructure
- Add coverage selection before generation (checkboxes)

---

### Story Q5.5: User Carrier Preferences

As an **insurance agent**,
I want **to set my preferred carriers and track portal access**,
So that **the most relevant carriers appear first**.

**Acceptance Criteria:**

**Given** the user accesses carrier settings (via profile or Carriers tab)
**When** they view their carrier preferences
**Then** they can:
  - Mark carriers as "preferred" (appear first in list)
  - Indicate which carriers they have portal access to
  - Save preferences to their profile

**And** preferred carriers appear at top of Carriers tab
**And** carriers without portal access show "No Access" indicator
**And** preferences persist across sessions

**Prerequisites:** Q4.3

**Technical Notes:**
- Store preferences in user_preferences JSONB or separate table
- Add preferences UI to Settings page or inline in Carriers tab
- Filter/sort carriers based on preferences

---

## FR Coverage Matrix

| FR | Description | Epic | Story | Status |
|----|-------------|------|-------|--------|
| FR1 | Create new quote session | Q2 | Q2.2 | ✅ |
| FR2 | Save and resume sessions | Q2 | Q2.3 | ✅ |
| FR3 | View session list with status | Q2 | Q2.1, Q2.4 | ✅ |
| FR4 | Delete quote sessions | Q2 | Q2.5 | ✅ |
| FR5 | Duplicate quote sessions | Q2 | Q2.5 | ✅ |
| FR6 | Auto-save session data | Q3 | Q3.2 | ✅ |
| FR7 | Enter personal information | Q3 | Q3.1 | ✅ |
| FR8 | Enter property information | Q3 | Q3.3 | ✅ |
| FR9 | Enter property coverage preferences | Q3 | Q3.3 | ✅ |
| FR10 | Enter vehicle information | Q3 | Q3.4 | ✅ |
| FR11 | Add multiple vehicles | Q3 | Q3.4 | ✅ |
| FR12 | Enter driver information | Q3 | Q3.5 | ✅ |
| FR13 | Add multiple drivers | Q3 | Q3.5 | ✅ |
| FR14 | Enter auto coverage preferences | Q3 | Q3.4 | ✅ |
| FR15 | Select quote type | Q2 | Q2.2 | ✅ |
| FR16 | VIN validation | Q3 | Q3.6 | ✅ |
| FR17 | Address validation | Q3 | Q3.6 | ✅ |
| FR18 | Auto-format phone/dates | Q3 | Q3.2, Q3.6 | ✅ |
| FR19 | Copy for Progressive | Q4 | Q4.2 | ✅ |
| FR20 | Copy for Travelers | Q4 | Q4.2 | ✅ |
| FR21 | Open carrier portals | Q4 | Q4.3 | ✅ |
| FR22 | Visual copy confirmation | Q4 | Q4.1 | ✅ |
| FR23 | Preview formatted data | Q4 | Q4.4 | ✅ |
| FR24 | Carrier-specific formatting | Q4 | Q4.2 | ✅ |
| FR25 | Enter quote results | Q5 | Q5.1 | ✅ |
| FR26 | Attach PDF quotes | Q5 | Q5.1 | ✅ |
| FR27 | Edit quote results | Q5 | Q5.1 | ✅ |
| FR28 | Mark carrier declined | Q5 | Q5.1 | ✅ |
| FR29 | Quote summary view | Q5 | Q5.2 | ✅ |
| FR30 | Generate comparison | Q5 | Q5.3 | ✅ |
| FR31 | Use existing comparison engine | Q5 | Q5.3 | ✅ |
| FR32 | Customize comparison coverages | Q5 | Q5.4 | ✅ |
| FR33 | Export comparison PDF | Q5 | Q5.4 | ✅ |
| FR34 | Share comparison link | Q5 | Q5.4 | ✅ |
| FR35 | Display supported carriers | Q4 | Q4.3 | ✅ |
| FR36 | Select carriers for session | Q4 | Q4.3 | ✅ |
| FR37 | Set preferred carriers | Q5 | Q5.5 | ✅ |
| FR38 | Track carrier portal access | Q5 | Q5.5 | ✅ |
| FR39 | Sidebar navigation | Q1 | Q1.2 | ✅ |
| FR40 | Dashboard access | Q1 | Q1.3 | ✅ |
| FR41 | User account association | Q1 | Q1.1 | ✅ |
| FR42 | Auth integration | Q1 | Q1.1 | ✅ |

**Coverage:** 42/42 FRs mapped (100%)

---

## Summary

**Epic Breakdown Complete!**

| Epic | Stories | User Value |
|------|---------|------------|
| Q1: Foundation & Navigation | 3 | Access quoting from docuMINE |
| Q2: Quote Session Management | 5 | Create and manage quote sessions |
| Q3: Client Data Capture | 6 | Enter client info with smart forms |
| Q4: Carrier Copy System | 4 | Copy formatted data for carriers |
| Q5: Quote Results & Comparison | 5 | Record quotes and generate comparisons |

**Total:** 5 Epics, 23 Stories covering all 42 FRs

**Context Incorporated:**
- ✅ PRD requirements (42 FRs)
- ✅ UX interaction patterns and mockup references
- ✅ Architecture technical decisions and data models

**Ready for:** Phase 4 Implementation - Use `create-story` workflow to generate individual story implementation plans.

---

_Generated by BMad Method - Create Epics & Stories Workflow_
_Date: 2025-12-10_
_For: Sam_
