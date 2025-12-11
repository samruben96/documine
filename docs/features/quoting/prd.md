# Quoting Helper (Phase 3) - Product Requirements Document

**Author:** Sam
**Date:** 2025-12-10
**Version:** 1.0

---

## Executive Summary

Quoting Helper transforms the most time-consuming task for independent insurance agents - portal hopping across multiple carrier websites - into a streamlined "enter once, use everywhere" workflow. Instead of re-typing the same client information into 2-20 different carrier portals, agents capture client data once in docuMINE and get carrier-formatted clipboard output ready to paste into any portal.

This is Phase 3 of docuMINE's quoting roadmap: a zero-friction entry point that delivers immediate time savings without requiring browser extensions or automation. It validates the workflow, teaches docuMINE carrier data formats, and builds user trust before Phase 4's AI-powered automation.

### What Makes This Special

**"Enter once, use everywhere."**

The magic moment: An agent enters client data ONE time, then with a single click gets carrier-formatted data ready to paste into Progressive, Travelers, or any portal. No re-typing, no copy-paste errors, no hunting for which field goes where.

This simple premise creates compound value:
- **Time savings multiply** with each carrier quoted (2-20 per prospect)
- **Error reduction** from eliminating manual re-entry
- **Data foundation** for Phase 4 AI automation
- **Comparison doc generation** ties back to docuMINE's core strength

---

## Project Classification

**Technical Type:** Web App (Feature Module)
**Domain:** InsureTech
**Complexity:** Medium (Phase 3 only - no automation or credential handling)

This is a **feature module** within the existing docuMINE web application, not a standalone product. It shares:
- Authentication and user management
- Navigation and layout components
- Database infrastructure (Supabase)
- Deployment pipeline (Vercel)

**Phase 3 Scope Boundary:** Clipboard-based helper only. No browser automation, no credential storage, no direct carrier API integration. These capabilities are deferred to Phase 4.

---

## Success Criteria

### Primary Success Metrics

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| **Time per quote session** | 50% reduction vs. manual | Core value proposition - if we don't save time, we've failed |
| **Adoption rate** | 30% of active docuMINE users try quoting within 30 days | Feature discovery and interest |
| **Repeat usage** | 60% of users who try it use it again within 7 days | Proves actual value delivered |
| **Carriers used per session** | Average 3+ | Validates "enter once, use everywhere" multiplier |

### Secondary Success Metrics

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| **Quote-to-comparison conversion** | 40% of quote sessions generate comparison doc | Integration with core docuMINE strength |
| **Client data completeness** | 90% of required fields filled | Data quality for Phase 4 foundation |
| **User-reported satisfaction** | NPS 40+ for quoting feature | Qualitative validation |

### What Success Looks Like

An agent working a new prospect:
1. Opens docuMINE quoting, enters client info once (~3 min)
2. Clicks "Copy for Progressive" → pastes into portal → gets quote (~2 min)
3. Clicks "Copy for Travelers" → pastes into portal → gets quote (~2 min)
4. Enters quote results back into docuMINE
5. Generates comparison doc to send to client

**Total time: ~10-15 minutes** for 2-3 carriers vs. **30-45 minutes** manually re-entering everything.

---

## Product Scope

### MVP - Minimum Viable Product

**Core Capability:** Enter client data once, copy carrier-formatted output to clipboard.

**MVP Features:**

1. **Quote Session Management**
   - Create new quote session for a prospect
   - Save and resume incomplete sessions
   - View session history

2. **Client Data Capture**
   - Structured form for prospect information
   - Personal: Name, DOB, address, contact
   - Property: Address, construction, year built, coverage amounts
   - Auto: Vehicles, drivers, coverage preferences
   - Smart defaults and validation

3. **Carrier Output Generation**
   - Progressive format (copy to clipboard)
   - Travelers format (copy to clipboard)
   - Direct links to carrier agent portals

4. **Quote Result Entry**
   - Manual entry of received quotes (premium, coverages, deductibles)
   - Simple structured form per carrier

5. **Comparison Doc Generation**
   - Generate comparison document from entered quote results
   - Leverage existing docuMINE comparison infrastructure

**MVP Carriers:** Progressive, Travelers (2 carriers)

**MVP Lines of Business:** Personal Lines (Home + Auto bundled)

### Growth Features (Post-MVP Phase 3)

| Feature | Value |
|---------|-------|
| **Additional carriers** | Safeco, Liberty Mutual, Hartford, Nationwide |
| **Commercial lines** | BOP, GL, WC data capture templates |
| **Client database** | Save clients for re-quoting at renewal |
| **Team sharing** | Share quote sessions within agency |
| **Quote templates** | Save common coverage configurations |
| **Bulk operations** | Re-quote multiple clients at renewal time |

### Vision (Phase 4 - AI-Powered Quoting)

Phase 3 is the foundation for Phase 4's full automation:

- **AI Browser Agent** navigates carrier portals automatically
- **Credential Vault** securely stores agent logins
- **Background Processing** - click "Get Quotes" and results appear
- **Any Carrier Support** - users add their own carriers
- **Self-Healing** - AI adapts when carrier sites change

Phase 3 teaches docuMINE the data formats and validates the workflow. Phase 4 removes the manual portal work entirely.

---

## Domain-Specific Requirements

### InsureTech Considerations for Phase 3

Phase 3's clipboard-based approach intentionally avoids the heaviest regulatory concerns (credential storage, automated transactions). However, these still apply:

**Data Privacy**
- Client PII (names, addresses, DOB, SSN for drivers) must be handled securely
- Data at rest encryption required
- No sharing of client data across agencies
- Clear data retention policies

**Insurance-Specific Data Accuracy**
- Coverage amounts, deductibles, and limits must be accurately captured
- VIN validation for vehicles
- Address standardization for property
- No auto-population of coverage recommendations (E&O risk)

**Agent Workflow Compatibility**
- Must work alongside existing agency management systems (not replace them)
- Export capabilities for agents who need to enter data elsewhere
- No "binding" functionality - quoting only

**What We're NOT Doing in Phase 3** (Deferred Compliance)
- ❌ Storing carrier credentials (Phase 4)
- ❌ Automated portal interactions (Phase 4)
- ❌ Payment processing
- ❌ Policy binding or issuance
- ❌ Acting as agent-of-record

---

## Web App Specific Requirements

### Browser Compatibility
- Chrome (latest 2 versions) - primary
- Edge (latest 2 versions) - secondary
- Safari (latest 2 versions) - secondary
- Firefox (latest 2 versions) - best effort

### Responsive Design
- Desktop-first (agents primarily work on desktop)
- Tablet support for field use
- Mobile: view-only for quote results (data entry on mobile not required)

### Clipboard API
- Modern Clipboard API for copy functionality
- Fallback for older browsers
- Visual confirmation of copy success
- Support for structured text (tab-delimited for paste into forms)

### Performance Targets
- Form load: < 2 seconds
- Copy to clipboard: < 500ms with visual feedback
- Session save: < 1 second (auto-save on blur)
- Carrier format generation: < 1 second

### Offline Considerations
- Not required for MVP
- Future: PWA with offline form completion, sync when online

---

## User Experience Principles

### Design Philosophy

**"Get out of the way."**

Agents are busy. The quoting helper should feel like a natural extension of their workflow, not a new system to learn. Every click should have obvious purpose.

### Visual Personality
- **Professional and efficient** - matches docuMINE's existing design language
- **Information-dense but not cluttered** - agents want to see data, not whitespace
- **Clear visual hierarchy** - most important actions (Copy, Open Portal) prominent

### Core UX Principles

1. **Progressive Disclosure**
   - Show essential fields first
   - Expand sections as needed
   - Don't overwhelm with every possible insurance field upfront

2. **Smart Defaults**
   - Pre-fill common values where safe (state from address, etc.)
   - Remember user's previous choices (preferred coverage amounts)
   - Never default coverage recommendations (E&O risk)

3. **Error Prevention > Error Messages**
   - Validate as user types (VIN format, ZIP code lookup)
   - Auto-format phone numbers, dates
   - Clear visual indicators of required fields

4. **Copy Confidence**
   - Large, obvious copy buttons per carrier
   - Clear visual feedback on successful copy
   - Show preview of what will be copied

### Key Interactions

**1. Starting a Quote Session**
- Single "New Quote" button from quoting landing page
- Option to select lines of business (Home, Auto, Bundle)
- Clear entry point in docuMINE navigation

**2. Data Entry Flow**
- Tab-based sections: Client Info → Property → Auto → Drivers
- Auto-save on field blur (never lose work)
- Clear progress indicator
- Skip sections not applicable (home-only, auto-only)

**3. Carrier Copy Action**
- Per-carrier row: `[Carrier Logo] [Open Portal ↗] [Copy Data 📋]`
- Copy button shows "Copied ✓" for 2 seconds
- Portal link opens in new tab

**4. Quote Result Entry**
- After returning from portal: "Enter Quote Results"
- Simple form: Premium, Deductible, Key coverage limits
- Optional: attach PDF quote document

**5. Generate Comparison**
- Once 2+ quotes entered, "Generate Comparison" becomes active
- Reuses existing docuMINE comparison doc generation
- Outputs client-ready comparison document

---

## Functional Requirements

### Quote Session Management

- **FR1:** Users can create a new quote session for a prospect
- **FR2:** Users can save quote sessions and resume them later
- **FR3:** Users can view a list of their quote sessions with status indicators
- **FR4:** Users can delete quote sessions they no longer need
- **FR5:** Users can duplicate an existing quote session as a starting point for a new quote
- **FR6:** System auto-saves quote session data as users enter information

### Client Data Capture

- **FR7:** Users can enter prospect personal information (name, DOB, contact info)
- **FR8:** Users can enter property information (address, construction type, year built, square footage)
- **FR9:** Users can enter property coverage preferences (dwelling amount, liability, deductibles)
- **FR10:** Users can enter vehicle information (year, make, model, VIN)
- **FR11:** Users can add multiple vehicles to a quote session
- **FR12:** Users can enter driver information (name, DOB, license number, driving history)
- **FR13:** Users can add multiple drivers to a quote session
- **FR14:** Users can enter auto coverage preferences (liability limits, comprehensive, collision)
- **FR15:** Users can select quote type (Home only, Auto only, Bundle)
- **FR16:** System validates VIN format and provides feedback
- **FR17:** System standardizes and validates addresses
- **FR18:** System auto-formats phone numbers and dates as users type

### Carrier Output Generation

- **FR19:** Users can copy client data formatted for Progressive to clipboard
- **FR20:** Users can copy client data formatted for Travelers to clipboard
- **FR21:** Users can open carrier agent portals in a new browser tab
- **FR22:** System displays visual confirmation when data is copied to clipboard
- **FR23:** Users can preview the formatted data before copying
- **FR24:** System formats data appropriately for each carrier's portal field structure

### Quote Result Entry

- **FR25:** Users can enter quote results received from a carrier (premium, coverages, deductibles)
- **FR26:** Users can attach PDF quote documents to a quote result
- **FR27:** Users can edit previously entered quote results
- **FR28:** Users can mark a carrier as "declined" or "not competitive"
- **FR29:** System displays entered quotes in a summary view for easy comparison

### Comparison Document Generation

- **FR30:** Users can generate a comparison document when 2+ quotes are entered
- **FR31:** System creates comparison doc using existing docuMINE comparison infrastructure
- **FR32:** Users can customize which coverages appear in the comparison
- **FR33:** Users can export comparison document as PDF
- **FR34:** Users can share comparison document link with prospects

### Carrier Management

- **FR35:** System displays list of supported carriers with their status
- **FR36:** Users can select which carriers to include in a quote session
- **FR37:** Users can set preferred/default carriers in their profile
- **FR38:** System tracks which carriers user has portal access to

### Navigation & Integration

- **FR39:** Quoting feature is accessible from main docuMINE navigation
- **FR40:** Users can access quoting from the docuMINE dashboard
- **FR41:** Quote sessions are associated with the user's account
- **FR42:** System integrates with existing docuMINE authentication

---

## Non-Functional Requirements

### Performance

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **Page load** | < 2 seconds | Agents expect snappy tools |
| **Form field response** | < 100ms | No lag during data entry |
| **Clipboard copy** | < 500ms with visual feedback | Core interaction must feel instant |
| **Auto-save** | < 1 second, non-blocking | Background save shouldn't interrupt flow |
| **Carrier format generation** | < 1 second | Computed client-side |

### Security

| Requirement | Implementation |
|-------------|----------------|
| **Data encryption at rest** | Supabase RLS + encrypted columns for PII |
| **Data encryption in transit** | HTTPS only (enforced) |
| **Authentication** | Existing docuMINE auth (Supabase Auth) |
| **Authorization** | Users can only access their own quote sessions |
| **PII handling** | SSN/license numbers encrypted, masked in UI |
| **Audit logging** | Log access to PII fields |
| **Session security** | Standard docuMINE session management |

**NOT in Scope for Phase 3:**
- Credential storage (Phase 4)
- SOC 2 certification (Phase 4)
- Third-party security audit (Phase 4)

### Integration

| Integration Point | Approach |
|-------------------|----------|
| **docuMINE Auth** | Reuse existing Supabase Auth |
| **docuMINE Navigation** | Add quoting route to sidebar |
| **docuMINE Comparison Engine** | Call existing comparison doc generation |
| **Address Validation** | Third-party API (e.g., SmartyStreets, Google) |
| **VIN Decoder** | Third-party API for validation |
| **Carrier Portals** | External links only (no API integration in Phase 3) |

### Scalability

- **User load:** Support existing docuMINE user base (no special scaling needs for Phase 3)
- **Data storage:** Quote sessions stored in Supabase, standard retention policies
- **Future consideration:** Client database growth in post-MVP phases

### Accessibility

- **Target:** WCAG 2.1 AA compliance
- **Keyboard navigation:** Full form completion without mouse
- **Screen reader support:** Proper ARIA labels on form fields
- **Color contrast:** Meets AA standards for all text

---

## Summary

### What We're Building

**Quoting Helper (Phase 3)** - A clipboard-based tool that lets insurance agents enter client data once and copy carrier-formatted output to paste into any portal.

### Core Value

**"Enter once, use everywhere"** - Time savings multiply with each carrier quoted (2-20 per prospect).

### MVP Scope

- Quote session management (create, save, resume, list)
- Client data capture (personal, property, auto, drivers)
- Carrier output (Progressive, Travelers clipboard + portal links)
- Quote result entry (manual entry of received quotes)
- Comparison doc generation (leverage existing infrastructure)

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Clipboard vs. automation | Clipboard (Phase 3) | Zero friction entry, prove value first |
| Initial carriers | Progressive + Travelers | Most common, well-understood portals |
| Lines of business | Personal (Home + Auto) | Highest volume, clearest data model |
| Integration approach | Feature within docuMINE | Shared auth, nav, infrastructure |

### What This Enables

Phase 3 is the foundation for Phase 4's AI-powered automation:
- Validates the workflow and data model
- Teaches docuMINE carrier data formats
- Builds user trust before asking for credentials
- Creates the data capture UI that Phase 4 will reuse

### FR Summary

**42 Functional Requirements** across:
- Quote Session Management (FR1-6)
- Client Data Capture (FR7-18)
- Carrier Output Generation (FR19-24)
- Quote Result Entry (FR25-29)
- Comparison Document Generation (FR30-34)
- Carrier Management (FR35-38)
- Navigation & Integration (FR39-42)

---

_This PRD captures the essence of Quoting Helper Phase 3 - transforming portal-hopping drudgery into a streamlined "enter once, use everywhere" workflow that saves agents 50%+ of their quoting time._

_Created through collaborative discovery between Sam and AI facilitator._
