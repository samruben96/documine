# Non-Functional Requirements

## Performance

| Requirement | Target | Implementation |
|-------------|--------|----------------|
| Team list load | < 500ms | Single query with user count |
| Invitation send | < 3s | Background email, optimistic UI |
| Metrics calculation | < 2s | Aggregate queries, consider caching |
| Role change | < 500ms | Simple UPDATE |

## Security

| Requirement | Implementation | Source |
|-------------|----------------|--------|
| Admin-only operations | Server-side role check before all admin actions | FR5, FR6, FR7 |
| Invitation token security | Managed by Supabase Auth (secure token generation) | Best practice |
| Seat limit enforcement | Database-level check before invite creation | FR30 |
| Cross-agency protection | RLS policies on all tables | Architecture |
| Service role key protection | Server-side only for `auth.admin` calls | Supabase docs |

## Reliability/Availability

| Requirement | Target | Implementation |
|-------------|--------|----------------|
| Invitation email delivery | 99% within 60 seconds | Supabase built-in email SLA |
| Team operations | Atomic with rollback | Database transactions |
| Auth admin API availability | 99.9% | Supabase managed service |

## Observability

| Signal | Implementation |
|--------|----------------|
| Invitations sent | Log: agency_id, email (hashed), invited_by |
| Role changes | Log: agency_id, user_id, old_role, new_role |
| Member removals | Log: agency_id, removed_user_id, removed_by |
| Tier changes | Log: agency_id, old_tier, new_tier (manual changes) |
