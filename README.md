# Documine

AI-powered document analysis platform with trust transparency.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (PostgreSQL + pgvector)
- **Auth:** Supabase Auth
- **Styling:** Tailwind CSS v4
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase CLI (`npm install -g supabase`)

### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```
4. Start Supabase locally:
   ```bash
   npx supabase start
   ```
5. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the result.

## Deployment

### Production Deployment

Push to `main` branch triggers automatic deployment to Vercel:

```bash
git push origin main
```

Production URL: https://documine.vercel.app

### Preview Deployments

Create a PR to get an automatic preview deployment URL in the PR comments.

### Database Migrations

Push migrations to production Supabase:

```bash
npx supabase db push
```

Generate TypeScript types from remote:

```bash
npx supabase gen types typescript --linked > src/types/database.types.ts
```

## Environment Variables

Required environment variables (configure in Vercel dashboard):

| Variable | Description | Scope |
|----------|-------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Server-only |
| `OPENAI_API_KEY` | OpenAI API key | Server-only |
| `LLAMA_CLOUD_API_KEY` | LlamaParse API key | Server-only |
| `RESEND_API_KEY` | Resend email service key | Server-only |

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── (auth)/          # Authentication routes
│   ├── (dashboard)/     # Protected dashboard routes
│   └── api/             # API routes
├── components/          # React components
│   ├── ui/              # shadcn/ui components
│   ├── chat/            # Chat interface components
│   ├── documents/       # Document management components
│   └── compare/         # Quote comparison components
├── lib/                 # Shared utilities
│   ├── supabase/        # Supabase client configuration
│   └── utils/           # Helper functions
└── types/               # TypeScript type definitions
```
