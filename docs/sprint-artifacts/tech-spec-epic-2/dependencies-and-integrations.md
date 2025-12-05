# Dependencies and Integrations

## NPM Dependencies (Already Installed)

| Package | Version | Purpose |
|---------|---------|---------|
| @supabase/supabase-js | ^2.84.0 | Supabase client |
| @supabase/ssr | ^0.7.0 | Server-side session handling |
| zod | ^4.1.13 | Form validation |
| next | 16.0.4 | Framework |
| react | 19.2.0 | UI library |

## New Dependencies Required

| Package | Version | Purpose |
|---------|---------|---------|
| resend | latest | Transactional email for password reset |
| react-hook-form | latest | Form state management (optional but recommended) |
| @hookform/resolvers | latest | Zod integration with react-hook-form |

## External Services

| Service | Purpose | Configuration |
|---------|---------|---------------|
| Supabase Auth | User authentication | Project URL + keys (already configured) |
| Resend | Password reset emails | RESEND_API_KEY environment variable |

## Environment Variables (New)

```bash
# Add to existing .env.local
RESEND_API_KEY=re_xxxxxxxxxxxx       # Resend API key for emails
NEXT_PUBLIC_APP_URL=http://localhost:3000  # For password reset links
```
