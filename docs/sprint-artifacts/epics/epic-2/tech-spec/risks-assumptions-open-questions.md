# Risks, Assumptions, Open Questions

## Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| R1: Email delivery delays | Users frustrated waiting for reset | Low | Resend has 99% SLA; show "check spam" message |
| R2: Session token leakage | Security breach | Low | httpOnly cookies, Secure flag, short expiry |
| R3: Atomic transaction failure | Orphaned auth users | Medium | Use Supabase RPC with transaction; implement cleanup |
| R4: Password brute force | Account compromise | Medium | Supabase built-in rate limiting; add Upstash post-MVP |

## Assumptions

| Assumption | Rationale |
|------------|-----------|
| A1: Supabase Auth handles password hashing securely | Industry-standard bcrypt implementation |
| A2: Single agency per user is sufficient for MVP | PRD specifies one agency per user |
| A3: Email verification not required for MVP | Lower friction signup; can add later |
| A4: Google OAuth can be added later without schema changes | Supabase Auth supports multiple providers |

## Open Questions

| Question | Owner | Status |
|----------|-------|--------|
| Q1: Should we require email verification before allowing document uploads? | Sam | Deferred - not for MVP |
| Q2: Rate limiting implementation - Supabase built-in vs Upstash? | Sam | Use Supabase for MVP, evaluate Upstash later |
| Q3: Should "Remember me" be 7 days or 30 days? | Sam | Decision: 7 days for MVP |
