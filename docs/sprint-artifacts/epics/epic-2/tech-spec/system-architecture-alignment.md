# System Architecture Alignment

**Components Referenced:**
- Supabase Auth for email/password authentication
- Supabase PostgreSQL with RLS policies for agency isolation
- Next.js 15 App Router for page routing
- Resend for transactional emails (password reset)
- @supabase/ssr for cookie-based session management
- Zod for form validation schemas

**Architecture Constraints:**
- All authenticated routes must check session via middleware
- User records link to `auth.users.id` as foreign key
- Every user belongs to exactly one agency
- First user of an agency automatically becomes `admin`
- Session tokens stored in httpOnly cookies (not localStorage)
- Password requirements: 8+ characters, 1 uppercase, 1 number, 1 special character

**Key Decisions Applied:**
- ADR-001: Supabase-Native authentication (unified with database)
- ADR-004: Row Level Security for agency isolation (user.agency_id matches data)
- UX Principle: Zero learning curve - signup form is single page, no multi-step wizard
