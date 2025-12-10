# Development Environment

## Prerequisites

- Node.js 20+
- Docker Desktop (for local Supabase)
- Git

## Setup Commands

```bash
# Clone repository
git clone https://github.com/your-org/documine.git
cd documine

# Install dependencies
npm install

# Start local Supabase
npx supabase start

# Apply migrations
npx supabase db push

# Generate types
npx supabase gen types typescript --local > src/lib/database.types.ts

# Copy environment file
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
```

## Development Workflow

```bash
# Create new migration
npx supabase migration new add_feature_x

# Apply migrations locally
npx supabase db push

# Reset database (destructive)
npx supabase db reset

# Generate types after schema changes
npx supabase gen types typescript --local > src/lib/database.types.ts

# Deploy Edge Function
npx supabase functions deploy process-document

# Run tests
npm test

# Run subset of tests (Story 21.2.5)
npm run test:changed    # Only tests affected by uncommitted changes
npm run test:components # Component tests only
npm run test:hooks      # Hook tests only
npm run test:lib        # Library/utility tests only
npm run test:ai-buddy   # AI Buddy feature tests
npm run test:admin      # Admin feature tests

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build
```
