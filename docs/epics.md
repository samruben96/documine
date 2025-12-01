# docuMINE - Epic Breakdown

**Author:** Sam
**Date:** 2025-11-24
**Project Level:** B2B SaaS
**Target Scale:** Independent Insurance Agencies

---

## Overview

This document provides the complete epic and story breakdown for docuMINE, decomposing the requirements from the [PRD](./prd.md) into implementable stories.

**Living Document Notice:** This version incorporates PRD + UX Design + Architecture context.

**Epic Summary:**

| Epic | Title | User Value | FRs Covered |
|------|-------|------------|-------------|
| 1 | Foundation & Infrastructure | Project setup enabling all subsequent work | FR31, FR33, FR34 (partial) |
| 2 | User Authentication & Onboarding | Users can sign up, log in, and access the platform | FR1, FR2, FR3, FR4, FR27 (partial) |
| 3 | Agency & Team Management | Admins can manage their agency, invite users, handle billing | FR5, FR6, FR7, FR28, FR29, FR30 |
| 4 | Document Upload & Management | Users can upload, view, organize, and delete documents | FR8, FR9, FR10, FR11, FR12, FR27 |
| 5 | Document Q&A with Trust Transparency | Users can chat with documents and verify answers | FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR32, FR34 |
| 6 | Quote Comparison | Users can compare multiple quotes side-by-side | FR20, FR21, FR22, FR23, FR24, FR25, FR26 |

---

## Functional Requirements Inventory

**User Account & Access (FR1-FR7):**
- **FR1:** Users can create accounts with email and password
- **FR2:** Users can log in securely and maintain sessions across browser sessions
- **FR3:** Users can reset passwords via email verification
- **FR4:** Users can update their profile information
- **FR5:** Agency admins can invite new users to their agency
- **FR6:** Agency admins can remove users from their agency
- **FR7:** Agency admins can manage subscription and billing

**Document Management (FR8-FR12):**
- **FR8:** Users can upload PDF documents (policies, quotes, certificates)
- **FR9:** Users can view a list of their uploaded documents
- **FR10:** Users can delete documents they've uploaded
- **FR11:** Users can organize documents (basic naming/labeling)
- **FR12:** System processes and indexes uploaded documents for querying

**Document Q&A (FR13-FR19):**
- **FR13:** Users can ask natural language questions about an uploaded document
- **FR14:** System returns answers extracted from the document
- **FR15:** Every answer includes source citation linking to exact document location
- **FR16:** Every answer includes confidence indicator (High Confidence / Needs Review / Not Found)
- **FR17:** Users can click source citations to view the relevant document section
- **FR18:** Users can ask follow-up questions in a conversational flow
- **FR19:** System clearly indicates when information is not found in the document

**Quote Comparison (FR20-FR26):**
- **FR20:** Users can select multiple documents (2-4) for side-by-side comparison
- **FR21:** System automatically extracts key quote data: coverage types, limits, deductibles, exclusions, premium
- **FR22:** System displays extracted data in aligned comparison view
- **FR23:** System highlights differences between quotes
- **FR24:** System identifies and flags coverage gaps or conflicts
- **FR25:** Users can view source citations for any extracted data point
- **FR26:** Users can export comparison results (PDF or structured format)

**Agency Management (FR27-FR30):**
- **FR27:** Agencies have isolated document storage and data
- **FR28:** Agency admins can view usage metrics for their agency
- **FR29:** Agency admins can manage agency settings and preferences
- **FR30:** System enforces seat limits based on subscription tier

**Platform & Infrastructure (FR31-FR34):**
- **FR31:** System accessible via modern web browsers (Chrome, Firefox, Safari, Edge)
- **FR32:** System provides responsive design for desktop and tablet use
- **FR33:** System maintains document processing queue during high load
- **FR34:** System provides clear error messages when operations fail

---

## FR Coverage Map

| FR | Description | Epic | Stories |
|----|-------------|------|---------|
| FR1 | Account creation with email/password | Epic 2 | 2.1, 2.2 |
| FR2 | Secure login with persistent sessions | Epic 2 | 2.3, 2.4 |
| FR3 | Password reset via email | Epic 2 | 2.5 |
| FR4 | Profile updates | Epic 2 | 2.6 |
| FR5 | Admin invites users | Epic 3 | 3.2 |
| FR6 | Admin removes users | Epic 3 | 3.3 |
| FR7 | Subscription/billing management | Epic 3 | 3.4 |
| FR8 | Upload PDF documents | Epic 4 | 4.1, 4.2 |
| FR9 | View document list | Epic 4 | 4.3 |
| FR10 | Delete documents | Epic 4 | 4.4 |
| FR11 | Organize/label documents | Epic 4 | 4.5 |
| FR12 | Process and index documents | Epic 4 | 4.6, 4.7 |
| FR13 | Natural language Q&A | Epic 5 | 5.1, 5.2 |
| FR14 | Extract answers from documents | Epic 5 | 5.2, 5.3 |
| FR15 | Source citations on answers | Epic 5 | 5.3, 5.4 |
| FR16 | Confidence indicators | Epic 5 | 5.3 |
| FR17 | Click-to-view source in document | Epic 5 | 5.4, 5.5 |
| FR18 | Follow-up questions (conversation) | Epic 5 | 5.6 |
| FR19 | Clear "not found" responses | Epic 5 | 5.3 |
| FR20 | Select 2-4 documents for comparison | Epic 6 | 6.1 |
| FR21 | Auto-extract quote data | Epic 6 | 6.2 |
| FR22 | Aligned comparison view | Epic 6 | 6.3 |
| FR23 | Highlight differences | Epic 6 | 6.3 |
| FR24 | Flag gaps/conflicts | Epic 6 | 6.4 |
| FR25 | Source citations for comparison data | Epic 6 | 6.5 |
| FR26 | Export comparison results | Epic 6 | 6.6 |
| FR27 | Isolated agency data | Epic 2, 4 | 2.2, 4.1 |
| FR28 | Admin usage metrics | Epic 3 | 3.5 |
| FR29 | Agency settings | Epic 3 | 3.1 |
| FR30 | Seat limit enforcement | Epic 3 | 3.2, 3.4 |
| FR31 | Browser compatibility | Epic 1 | 1.1 |
| FR32 | Responsive design | Epic 5 | 5.7 |
| FR33 | Processing queue | Epic 4 | 4.6 |
| FR34 | Clear error messages | Epic 1, 5 | 1.1, 5.3 |

---

## Epic 1: Foundation & Infrastructure

**Goal:** Establish the technical foundation enabling all subsequent development. This epic sets up the Next.js + Supabase stack, database schema, authentication infrastructure, and deployment pipeline.

**User Value:** While not directly user-facing, this epic enables the entire platform to exist. Without it, nothing else can be built.

**FRs Addressed:** FR31 (browser compatibility), FR33 (processing queue foundation), FR34 (error handling patterns)

---

### Story 1.1: Project Initialization & Core Setup

As a **developer**,
I want **the project scaffolded with Next.js, Supabase, and core dependencies**,
So that **I have a working foundation to build features on**.

**Acceptance Criteria:**

**Given** no project exists
**When** the initialization script runs
**Then** a Next.js 15 app is created with:
- TypeScript in strict mode
- Tailwind CSS configured
- ESLint configured
- App Router (`/src/app`) structure
- Supabase client libraries installed (`@supabase/supabase-js`, `@supabase/ssr`)
- shadcn/ui initialized with base components (Button, Input, Card, Dialog, Table, Tabs, Toast)
- OpenAI and LlamaParse client libraries installed
- Resend email library installed
- Zod for validation

**And** the project structure matches Architecture spec:
```
src/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   └── api/
├── components/
│   ├── ui/
│   ├── chat/
│   ├── documents/
│   └── layout/
├── lib/
│   ├── supabase/
│   ├── openai/
│   └── utils/
├── hooks/
└── types/
```

**And** environment variables template (`.env.example`) is created with all required keys:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `LLAMA_CLOUD_API_KEY`
- `RESEND_API_KEY`

**Prerequisites:** None (first story)

**Technical Notes:**
- Run `npx create-next-app@latest documine --typescript --tailwind --eslint --app --src-dir`
- Initialize Supabase with `npx supabase init`
- Add shadcn/ui components per Architecture spec
- Configure TypeScript strict mode in `tsconfig.json`
- Set up path aliases (`@/` for `src/`)

---

### Story 1.2: Database Schema & RLS Policies

As a **developer**,
I want **the complete database schema with Row Level Security policies**,
So that **data is properly structured and multi-tenant isolation is enforced at the database level**.

**Acceptance Criteria:**

**Given** Supabase is initialized locally
**When** migrations are applied
**Then** the following tables exist with correct columns and types:
- `agencies` (id, name, subscription_tier, seat_limit, created_at, updated_at)
- `users` (id references auth.users, agency_id, email, full_name, role, created_at, updated_at)
- `documents` (id, agency_id, uploaded_by, filename, storage_path, status, page_count, metadata, created_at, updated_at)
- `document_chunks` (id, document_id, agency_id, content, page_number, chunk_index, bounding_box, embedding vector(1536), created_at)
- `conversations` (id, agency_id, document_id, user_id, created_at, updated_at)
- `chat_messages` (id, conversation_id, agency_id, role, content, sources, confidence, created_at)
- `processing_jobs` (id, document_id, status, error_message, started_at, completed_at, created_at)

**And** pgvector extension is enabled with `create extension if not exists vector with schema extensions`

**And** indexes are created:
- `idx_documents_agency` on documents(agency_id)
- `idx_document_chunks_document` on document_chunks(document_id)
- `idx_document_chunks_embedding` using ivfflat for vector similarity search
- `idx_conversations_document` on conversations(document_id)
- `idx_chat_messages_conversation` on chat_messages(conversation_id)
- `idx_processing_jobs_status` on processing_jobs(status) where pending

**And** RLS policies enforce agency isolation:
- Users can only see/modify data where `agency_id` matches their own
- Processing jobs accessible only to service role
- All tables have RLS enabled

**And** TypeScript types are generated via `npx supabase gen types typescript --local > src/lib/database.types.ts`

**Prerequisites:** Story 1.1

**Technical Notes:**
- Create migrations in `supabase/migrations/` numbered sequentially
- Migration 1: Initial schema
- Migration 2: Enable pgvector
- Migration 3: RLS policies
- Test RLS policies prevent cross-tenant access
- Reference Architecture doc section "Data Architecture" for exact SQL

---

### Story 1.3: Supabase Client Configuration

As a **developer**,
I want **properly configured Supabase clients for browser and server contexts**,
So that **database operations work correctly in all Next.js environments**.

**Acceptance Criteria:**

**Given** Supabase is configured
**When** importing from `@/lib/supabase`
**Then** browser client (`client.ts`) is available for client components:
- Uses `createBrowserClient` from `@supabase/ssr`
- Configured with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Properly typed with generated database types

**And** server client (`server.ts`) is available for server components and API routes:
- Uses `createServerClient` from `@supabase/ssr`
- Handles cookies correctly for SSR
- Supports service role key for admin operations

**And** middleware (`middleware.ts`) handles auth session refresh:
- Refreshes expired sessions automatically
- Protects dashboard routes (redirects to login if unauthenticated)
- Allows public routes (landing, login, signup, reset-password)

**And** type safety is enforced:
- All Supabase operations use generated `Database` types
- TypeScript errors if accessing wrong table/column names

**Prerequisites:** Story 1.2

**Technical Notes:**
- Follow Supabase SSR guide for Next.js App Router
- Middleware should be in `src/middleware.ts`
- Export typed clients for consistent usage across codebase
- Test that RLS policies work with authenticated user context

---

### Story 1.4: Storage Bucket Configuration

As a **developer**,
I want **Supabase Storage configured for document uploads with agency-scoped policies**,
So that **files are stored securely with proper access controls**.

**Acceptance Criteria:**

**Given** Supabase is configured
**When** storage is set up
**Then** a `documents` bucket exists with:
- Path structure: `{agency_id}/{document_id}/{filename}`
- File size limit: 50MB
- Allowed MIME types: `application/pdf`

**And** storage policies enforce agency isolation:
- Users can upload to their agency folder only
- Users can read from their agency folder only
- Users can delete from their agency folder only

**And** helper functions exist in `@/lib/utils/storage.ts`:
- `uploadDocument(file, agencyId, documentId)` - returns storage path
- `getDocumentUrl(storagePath)` - returns signed URL (1 hour expiry)
- `deleteDocument(storagePath)` - removes file from storage

**Prerequisites:** Story 1.2

**Technical Notes:**
- Create bucket via Supabase dashboard or migration
- Use `storage.foldername(name)[1]` to extract agency_id from path in policies
- Signed URLs prevent direct public access while allowing authenticated viewing
- Test that cross-agency file access is blocked

---

### Story 1.5: Error Handling & Logging Patterns

As a **developer**,
I want **consistent error handling and structured logging across the application**,
So that **errors are handled gracefully and debugging is straightforward**.

**Acceptance Criteria:**

**Given** the error handling module exists
**When** errors occur anywhere in the application
**Then** custom error classes are used:
```typescript
class DocumentNotFoundError extends Error { code = 'DOCUMENT_NOT_FOUND' }
class UnauthorizedError extends Error { code = 'UNAUTHORIZED' }
class ProcessingError extends Error { code = 'PROCESSING_ERROR' }
class ValidationError extends Error { code = 'VALIDATION_ERROR' }
```

**And** API routes return consistent response format:
```typescript
// Success: { data: T, error: null }
// Error: { data: null, error: { code: string, message: string, details?: unknown } }
```

**And** structured logging is implemented in `@/lib/utils/logger.ts`:
- `log.info(message, data)` - JSON formatted with timestamp
- `log.error(message, error, data)` - includes stack trace
- `log.warn(message, data)` - for non-critical issues

**And** error boundaries exist:
- Global error boundary catches unhandled React errors
- Shows user-friendly error message with retry option
- Logs error details for debugging

**Prerequisites:** Story 1.1

**Technical Notes:**
- Place error classes in `@/lib/errors.ts`
- Create `@/lib/utils/api-response.ts` with helper functions
- Use Next.js `error.tsx` files for error boundaries
- Log format: `{ level, message, timestamp, ...data }`

---

### Story 1.6: Deployment Pipeline Setup

As a **developer**,
I want **the application deployable to Vercel with preview deployments**,
So that **changes can be tested and shipped reliably**.

**Acceptance Criteria:**

**Given** the codebase is in a Git repository
**When** connected to Vercel
**Then** production deployment works:
- Builds successfully with `npm run build`
- Environment variables configured in Vercel dashboard
- Domain configured (or using Vercel subdomain)

**And** preview deployments work:
- Each PR gets a preview URL
- Preview uses separate Supabase project (or staging branch)

**And** Supabase deployment is configured:
- Production project created on Supabase cloud
- Migrations can be pushed via `npx supabase db push`
- Edge Functions can be deployed via `npx supabase functions deploy`

**And** security headers are configured in `next.config.js`:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

**Prerequisites:** Story 1.3

**Technical Notes:**
- Create Vercel project and link to repository
- Set all environment variables in Vercel
- Consider Supabase branching for preview environments (optional for MVP)
- Verify CORS settings allow Vercel domains

---

## Epic 2: User Authentication & Onboarding

**Goal:** Enable users to create accounts, sign in securely, reset passwords, and manage their profiles. Establish the agency as an organizational unit during signup.

**User Value:** Users can access the platform securely and manage their identity. New agencies can onboard without friction.

**FRs Addressed:** FR1, FR2, FR3, FR4, FR27 (agency isolation foundation)

---

### Story 2.1: Signup Page & Agency Creation

As a **new user**,
I want **to create an account and establish my agency**,
So that **I can start using docuMINE for my insurance practice**.

**Acceptance Criteria:**

**Given** I am on the signup page (`/signup`)
**When** I fill out the signup form
**Then** I see form fields for:
- Full name (required, 2-100 characters)
- Email (required, valid email format per RFC 5322)
- Password (required, minimum 8 characters, 1 uppercase, 1 number, 1 special character)
- Agency name (required, 2-100 characters)

**And** real-time validation shows:
- Password strength indicator (weak/medium/strong) using visual bar
- Email format validation on blur
- Field-level error messages in red (#dc2626) below each field

**And** when I click "Create Account":
- Button shows loading state (spinner + "Creating...")
- On success: agency record created, user record created with role='admin', redirect to dashboard
- On error: toast notification with specific error message

**And** the page follows UX spec:
- Trustworthy Slate color theme
- System font stack
- Clean, minimal layout - no distractions
- "Already have an account? Sign in" link

**Prerequisites:** Story 1.3, Story 1.5

**Technical Notes:**
- Use Supabase Auth `signUp()` with email/password
- Create agency and user records in a transaction after auth signup succeeds
- First user of agency automatically becomes admin
- Use Zod for form validation schema
- Implement using React Hook Form for form state management

---

### Story 2.2: Post-Signup Agency & User Record Creation

As the **system**,
I want **to create agency and user records after successful auth signup**,
So that **the multi-tenant data model is properly initialized**.

**Acceptance Criteria:**

**Given** a user completes Supabase Auth signup
**When** the auth trigger fires
**Then** a new agency record is created:
- `name` from signup form
- `subscription_tier` = 'starter'
- `seat_limit` = 3

**And** a new user record is created:
- `id` matches auth.users.id
- `agency_id` references the new agency
- `email` from signup
- `full_name` from signup
- `role` = 'admin' (first user is always admin)

**And** this happens atomically (both succeed or both fail)

**And** if record creation fails, the auth user is cleaned up

**Prerequisites:** Story 1.2

**Technical Notes:**
- Can use Supabase database trigger OR handle in API route after signup
- Prefer API route approach for better error handling
- Wrap in transaction: `supabase.rpc('create_agency_and_user', {...})`
- Consider edge case: what if agency name already exists? (allow duplicates for MVP)

---

### Story 2.3: Login Page

As a **returning user**,
I want **to sign into my account**,
So that **I can access my documents and continue my work**.

**Acceptance Criteria:**

**Given** I am on the login page (`/login`)
**When** I view the page
**Then** I see form fields for:
- Email (required)
- Password (required)
- "Remember me" checkbox (controls session duration)

**And** when I submit valid credentials:
- Button shows loading state
- On success: redirect to `/documents` (dashboard)
- Session persists based on "Remember me" (7 days vs session-only)

**And** when I submit invalid credentials:
- Error toast: "Invalid email or password"
- Form remains filled (except password cleared)
- No indication of which field is wrong (security)

**And** the page includes:
- "Forgot password?" link to `/reset-password`
- "Don't have an account? Sign up" link
- Clean Trustworthy Slate styling per UX spec

**Prerequisites:** Story 1.3

**Technical Notes:**
- Use Supabase Auth `signInWithPassword()`
- Handle "Remember me" via session options
- Rate limiting: consider blocking after 5 failed attempts (via Supabase or custom)
- Log failed attempts for security monitoring

---

### Story 2.4: Session Management & Auth Middleware

As a **logged-in user**,
I want **my session to persist and auto-refresh**,
So that **I don't have to log in repeatedly during normal use**.

**Acceptance Criteria:**

**Given** I am logged in
**When** I navigate the app or return after closing the browser
**Then** my session remains valid if not expired

**And** sessions auto-refresh before expiry (handled by Supabase middleware)

**And** protected routes (`/documents`, `/compare`, `/settings`) require authentication:
- Unauthenticated users redirected to `/login`
- Original URL preserved for post-login redirect

**And** public routes (`/`, `/login`, `/signup`, `/reset-password`) are accessible without auth

**And** logout clears session completely:
- Logout button in header user menu
- Clears all session data
- Redirects to `/login`

**Prerequisites:** Story 2.3

**Technical Notes:**
- Middleware in `src/middleware.ts` handles route protection
- Use Supabase `getSession()` to check auth state
- Store redirect URL in query param: `/login?redirect=/documents/abc`
- Test session expiry and refresh behavior

---

### Story 2.5: Password Reset Flow

As a **user who forgot my password**,
I want **to reset it via email verification**,
So that **I can regain access to my account**.

**Acceptance Criteria:**

**Given** I am on the reset password page (`/reset-password`)
**When** I enter my email and submit
**Then** I see: "If an account exists with this email, you'll receive a reset link"
- Same message whether email exists or not (security)
- Button disabled for 60 seconds to prevent spam

**And** if email exists, reset email is sent via Resend:
- Subject: "Reset your docuMINE password"
- Contains secure reset link (valid 1 hour)
- Professional template with docuMINE branding

**And** when I click the reset link:
- Taken to password update page
- Can enter new password (same validation as signup)
- On success: "Password updated" + redirect to login
- On error (expired link): "This link has expired. Request a new one."

**Prerequisites:** Story 2.3

**Technical Notes:**
- Use Supabase Auth `resetPasswordForEmail()`
- Configure Resend as email provider in Supabase
- Create email template in `supabase/templates/` or via Resend
- Handle `type=recovery` callback in auth callback route

---

### Story 2.6: User Profile Management

As a **logged-in user**,
I want **to update my profile information**,
So that **my account details stay current**.

**Acceptance Criteria:**

**Given** I am on the settings page (`/settings`)
**When** I view the profile section
**Then** I see my current profile info:
- Full name (editable)
- Email (display only - cannot change for MVP)
- Agency name (display only)
- Role (display only: Admin or Member)

**And** when I update my name and save:
- Validation: 2-100 characters
- Success toast: "Profile updated"
- Changes reflected immediately

**And** the settings page uses clean tab layout:
- Profile tab (this story)
- Agency tab (Epic 3)
- Billing tab (Epic 3)

**Prerequisites:** Story 2.4

**Technical Notes:**
- Update `users` table via Supabase
- Consider adding profile picture later (out of MVP scope)
- Settings layout should accommodate future tabs

---

## Epic 3: Agency & Team Management

**Goal:** Enable agency admins to manage their team, subscription, and agency settings. This delivers the B2B multi-user capability.

**User Value:** Admins can invite team members, manage access, and control their subscription.

**FRs Addressed:** FR5, FR6, FR7, FR28, FR29, FR30

---

### Story 3.1: Agency Settings Page

As an **agency admin**,
I want **to view and manage my agency's settings**,
So that **I can configure my organization's preferences**.

**Acceptance Criteria:**

**Given** I am an admin on the settings page (`/settings`)
**When** I view the Agency tab
**Then** I see agency information:
- Agency name (editable)
- Subscription tier (display: Starter/Professional/Agency)
- Seat limit and current usage (e.g., "3 of 5 seats used")
- Agency created date

**And** when I update agency name:
- Validation: 2-100 characters
- Success toast: "Agency settings updated"

**And** non-admin users see Agency tab but cannot edit (view-only)

**Prerequisites:** Story 2.6

**Technical Notes:**
- Check `users.role === 'admin'` for edit permissions
- Update `agencies` table for name changes
- Display seat usage from user count query

---

### Story 3.2: Invite Users to Agency

As an **agency admin**,
I want **to invite new users to join my agency**,
So that **my team can collaborate on document analysis**.

**Acceptance Criteria:**

**Given** I am an admin on the settings page, Team section
**When** I click "Invite User"
**Then** a modal appears with:
- Email field (required, valid email format)
- Role selector: Member (default) or Admin
- "Send Invitation" button

**And** when I submit a valid invitation:
- System checks seat limit: if at limit, error "Seat limit reached. Upgrade to add more users."
- If under limit: invitation email sent via Resend
- Invitation record created with status='pending', expires in 7 days
- Success toast: "Invitation sent to {email}"

**And** the invitation email contains:
- Subject: "You've been invited to join {agency_name} on docuMINE"
- Invite link to `/signup?invite={token}`
- Inviter's name
- Expires notice

**And** when invitee clicks link and signs up:
- Agency pre-populated (cannot change)
- On signup: user added to existing agency with invited role
- Invitation marked as 'accepted'

**And** pending invitations shown in Team section:
- Email, role, invited date, status
- "Resend" and "Cancel" actions

**Prerequisites:** Story 3.1

**Technical Notes:**
- Create `invitations` table: id, agency_id, email, role, token, status, expires_at, created_at
- Generate secure token for invite link
- Handle invite token in signup flow (check query param)
- Enforce seat_limit before allowing invite

---

### Story 3.3: Manage Team Members

As an **agency admin**,
I want **to view and remove team members**,
So that **I can control who has access to my agency's documents**.

**Acceptance Criteria:**

**Given** I am an admin on the settings page, Team section
**When** I view the member list
**Then** I see all agency users:
- Name
- Email
- Role (Admin/Member)
- Joined date
- Actions (for non-self users)

**And** I can remove a member:
- Click "Remove" button
- Confirmation modal: "Remove {name} from {agency}? They will lose access to all agency documents."
- On confirm: user record deleted, success toast
- Cannot remove yourself

**And** I can change a member's role:
- Admin ↔ Member toggle
- At least one admin must remain
- Success toast: "Role updated"

**And** members see Team section but cannot edit (view-only list)

**Prerequisites:** Story 3.2

**Technical Notes:**
- Soft delete vs hard delete? For MVP, hard delete user record (they can re-signup)
- Enforce "at least one admin" constraint
- Consider what happens to documents uploaded by removed user (keep them, transfer ownership to agency)

---

### Story 3.4: Subscription & Billing Management

As an **agency admin**,
I want **to view and manage my subscription**,
So that **I can upgrade, downgrade, or update payment methods**.

**Acceptance Criteria:**

**Given** I am an admin on the settings page, Billing tab
**When** I view billing information
**Then** I see:
- Current plan (Starter/Professional/Agency)
- Price per month
- Seat limit for current plan
- Current seat usage
- Next billing date (if applicable)

**And** I can upgrade/downgrade plan:
- "Change Plan" button opens plan comparison
- Shows: Starter ($X/mo, 3 seats), Professional ($Y/mo, 10 seats), Agency ($Z/mo, unlimited)
- Selecting different plan → redirect to Stripe checkout/portal

**And** I can update payment method:
- "Update Payment" → Stripe customer portal

**And** seat limit is enforced:
- Cannot invite beyond seat limit
- Downgrade blocked if current users exceed new plan's limit

**Prerequisites:** Story 3.1

**Technical Notes:**
- Integrate Stripe for payment processing
- Use Stripe Customer Portal for subscription management
- Webhook handler for subscription changes updates `agencies.subscription_tier` and `seat_limit`
- For MVP: can stub billing with manual tier assignment

---

### Story 3.5: Agency Usage Metrics

As an **agency admin**,
I want **to see usage metrics for my agency**,
So that **I can understand how the team is using docuMINE**.

**Acceptance Criteria:**

**Given** I am an admin on the settings page, Usage tab (or section)
**When** I view usage metrics
**Then** I see:
- Total documents uploaded (this month / all time)
- Total queries asked (this month / all time)
- Active users (users with activity in last 7 days)
- Storage used (MB/GB)

**And** metrics update in near-real-time (refreshes on page load)

**And** members do not see agency-wide metrics (only admins)

**Prerequisites:** Story 3.1

**Technical Notes:**
- Aggregate queries on documents, chat_messages tables
- Consider caching metrics if queries become slow
- Storage usage from Supabase Storage API or calculated from document metadata

---

### Story 3.6: Settings UX Enhancements

As an **agency admin**,
I want **the Settings page to feel responsive and polished**,
So that **managing my team feels effortless and professional**.

**Acceptance Criteria:**

**Given** I am on the settings page Team tab
**When** I change a user's role
**Then** the UI updates immediately (optimistic update):
- Loading indicator shown inline
- On success: change persists with toast
- On error: UI reverts to previous state

**And** after successful invite:
- Team list refreshes without full page reload
- Uses `router.refresh()` instead of `window.location.reload()`
- Scroll position preserved

**And** remove button behavior is contextual:
- Desktop: appears on row hover
- Mobile/Touch: always visible
- Smooth fade-in transition

**And** empty invitations section shows:
- "No pending invitations" message
- Subtle prompt to invite team members

**And** skeleton loading states:
- Shows skeleton shimmer during initial load
- Matches actual content layout

**And** subtle success animations:
- Brief highlight on role change
- Fade-out on member removal
- Animations under 300ms

**And** non-admin view-only mode indicator:
- Clear "View only" badge visible
- Explains context for non-admins

**Prerequisites:** Stories 3.1-3.5 (all complete)

**Technical Notes:**
- Use React optimistic update pattern or `useOptimistic` hook
- Replace `window.location.reload()` with `router.refresh()`
- CSS `@media (hover: hover)` for touch device detection
- shadcn/ui Skeleton component for loading states

---

## Epic 4: Document Upload & Management

**Goal:** Enable users to upload, view, organize, and manage insurance documents. This is the foundation for all document-based features.

**User Value:** Users can upload their policies and quotes, see them in an organized list, and manage their document library.

**FRs Addressed:** FR8, FR9, FR10, FR11, FR12, FR27, FR33

---

### Story 4.1: Document Upload Zone

As a **user**,
I want **to upload PDF documents easily**,
So that **I can analyze my insurance policies and quotes**.

**Acceptance Criteria:**

**Given** I am on the documents page (`/documents`) or document view
**When** I see the upload zone
**Then** I can upload via:
- Drag-and-drop onto dashed-border zone
- Click zone to open file picker
- Multiple files supported (up to 5 at once)

**And** the upload zone shows:
- Default: Dashed border, "Drop a document here or click to upload"
- Drag hover: Border color change to primary (#475569), background highlight
- Uploading: Progress bar per file (percentage)
- Processing: "Analyzing document..." with shimmer animation

**And** file validation:
- PDF only (reject others with toast: "Only PDF files are supported")
- Max 50MB per file (reject with toast: "File too large. Maximum size is 50MB")

**And** on successful upload:
- Document record created with status='processing'
- File uploaded to Supabase Storage at `{agency_id}/{document_id}/{filename}`
- Processing job queued
- Document appears in list with "Processing..." status

**Prerequisites:** Story 1.4

**Technical Notes:**
- Use react-dropzone or similar for drag-drop handling
- Parallel uploads for multiple files
- Generate UUID for document_id before upload
- Store original filename in document record
- Per UX spec: no spinner > 200ms, use skeleton/shimmer instead

---

### Story 4.2: Upload Progress & Status Feedback

As a **user**,
I want **clear feedback during document upload and processing**,
So that **I know the status of my documents**.

**Acceptance Criteria:**

**Given** I upload a document
**When** upload is in progress
**Then** I see:
- Per-file progress bar (0-100%)
- Filename displayed
- "Cancel" option (removes from queue)

**And** when upload completes but processing hasn't:
- Status changes to "Analyzing..."
- Shimmer animation on document card
- Estimated time (optional): "Usually takes 1-2 minutes"

**And** when processing completes:
- Status changes to "Ready"
- Document immediately available for Q&A
- Success toast: "{filename} is ready"

**And** if processing fails:
- Status shows "Failed" with error icon
- Tooltip/click shows error message
- "Retry" option attempts reprocessing
- "Delete" removes failed document

**And** upload state persists across navigation:
- Can navigate away and return
- Processing status still visible
- Notifications appear when complete

**Prerequisites:** Story 4.1

**Technical Notes:**
- Use Supabase realtime subscriptions to listen for document status changes
- Store processing progress in processing_jobs table
- Consider optimistic UI: show document in list immediately

---

### Story 4.3: Document List View

As a **user**,
I want **to see all my uploaded documents in an organized list**,
So that **I can find and select documents for analysis**.

**Acceptance Criteria:**

**Given** I am on the documents page (`/documents`)
**When** I view the document list
**Then** I see documents in a sidebar list (per UX spec):
- Document icon + filename
- Upload date ("2 hours ago", "Yesterday", "Nov 20")
- Status indicator (Ready ✓, Processing ⟳, Failed ✗)

**And** the list is:
- Sorted by most recently uploaded first
- Scrollable if many documents
- Filterable by search (filename match)

**And** clicking a document:
- Opens split view: Document Viewer + Chat Panel
- Document highlighted as selected in sidebar (left border accent)

**And** empty state (no documents):
- Centered upload zone
- "Upload your first document to get started"

**And** responsive behavior:
- Desktop: Sidebar always visible (240px width)
- Tablet: Collapsible sidebar (hamburger menu)
- Mobile: Bottom navigation with Documents tab

**Prerequisites:** Story 4.1

**Technical Notes:**
- Query documents table filtered by agency_id, ordered by created_at desc
- Use relative time formatting (date-fns or similar)
- Implement search with client-side filter or database ILIKE query
- Sidebar component in `@/components/layout/sidebar.tsx`

---

### Story 4.4: Delete Documents

As a **user**,
I want **to delete documents I no longer need**,
So that **I can keep my document library clean**.

**Acceptance Criteria:**

**Given** I am viewing a document or the document list
**When** I click delete (trash icon or menu option)
**Then** confirmation modal appears:
- "Delete {filename}?"
- "This will permanently delete the document and all conversations about it. This cannot be undone."
- "Cancel" and "Delete" buttons

**And** on confirm:
- Document record deleted (cascades to chunks, conversations, messages)
- File deleted from Supabase Storage
- Success toast: "Document deleted"
- Navigate to documents list if was viewing deleted doc

**And** delete is immediate (no soft delete for MVP)

**Prerequisites:** Story 4.3

**Technical Notes:**
- CASCADE delete configured in database schema
- Delete from storage after database delete succeeds
- Handle case where storage delete fails (log error, don't block)

---

### Story 4.5: Document Organization (Rename/Label)

As a **user**,
I want **to rename documents and add labels**,
So that **I can organize my document library**.

**Acceptance Criteria:**

**Given** I am viewing a document or document list
**When** I click rename (edit icon or right-click menu)
**Then** filename becomes editable inline:
- Current name pre-filled
- Enter to save, Escape to cancel
- Validation: 1-255 characters, no path separators

**And** when I add a label/tag:
- Click "+ Add label" or existing labels area
- Type label name (autocomplete from existing labels)
- Press Enter or click to add
- Labels shown as small pills below filename
- Click X on label to remove

**And** I can filter by label:
- Label dropdown in sidebar
- Selecting label filters document list

**And** labels are agency-scoped (shared across team)

**Prerequisites:** Story 4.3

**Technical Notes:**
- Add `display_name` column to documents table (keeps original filename separate)
- Add `labels` table: id, agency_id, name, color
- Add `document_labels` junction table: document_id, label_id
- Consider simple approach: store labels as jsonb array on document (simpler)

---

### Story 4.6: Document Processing Pipeline (LlamaParse)

As the **system**,
I want **to process uploaded PDFs into searchable chunks with embeddings**,
So that **documents can be queried via natural language**.

**Acceptance Criteria:**

**Given** a document is uploaded with status='processing'
**When** the processing job runs
**Then** the PDF is sent to LlamaParse:
- API call with PDF content
- Returns markdown-formatted text with page numbers
- Preserves tables and structure

**And** the text is chunked:
- Chunk size: ~500 tokens with 50 token overlap
- Each chunk tagged with page number
- Bounding box preserved if available from LlamaParse

**And** embeddings are generated:
- Each chunk sent to OpenAI text-embedding-3-small
- Returns 1536-dimension vector
- Stored in document_chunks table

**And** processing completes:
- Document status updated to 'ready'
- Page count stored in document metadata
- Processing time logged

**And** error handling:
- LlamaParse failure → retry once, then mark 'failed' with error message
- OpenAI failure → retry with exponential backoff
- Partial failure → mark 'failed', log which step failed

**Prerequisites:** Story 4.1, Story 1.5

**Technical Notes:**
- Implement as Supabase Edge Function triggered by processing_jobs insert
- LlamaParse API key: LLAMA_CLOUD_API_KEY
- Chunking strategy: semantic chunking by paragraph/section, with max token limit
- Consider batch embedding API for efficiency
- Edge Function timeout: 150 seconds (Supabase limit)

---

### Story 4.7: Processing Queue Management

As the **system**,
I want **to manage document processing queue during high load**,
So that **uploads don't fail and processing is fair**.

**Acceptance Criteria:**

**Given** multiple documents are uploaded simultaneously
**When** processing jobs are queued
**Then** jobs are processed in FIFO order per agency:
- One active job per agency at a time
- Other jobs wait in pending state
- Cross-agency jobs can run in parallel

**And** queue status is visible:
- "Processing... (2 documents ahead)" for queued docs
- Realtime updates as queue advances

**And** stuck jobs are handled:
- Jobs running > 10 minutes without update → marked stale
- Stale jobs retried once, then marked failed
- Admin can manually retry failed jobs

**And** rate limiting:
- Max 10 documents per agency per hour (prevent abuse)
- Soft limit with warning toast, hard limit blocks upload

**Prerequisites:** Story 4.6

**Technical Notes:**
- Use processing_jobs table status field for queue management
- Postgres advisory locks or simple status check for concurrency
- Scheduled function to clean up stale jobs
- Consider dedicated queue service for scale (out of MVP scope)

---

## Epic 5: Document Q&A with Trust Transparency

**Goal:** Enable users to have natural language conversations with their documents, with every answer backed by source citations and confidence indicators. This is the core value proposition of docuMINE.

**User Value:** Users can ask questions about their insurance documents and get accurate, verifiable answers in seconds instead of hunting through PDFs manually.

**FRs Addressed:** FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR32, FR34

---

### Story 5.1: Chat Interface Layout (Split View)

As a **user**,
I want **to see my document and chat side-by-side**,
So that **I can ask questions while viewing the source material**.

**Acceptance Criteria:**

**Given** I select a document from the sidebar
**When** the document view loads
**Then** I see a split view layout:
- Left panel: Document Viewer (flexible width, min 40%)
- Right panel: Chat Panel (360px fixed width on desktop)
- Resizable divider between panels (optional for MVP)

**And** the Chat Panel contains:
- Conversation history (scrollable)
- Input area at bottom with "Ask a question..." placeholder
- Send button (arrow icon)

**And** keyboard shortcuts work:
- Enter sends message (Shift+Enter for newline)
- Focus automatically in input when document opens

**And** responsive adaptation:
- Tablet: Both panels visible, narrower
- Mobile: Tabbed view (Document / Chat tabs), swipe to switch

**And** the layout follows UX spec:
- Trustworthy Slate colors
- System font
- Clean separation between panels

**Prerequisites:** Story 4.3

**Technical Notes:**
- Implement in `@/app/(dashboard)/documents/[id]/page.tsx`
- Use CSS Grid or Flexbox for split view
- Chat panel component: `@/components/chat/chat-panel.tsx`
- Mobile detection via media queries or resize observer

---

### Story 5.2: Natural Language Query Input

As a **user**,
I want **to ask questions about my document in plain English**,
So that **I can find information without learning special syntax**.

**Acceptance Criteria:**

**Given** I am in the chat panel with a document selected
**When** I type a question
**Then** the input field:
- Expands to accommodate multi-line questions (up to 4 lines visible)
- Shows character count if approaching limit (1000 chars)
- Accepts natural language: "What's the liability limit?", "Is flood covered?", "List all exclusions"

**And** when I send (Enter or click Send):
- Input clears
- My message appears in conversation (right-aligned, primary color bubble)
- "Thinking..." indicator appears (assistant bubble with animated dots)
- Input disabled while waiting

**And** example questions are suggested for empty conversations:
- "What's the coverage limit?"
- "Are there any exclusions?"
- "What's the deductible?"
- Clicking suggestion fills input

**Prerequisites:** Story 5.1

**Technical Notes:**
- Textarea with auto-resize
- Store messages in local state until response complete, then persist
- Use React refs for input focus management
- Debounce suggestion clicks to prevent double-send

---

### Story 5.3: AI Response with Streaming & Trust Elements

As a **user**,
I want **to receive AI answers that stream in with source citations and confidence indicators**,
So that **I can read answers quickly and verify their accuracy**.

**Acceptance Criteria:**

**Given** I send a question
**When** the AI processes my query
**Then** the response streams in:
- Text appears word-by-word (50-100ms per word)
- Feels immediate, not waiting for full response
- User can read while more text appears

**And** when response completes, trust elements appear:
- Confidence badge: [✓ High Confidence] (green #d1fae5), [⚠ Needs Review] (amber #fef3c7), or [○ Not Found] (gray #f1f5f9)
- Source citation: "View in document →" link
- Badge uses 11px font, subtle but visible

**And** confidence thresholds:
- ≥85% similarity score → High Confidence
- 60-84% → Needs Review
- <60% or no relevant chunks → Not Found

**And** "Not Found" responses are clear:
- "I couldn't find information about that in this document."
- Suggests rephrasing or notes document may not contain that info
- [○ Not Found] badge

**And** error handling:
- API timeout → "I'm having trouble processing that. Please try again."
- Rate limit → "Too many requests. Please wait a moment."
- Generic error → "Something went wrong. Please try again." + retry button

**Prerequisites:** Story 5.2, Story 4.6

**Technical Notes:**
- API route: POST `/api/chat` with streaming response
- Use Server-Sent Events for streaming
- Stream format: `data: {"type": "text", "content": "..."}\n\n`
- Confidence calculated from vector similarity scores
- Store messages in chat_messages table after completion
- Reference Architecture doc "Trust-Transparent AI Responses" pattern

---

### Story 5.4: Source Citation Display

As a **user**,
I want **to see exactly where in the document an answer came from**,
So that **I can verify the AI's response is accurate**.

**Acceptance Criteria:**

**Given** an AI response includes a source citation
**When** I view the response
**Then** the citation shows:
- "View in document →" or "Page X →" link
- Styled subtly (small text, muted color until hover)

**And** multiple sources show as:
- "Sources: Page 3, Page 7, Page 12" (links)
- Or expandable "View 3 sources" if many

**And** the citation includes:
- Page number
- Snippet preview on hover (optional for MVP)

**And** response messages are saved with source metadata:
```typescript
sources: [{
  documentId: string,
  pageNumber: number,
  text: string,  // the quoted passage
  boundingBox?: { x, y, width, height }
}]
```

**Prerequisites:** Story 5.3

**Technical Notes:**
- Sources extracted during RAG pipeline
- Store top 1-3 most relevant chunks as sources
- Source click handling in next story (5.5)

---

### Story 5.5: Document Viewer with Highlight Navigation

As a **user**,
I want **to click a source citation and see the relevant passage highlighted in the document**,
So that **I can quickly verify the answer**.

**Acceptance Criteria:**

**Given** an AI response has a source citation
**When** I click the citation link
**Then** the document viewer:
- Scrolls to the relevant page (smooth scroll)
- Highlights the cited passage with yellow background (#fef08a)
- Highlight includes slight padding around text

**And** the highlight behavior:
- Highlight appears immediately on scroll
- Fades after 3 seconds (or click elsewhere)
- Can click highlight to keep it visible

**And** if bounding box data is available:
- Highlight exact region in rendered PDF
- Draw semi-transparent overlay

**And** if only page number is available:
- Scroll to top of page
- Flash the page (subtle pulse animation)

**And** document viewer features:
- PDF rendering with text layer (for selection)
- Page navigation (previous/next, page number input)
- Zoom controls (fit width, zoom in/out)
- Current page indicator: "Page X of Y"

**Prerequisites:** Story 5.4

**Technical Notes:**
- Use react-pdf or pdf.js for PDF rendering
- PDF viewer component: `@/components/documents/document-viewer.tsx`
- Maintain viewer state: current page, zoom level
- Sync scroll position to page number
- Text layer enables text selection and search
- Highlight coordinates from document_chunks.bounding_box

---

### Story 5.6: Conversation History & Follow-up Questions

As a **user**,
I want **to ask follow-up questions and see conversation history**,
So that **I can have a natural dialogue about my document**.

**Acceptance Criteria:**

**Given** I've asked questions about a document
**When** I ask a follow-up question
**Then** the AI has context from previous messages:
- Understands references like "What about for that?" or "Tell me more"
- Maintains conversation thread
- Up to 10 previous messages included in context

**And** conversation history is:
- Visible in chat panel (scrollable)
- Persisted across browser sessions
- Per-document (each document has its own conversation)

**And** I can start a new conversation:
- "New Chat" button clears current conversation
- Old conversation still saved, can access via "History" (optional for MVP)

**And** returning to a document:
- Shows last conversation
- Can continue where left off

**Prerequisites:** Story 5.3

**Technical Notes:**
- Store conversations in conversations table (per document)
- Store messages in chat_messages table with conversation_id
- Load last N messages for context window
- Include previous messages in RAG prompt for follow-up context
- Consider conversation summarization for long threads (post-MVP)

---

### Story 5.7: Responsive Chat Experience

As a **mobile/tablet user**,
I want **to ask questions about documents on smaller screens**,
So that **I can use docuMINE on any device**.

**Acceptance Criteria:**

**Given** I am on a tablet or mobile device
**When** I view a document
**Then** the layout adapts:

**Tablet (640-1024px):**
- Split view maintained but narrower
- Sidebar collapsed by default (hamburger toggle)
- Chat panel 40% width

**Mobile (<640px):**
- Tabbed interface: [Document] [Chat] tabs
- Swipe gesture to switch tabs
- Tab indicator shows current view
- Chat input fixed at bottom of screen

**And** touch-friendly interactions:
- All buttons minimum 44x44px touch targets
- Tap source citation → switch to Document tab + scroll to source
- No hover-dependent features (tooltips on tap instead)

**And** the experience maintains:
- Same trust elements (confidence, citations)
- Same streaming response feel
- Document readable at mobile zoom levels

**Prerequisites:** Story 5.5

**Technical Notes:**
- Use CSS media queries for breakpoint detection
- Tab state managed in React state
- Touch events for swipe (optional: use library)
- Test on actual mobile devices

---

## Epic 6: Quote Comparison

**Goal:** Enable users to compare multiple insurance quotes side-by-side, with automatic extraction of key data points, difference highlighting, and source verification.

**User Value:** Users can quickly compare carrier quotes to find the best coverage for their clients, identifying gaps and differences without manual spreadsheet work.

**FRs Addressed:** FR20, FR21, FR22, FR23, FR24, FR25, FR26

---

### Story 6.1: Quote Selection Interface

As a **user**,
I want **to select multiple documents for comparison**,
So that **I can compare quotes from different carriers**.

**Acceptance Criteria:**

**Given** I click "Compare" in the header navigation
**When** the comparison page loads (`/compare`)
**Then** I see a quote selection interface:
- "Select quotes to compare" heading
- Document cards showing available documents
- Checkbox on each card for selection
- Selected count: "2 of 4 selected"

**And** selection constraints:
- Minimum 2 documents required
- Maximum 4 documents allowed
- If <2 selected: "Compare" button disabled
- If at 4: additional selections blocked with tooltip "Maximum 4 quotes"

**And** alternative flow - upload new quotes:
- "Upload new quotes" button
- Opens upload zone (same as document upload)
- Newly uploaded docs appear in selection list

**And** when I click "Compare":
- Navigate to comparison view
- Show extraction progress

**Prerequisites:** Story 4.3

**Technical Notes:**
- Page: `@/app/(dashboard)/compare/page.tsx`
- Reuse document card component with selection variant
- Store selected document IDs in local state or URL params
- Filter to show only ready documents (not processing/failed)

---

### Story 6.2: Quote Data Extraction

As the **system**,
I want **to extract structured data from insurance quote documents**,
So that **quotes can be compared in a standardized format**.

**Acceptance Criteria:**

**Given** documents are selected for comparison
**When** extraction runs
**Then** the following fields are extracted from each quote:
- Carrier name
- Coverage type(s): Liability, Property, Auto, Umbrella, etc.
- Limits: Per occurrence, aggregate, per person, etc.
- Deductibles: Per claim, per occurrence
- Premium: Annual, monthly, or as stated
- Effective dates
- Named insured
- Key exclusions (list)

**And** extraction uses GPT-4o function calling:
- Structured output schema defines expected fields
- Document chunks as context
- Handles varied formats across carriers

**And** extraction progress shown:
- Per-document progress: "Extracting Hartford quote..."
- Per-field progress (optional): Show fields as they're extracted
- Total: "Extracting 3 of 4 quotes..."

**And** extraction handles edge cases:
- Field not found → null value with "Not found" display
- Ambiguous value → extract best match, flag for review
- Multiple policies in one doc → extract first/primary

**And** source references stored:
- Each extracted value includes page number
- Enables "view source" on any cell

**Prerequisites:** Story 6.1, Story 4.6

**Technical Notes:**
- API route: POST `/api/compare` with document IDs
- Use GPT-4o with function calling for structured extraction
- Schema defines all extractable fields with types
- Cache extraction results in database (don't re-extract same doc)
- Consider: extraction at upload time vs. on-demand (on-demand for MVP)

---

### Story 6.3: Comparison Table View

As a **user**,
I want **to see extracted quote data in a side-by-side table**,
So that **I can easily compare coverage details**.

**Acceptance Criteria:**

**Given** quote extraction is complete
**When** I view the comparison table
**Then** I see a table with:
- Columns: Field name, Quote 1, Quote 2, Quote 3, Quote 4 (as applicable)
- Rows: One per extracted field
- Column headers: Carrier name

**And** table formatting:
- Sticky header row (carrier names)
- Sticky first column (field names)
- Horizontal scroll if needed (4 quotes)
- Zebra striping for readability

**And** difference highlighting:
- Cells with different values: subtle highlight
- Best value in row: green indicator (●)
- Worst/lowest value: red indicator (○)
- "Best/worst" logic:
  - Limits: higher is better
  - Deductibles: lower is better
  - Premium: lower is better

**And** "Not found" handling:
- Gray text: "—" or "Not found"
- Doesn't participate in best/worst comparison

**And** table layout per UX spec:
- Trustworthy Slate colors
- Clean borders
- Readable typography

**Prerequisites:** Story 6.2

**Technical Notes:**
- Component: `@/components/compare/comparison-table.tsx`
- Best/worst logic configurable per field type
- Consider virtualized table for performance (probably overkill for 4 cols)
- Table responsive: horizontal scroll on smaller screens

---

### Story 6.4: Gap & Conflict Identification

As a **user**,
I want **to see coverage gaps and conflicts highlighted**,
So that **I can identify potential issues before recommending a quote**.

**Acceptance Criteria:**

**Given** quote comparison data is displayed
**When** I view gaps and conflicts
**Then** gaps are identified and flagged:
- Coverage present in one quote but missing in another
- Highlighted with warning icon (⚠) and amber background
- Tooltip: "Coverage not included in this quote"

**And** conflicts are identified:
- Same coverage with significantly different terms
- Example: one quote excludes flood, another includes
- Highlighted with conflict icon
- Tooltip explains the conflict

**And** a summary section shows:
- "3 potential gaps identified"
- "1 coverage conflict"
- Clicking summary scrolls to relevant rows

**And** gap/conflict detection covers:
- Missing coverage types
- Significantly different limits (>50% variance)
- Exclusion differences
- Deductible variances (>100% difference)

**Prerequisites:** Story 6.3

**Technical Notes:**
- Gap detection logic in extraction API response or client-side
- Define thresholds for "significant" differences
- Conflict types: missing, exclusion, limit_variance, deductible_variance
- Store gap/conflict data with comparison results

---

### Story 6.5: Source Citations in Comparison

As a **user**,
I want **to verify any extracted value by viewing its source**,
So that **I can trust the comparison data**.

**Acceptance Criteria:**

**Given** I view the comparison table
**When** I hover over or click a cell value
**Then** I see a "View source" option:
- Small link/icon in cell corner
- Or cell click shows popover with value + source link

**And** clicking "View source":
- Opens document viewer in modal or side panel
- Scrolls to relevant page
- Highlights the source passage (same as Q&A citations)

**And** source display shows:
- Document name
- Page number
- Excerpt of source text

**And** cells without source (AI inferred):
- No source link
- Tooltip: "Value inferred from document context"

**Prerequisites:** Story 6.3, Story 5.5

**Technical Notes:**
- Reuse document viewer component
- Modal or slide-out panel for source view
- Source citation stored during extraction
- Same highlight logic as chat source citations

---

### Story 6.6: Export Comparison Results

As a **user**,
I want **to export comparison results**,
So that **I can share them with clients or save for records**.

**Acceptance Criteria:**

**Given** I have a completed comparison
**When** I click "Export"
**Then** I see export options:
- PDF export (formatted comparison table)
- CSV export (raw data for spreadsheets)

**And** PDF export includes:
- docuMINE header/branding
- Comparison date
- Document names (carrier quotes compared)
- Full comparison table with highlighting
- Gaps/conflicts summary
- Footer: "Generated by docuMINE"

**And** CSV export includes:
- Header row: Field, Quote1, Quote2, Quote3, Quote4
- Data rows for all fields
- No styling (plain data)

**And** export completes:
- Progress indicator while generating
- Downloads automatically
- Success toast: "Comparison exported"

**And** filename format:
- PDF: `docuMINE-comparison-{date}.pdf`
- CSV: `docuMINE-comparison-{date}.csv`

**Prerequisites:** Story 6.3

**Technical Notes:**
- PDF generation: react-pdf or server-side with puppeteer
- CSV: simple text generation, blob download
- Consider client-side generation for speed
- PDF should render cleanly for printing

---

## FR Coverage Matrix

| FR | Description | Epic | Story | Status |
|----|-------------|------|-------|--------|
| FR1 | Account creation with email/password | Epic 2 | 2.1, 2.2 | ✓ |
| FR2 | Secure login with persistent sessions | Epic 2 | 2.3, 2.4 | ✓ |
| FR3 | Password reset via email | Epic 2 | 2.5 | ✓ |
| FR4 | Profile updates | Epic 2 | 2.6 | ✓ |
| FR5 | Admin invites users | Epic 3 | 3.2 | ✓ |
| FR6 | Admin removes users | Epic 3 | 3.3 | ✓ |
| FR7 | Subscription/billing management | Epic 3 | 3.4 | ✓ |
| FR8 | Upload PDF documents | Epic 4 | 4.1, 4.2 | ✓ |
| FR9 | View document list | Epic 4 | 4.3 | ✓ |
| FR10 | Delete documents | Epic 4 | 4.4 | ✓ |
| FR11 | Organize/label documents | Epic 4 | 4.5 | ✓ |
| FR12 | Process and index documents | Epic 4 | 4.6, 4.7 | ✓ |
| FR13 | Natural language Q&A | Epic 5 | 5.1, 5.2 | ✓ |
| FR14 | Extract answers from documents | Epic 5 | 5.2, 5.3 | ✓ |
| FR15 | Source citations on answers | Epic 5 | 5.3, 5.4 | ✓ |
| FR16 | Confidence indicators | Epic 5 | 5.3 | ✓ |
| FR17 | Click-to-view source in document | Epic 5 | 5.4, 5.5 | ✓ |
| FR18 | Follow-up questions (conversation) | Epic 5 | 5.6 | ✓ |
| FR19 | Clear "not found" responses | Epic 5 | 5.3 | ✓ |
| FR20 | Select 2-4 documents for comparison | Epic 6 | 6.1 | ✓ |
| FR21 | Auto-extract quote data | Epic 6 | 6.2 | ✓ |
| FR22 | Aligned comparison view | Epic 6 | 6.3 | ✓ |
| FR23 | Highlight differences | Epic 6 | 6.3 | ✓ |
| FR24 | Flag gaps/conflicts | Epic 6 | 6.4 | ✓ |
| FR25 | Source citations for comparison data | Epic 6 | 6.5 | ✓ |
| FR26 | Export comparison results | Epic 6 | 6.6 | ✓ |
| FR27 | Isolated agency data | Epic 1, 2, 4 | 1.2, 2.2, 4.1 | ✓ |
| FR28 | Admin usage metrics | Epic 3 | 3.5 | ✓ |
| FR29 | Agency settings | Epic 3 | 3.1 | ✓ |
| FR30 | Seat limit enforcement | Epic 3 | 3.2, 3.4 | ✓ |
| FR31 | Browser compatibility | Epic 1 | 1.1 | ✓ |
| FR32 | Responsive design | Epic 5 | 5.7 | ✓ |
| FR33 | Processing queue | Epic 4 | 4.7 | ✓ |
| FR34 | Clear error messages | Epic 1, 5 | 1.5, 5.3 | ✓ |

**Coverage: 34/34 FRs (100%)**

---

## Summary

**Epic Breakdown Complete!**

| Epic | Stories | FRs Covered |
|------|---------|-------------|
| Epic 1: Foundation & Infrastructure | 6 stories | FR31, FR33, FR34 |
| Epic 2: User Authentication & Onboarding | 6 stories | FR1-4, FR27 |
| Epic 3: Agency & Team Management | 5 stories | FR5-7, FR28-30 |
| Epic 4: Document Upload & Management | 7 stories | FR8-12, FR27, FR33 |
| Epic 5: Document Q&A with Trust Transparency | 7 stories | FR13-19, FR32, FR34 |
| Epic 6: Quote Comparison | 6 stories | FR20-26 |
| **Total** | **37 stories** | **34 FRs (100%)** |

**Context Incorporated:**
- ✅ PRD requirements - All 34 FRs mapped to stories
- ✅ UX Design patterns - Trustworthy Slate theme, split view layout, streaming responses, confidence badges
- ✅ Architecture decisions - Supabase stack, pgvector, LlamaParse, streaming SSE, RLS policies

**Implementation Sequence:**
1. Epic 1 → Foundation (must be first)
2. Epic 2 → Authentication (users can access)
3. Epic 4 → Document Management (users can upload)
4. Epic 5 → Document Q&A (core value - users can chat)
5. Epic 3 → Agency Management (team features)
6. Epic 6 → Quote Comparison (second pillar)

**Ready for Phase 4 Implementation!**

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._

_This document was generated through the BMad Method epic decomposition workflow._
