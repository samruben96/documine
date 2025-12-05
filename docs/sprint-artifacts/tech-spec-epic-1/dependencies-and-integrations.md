# Dependencies and Integrations

## NPM Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| next | 15.x | React framework |
| react | 19.x | UI library |
| typescript | 5.x | Type safety |
| tailwindcss | 3.x | Styling |
| @supabase/supabase-js | latest | Supabase client |
| @supabase/ssr | latest | SSR utilities |
| zod | latest | Schema validation |
| openai | latest | AI client (installed but not used until Epic 4-5) |

## Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| eslint | latest | Code linting |
| @types/node | latest | Node.js types |
| supabase | latest | CLI tools |

## External Services

| Service | Purpose | Configuration |
|---------|---------|---------------|
| Supabase | Database, Storage, Auth | Project URL + keys |
| Vercel | Deployment | GitHub integration |

## Environment Variables

```bash
# Required for all environments
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase anon key (public)
SUPABASE_SERVICE_ROLE_KEY=        # Supabase service role (server-only)

# Required but not used until Epic 4-5
OPENAI_API_KEY=                   # OpenAI API key
LLAMA_CLOUD_API_KEY=              # LlamaParse API key
RESEND_API_KEY=                   # Email service (Epic 2)
```
