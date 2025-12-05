# Project Structure

```
documine/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth routes (login, signup, reset)
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── (dashboard)/              # Protected routes
│   │   │   ├── documents/            # Document management
│   │   │   │   ├── page.tsx          # Document list
│   │   │   │   └── [id]/page.tsx     # Document view + chat
│   │   │   ├── compare/              # Quote comparison
│   │   │   │   └── page.tsx
│   │   │   └── settings/             # Agency settings
│   │   │       └── page.tsx
│   │   ├── api/                      # API routes
│   │   │   ├── chat/route.ts         # Streaming chat endpoint
│   │   │   ├── documents/
│   │   │   │   ├── route.ts          # CRUD operations
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       └── extract/route.ts
│   │   │   └── compare/route.ts      # Quote comparison
│   │   ├── layout.tsx
│   │   └── page.tsx                  # Landing/redirect
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── chat/                     # Chat-specific components
│   │   │   ├── chat-message.tsx
│   │   │   ├── chat-input.tsx
│   │   │   ├── confidence-badge.tsx
│   │   │   └── source-citation.tsx
│   │   ├── documents/                # Document components
│   │   │   ├── document-viewer.tsx
│   │   │   ├── document-list.tsx
│   │   │   └── upload-zone.tsx
│   │   ├── compare/                  # Comparison components
│   │   │   └── comparison-table.tsx
│   │   └── layout/                   # Layout components
│   │       ├── sidebar.tsx
│   │       ├── header.tsx
│   │       └── split-view.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser client
│   │   │   ├── server.ts             # Server client
│   │   │   └── middleware.ts         # Auth middleware
│   │   ├── openai/
│   │   │   ├── client.ts             # OpenAI client
│   │   │   ├── embeddings.ts         # Embedding generation
│   │   │   └── chat.ts               # Chat completion
│   │   ├── docling/
│   │   │   └── client.ts             # Docling client
│   │   ├── email/
│   │   │   └── resend.ts             # Resend client
│   │   └── utils/
│   │       ├── pdf.ts                # PDF utilities
│   │       └── vectors.ts            # Vector operations
│   ├── hooks/                        # Custom React hooks
│   │   ├── use-chat.ts
│   │   ├── use-documents.ts
│   │   └── use-comparison.ts
│   └── types/
│       ├── database.types.ts         # Generated Supabase types
│       └── index.ts                  # App-specific types
├── supabase/
│   ├── migrations/                   # Database migrations
│   │   ├── 00001_initial_schema.sql
│   │   ├── 00002_enable_pgvector.sql
│   │   └── 00003_rls_policies.sql
│   ├── functions/                    # Edge Functions
│   │   └── process-document/
│   │       └── index.ts
│   └── config.toml
├── public/
├── .env.local                        # Local environment variables
├── .env.example                      # Environment template
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```
