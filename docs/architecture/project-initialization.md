# Project Initialization

**First implementation story should execute:**

```bash
# Create Next.js app
npx create-next-app@latest documine --typescript --tailwind --eslint --app --src-dir

# Initialize Supabase
cd documine
npm install @supabase/supabase-js @supabase/ssr
npx supabase init
npx supabase start  # Local dev with Docker

# Add UI components
npx shadcn@latest init
npx shadcn@latest add button input card dialog table tabs toast

# Add additional dependencies
npm install openai resend zod
```

This establishes the base architecture with these decisions:

| Decision | Solution | Provider |
|----------|----------|----------|
| Framework | Next.js 15 (App Router) | create-next-app |
| Language | TypeScript (strict mode) | create-next-app |
| Styling | Tailwind CSS | create-next-app |
| Linting | ESLint | create-next-app |
| Database | PostgreSQL | Supabase |
| Vector Search | pgvector | Supabase (extension) |
| File Storage | S3-compatible storage | Supabase Storage |
| Authentication | Email/password + OAuth | Supabase Auth |
| Multi-Tenancy | Row Level Security (RLS) | Supabase (native) |

**Why Supabase-native instead of T3 + Prisma:**
1. Unified platform for DB + Vectors + Storage + Auth
2. Native RLS for multi-tenant agency isolation
3. No ORM abstraction fighting pgvector
4. Simpler architecture, fewer moving parts
5. Generated TypeScript types from database schema

**Post-initialization steps:**
```bash
# Enable pgvector extension (in Supabase dashboard or migration)
create extension if not exists vector with schema extensions;

# Generate TypeScript types from your schema
npx supabase gen types typescript --local > src/lib/database.types.ts

# Start development
npm run dev
```
