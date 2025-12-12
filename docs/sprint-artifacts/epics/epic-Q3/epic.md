# Epic Q3: Client Data Capture

**Status:** Contexted
**FRs Covered:** FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR16, FR17, FR18 (12 FRs)
**Stories:** 3 (consolidated from original 6)
**Depends On:** Epic Q1 (database schema), Epic Q2 (session detail page)

---

## Overview

Epic Q3 delivers the "enter once" half of the Quoting Helper's core value proposition. Agents capture comprehensive client data through a structured, tab-based form interface with smart features: address autocomplete via Google Places API, VIN decode via NHTSA API for auto-populating vehicle details, and debounced auto-save that ensures no work is ever lost.

This epic transforms the tedious data entry process into a streamlined experience. Instead of re-typing the same information across multiple carrier portals, agents enter client details once in docuMINE, and Epic Q4 will format that data for each carrier's specific requirements.

## Objectives

- Enable structured capture of personal information, property details, vehicles, and drivers
- Implement auto-save that persists data on field blur with visual feedback
- Provide address autocomplete to speed up and improve accuracy of address entry
- Provide VIN decode to auto-populate vehicle year/make/model from VIN
- Validate inputs in real-time with helpful error messages
- Show tab completion indicators so agents know their progress

## Stories

| Story | Title | Description |
|-------|-------|-------------|
| Q3.1 | Data Capture Forms (Consolidated) | All form tabs: Client Info, Property, Auto (vehicles), Drivers with conditional visibility based on quote type. Includes address autocomplete and VIN decode integration. |
| Q3.2 | Auto-Save Implementation | Debounced auto-save on field blur with "Saving..."/"Saved" indicators, error handling with retry, and phone/date formatting |
| Q3.3 | Field Validation & Formatting | VIN format validation (17 chars, excludes I/O/Q), ZIP validation, email validation, inline error display, currency formatting |

**Note:** Stories Q3.1, Q3.3, Q3.4, Q3.5 from the original epics.md were consolidated into a single Q3.1 story since they all follow the same tab-based form pattern.

## Acceptance Summary

**Client Info Tab:**
- Personal fields: First Name, Last Name, DOB, Email, Phone, Mailing Address
- Phone auto-formats as (XXX) XXX-XXXX
- Address autocomplete from Google Places API

**Property Tab (Home/Bundle only):**
- "Same as Mailing" checkbox for property address
- Property details: Year Built, Sq Ft, Construction Type, Roof Type/Year
- Coverage preferences: Dwelling Coverage, Liability, Deductible
- Risk factors: Pool, Trampoline checkboxes

**Auto Tab (Auto/Bundle only):**
- Add/remove vehicles (max 6)
- VIN input with auto-decode for Year/Make/Model
- Coverage preferences: Bodily Injury, Property Damage, Comp/Collision Deductibles

**Drivers Tab (Auto/Bundle only):**
- Add/remove drivers (max 8)
- Driver fields: Name, DOB, License (masked), Years Licensed, Relationship, Accidents/Violations
- First driver defaults to "Self" relationship

**Auto-Save:**
- Saves on field blur (500ms debounce, 2s max wait)
- Visual "Saving..."/"Saved" indicator
- Non-blocking - user can continue editing

**Validation:**
- VIN: 17 characters, excludes I/O/Q
- ZIP: 5 digits or ZIP+4
- Inline errors on blur

## Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| Epic Q1 | Internal | Complete - provides quote_sessions table with client_data JSONB |
| Epic Q2 | Internal | Complete - provides quote session detail page with tab structure |
| Google Places API | External | Requires API key configuration |
| NHTSA vPIC API | External | Free, no key required |
| `use-debounce` | Package | Install if not present |
| `@react-google-maps/api` | Package | Install for Places integration |

## Related Documents

- [Tech Spec](./tech-spec.md) - Detailed technical specification
- [PRD](../../../features/quoting/prd.md) - Product requirements (FR6-18)
- [Architecture](../../../features/quoting/architecture.md) - Data models and patterns
- [UX Design](../../../features/quoting/ux-design.md) - Form layouts and interactions
