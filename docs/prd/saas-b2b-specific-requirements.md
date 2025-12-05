# SaaS B2B Specific Requirements

## Multi-Tenancy Architecture

docuMINE serves independent agencies as organizational units:

**Agency (Tenant) Level:**
- Each agency is an isolated tenant with their own documents and data
- Agency-level settings and preferences
- Subscription and billing at agency level

**User Level:**
- Multiple users per agency (seat-based model)
- Users belong to one agency
- Individual user authentication and sessions

**Data Isolation:**
- Strict separation of documents and data between agencies
- No cross-tenant data access
- Agency admins can only see their agency's usage

## Subscription Tiers

Seat-based pricing aligned with agency sizes:
- **Starter:** 1-3 seats (small agencies)
- **Professional:** 4-10 seats (mid-size agencies)
- **Agency:** 11+ seats (larger agencies, volume pricing)

## Permissions & Roles

**MVP Roles (Simple):**
- **Admin:** Manage users, billing, agency settings
- **Member:** Upload documents, run queries, view comparisons

**Future Roles (Post-MVP):**
- View-only access for support staff
- Department-level document access controls

---
