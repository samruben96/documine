# Risks, Assumptions, Open Questions

## Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| R1: Supabase email delivery issues | Users don't receive invites | Medium | Supabase built-in email may have deliverability limits; provide resend option |
| R2: Service role key exposure | Unauthorized admin operations | Low | Server-side only, never expose to client |
| R3: Email delivery to spam | Users don't see invites | Medium | Resend option in UI, check spam instructions |
| R4: Concurrent seat modifications | Over-invitation | Low | Database-level seat check in transaction |

## Assumptions

| Assumption | Rationale |
|------------|-----------|
| A1: Three subscription tiers sufficient for MVP | PRD specifies Starter/Professional/Agency |
| A2: Manual tier assignment acceptable for MVP | Per Epic 2 retro - Stripe deferred to future epic |
| A3: Supabase built-in email sufficient for invitations | Per Epic 2 retro - Resend needs custom domain |
| A4: 7-day invitation expiry is reasonable | Managed by Supabase Auth |
| A5: Usage metrics don't need real-time accuracy | Page-load refresh is sufficient |

## Open Questions

| Question | Owner | Status |
|----------|-------|--------|
| Q1: Should removed users be soft-deleted for audit trail? | Sam | Decision: Hard delete for MVP, audit later |
| Q2: What happens to documents uploaded by removed user? | Sam | Decision: Documents remain with agency |
| Q3: Should we email users when their role changes? | Sam | Deferred - not for MVP |
