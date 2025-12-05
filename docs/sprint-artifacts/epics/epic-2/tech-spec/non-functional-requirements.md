# Non-Functional Requirements

## Performance

| Requirement | Target | Implementation |
|-------------|--------|----------------|
| Form submission | < 2s end-to-end | Server actions, no client-side API calls |
| Page load (auth pages) | < 1s | Static generation where possible |
| Session validation | < 50ms | Cookie-based, no DB query needed |
| Password reset email | < 5s delivery | Resend API with retries |

## Security

| Requirement | Implementation | Source |
|-------------|----------------|--------|
| Password hashing | bcrypt via Supabase Auth | NFR8 |
| Session tokens | httpOnly cookies, Secure flag | NFR9 |
| CSRF protection | Next.js Server Actions (built-in) | Best practice |
| Password strength | Enforced via Zod schema | FR1 |
| Rate limiting | Supabase Auth built-in (post-MVP: Upstash) | NFR9 |
| Token expiry | 7 days (remember me) / session (default) | NFR9 |

**Password Policy:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character

**Session Policy:**
- Default: Session-only cookie (expires on browser close)
- "Remember me": 7-day expiry
- Auto-refresh before expiry

## Reliability/Availability

| Requirement | Target | Implementation |
|-------------|--------|----------------|
| Auth availability | 99.9% | Supabase managed service |
| Email delivery | 99% within 5 seconds | Resend SLA |
| Error recovery | Graceful fallbacks | Error boundaries, retry buttons |

## Observability

| Signal | Implementation |
|--------|----------------|
| Login attempts | Log: email (hashed), success/failure, timestamp |
| Signup events | Log: agency created, user created |
| Password resets | Log: requested (hashed email), completed |
| Session errors | Log: token refresh failures |

**Log Format:**
```json
{
  "level": "info",
  "event": "auth.login.success",
  "userId": "uuid",
  "agencyId": "uuid",
  "timestamp": "ISO-8601"
}
```
