# Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         VERCEL                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Edge Network (Global)                               │   │
│  │  - Static assets                                     │   │
│  │  - Middleware (rate limiting, auth check)            │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Serverless Functions (Regional)                     │   │
│  │  - API routes                                        │   │
│  │  - SSR pages                                         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        SUPABASE                             │
│  Region: us-east-1 (match Vercel region)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Database │  │ Storage  │  │   Auth   │  │   Edge     │  │
│  │ (Postgres│  │ (S3)     │  │          │  │  Functions │  │
│  │ +pgvector│  │          │  │          │  │  (Deno)    │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Environment Configuration

```bash
# .env.local (development)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-key

OPENAI_API_KEY=sk-...
DOCLING_SERVICE_URL=http://localhost:8000  # Local Docling service
RESEND_API_KEY=re_...

# Production (Vercel Environment Variables)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

OPENAI_API_KEY=sk-...
DOCLING_SERVICE_URL=https://docling-for-documine-production.up.railway.app
RESEND_API_KEY=re_...
```
