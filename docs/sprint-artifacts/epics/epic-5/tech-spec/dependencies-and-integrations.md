# Dependencies and Integrations

## NPM Dependencies (Already Installed)

| Package | Version | Purpose |
|---------|---------|---------|
| @supabase/supabase-js | ^2.84.0 | Database queries, RLS-enforced access |
| @supabase/ssr | ^0.7.0 | Server-side Supabase client for API routes |
| openai | ^6.9.1 | GPT-4o chat completions + embeddings |
| zod | ^4.1.13 | Request validation (use `.issues` not `.errors`) |
| sonner | ^2.0.7 | Toast notifications for errors |
| lucide-react | ^0.554.0 | Icons (Send, MessageSquare, FileText, etc.) |
| next | 16.0.4 | App Router with streaming response support |

## New Dependencies Required

| Package | Version | Purpose | Install Command |
|---------|---------|---------|-----------------|
| react-pdf | ^9.2.1 | PDF rendering in document viewer | `npm install react-pdf` |
| pdfjs-dist | ^4.10.38 | PDF.js worker for react-pdf | `npm install pdfjs-dist` |

**Installation Command:**
```bash
npm install react-pdf pdfjs-dist
```

**Note:** react-pdf requires PDF.js worker configuration. Add to `next.config.ts`:
```typescript
// next.config.ts
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};
```

## External Services

| Service | Purpose | API Documentation |
|---------|---------|-------------------|
| OpenAI GPT-4o | Response generation with streaming | https://platform.openai.com/docs/api-reference/chat |
| OpenAI Embeddings | Query embedding (text-embedding-3-small) | https://platform.openai.com/docs/guides/embeddings |
| Supabase PostgreSQL | Conversations, messages, vector search | https://supabase.com/docs/guides/database |
| pgvector | Semantic similarity search | https://github.com/pgvector/pgvector |

## Environment Variables

**Already Configured (from previous epics):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...
```

**No new environment variables required for Epic 5.**

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS APPLICATION                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Chat Panel  │  │ Chat Input   │  │   Document Viewer     │  │
│  │  (messages)  │  │ (useChat)    │  │   (react-pdf)         │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬───────────┘  │
│         │                 │                      │               │
│         └────────────┬────┴──────────────────────┘               │
│                      │                                           │
│              ┌───────▼───────┐                                   │
│              │ /api/chat     │ ◄── Streaming SSE endpoint        │
│              │ (POST)        │                                   │
│              └───────┬───────┘                                   │
└──────────────────────┼──────────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  Supabase   │ │  OpenAI     │ │  OpenAI     │
│  PostgreSQL │ │  Embeddings │ │  GPT-4o     │
│  +pgvector  │ │  API        │ │  Streaming  │
└─────────────┘ └─────────────┘ └─────────────┘
      │
      │ Vector similarity search:
      │ SELECT * FROM document_chunks
      │ WHERE document_id = $1
      │ ORDER BY embedding <=> $query_vector
      │ LIMIT 5
      │
      └──► Returns top 5 chunks with similarity scores
```

## Database Tables Used

**From Epic 1 (no changes needed):**
- `conversations` - Stores conversation sessions per document
- `chat_messages` - Stores individual messages with sources/confidence
- `document_chunks` - Vector embeddings for RAG retrieval (from Epic 4)
- `documents` - Document metadata for access verification

**Indexes Required (already created in Epic 1):**
- `idx_conversations_document` on conversations(document_id)
- `idx_chat_messages_conversation` on chat_messages(conversation_id)
- `idx_document_chunks_embedding` using IVFFlat for vector search
- `idx_document_chunks_document` on document_chunks(document_id)
