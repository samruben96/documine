# Security Architecture

## Authentication Flow

```
1. User signs up/logs in via Supabase Auth
2. Supabase issues JWT with user.id
3. JWT stored in httpOnly cookie (via @supabase/ssr)
4. Every request includes cookie
5. Supabase validates JWT, sets auth.uid()
6. RLS policies use auth.uid() to filter data
```

## Data Protection

| Layer | Protection |
|-------|------------|
| Transit | TLS 1.3 (Vercel + Supabase) |
| At rest | AES-256 (Supabase managed) |
| Passwords | bcrypt via Supabase Auth |
| API Keys | Environment variables, never client-side |
| File access | Signed URLs with expiration |

## Security Headers

```typescript
// next.config.js
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];
```

## Rate Limiting

Implement at Vercel Edge:

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
});

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }
}
```
