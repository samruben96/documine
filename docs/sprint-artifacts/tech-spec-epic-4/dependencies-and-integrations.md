# Dependencies and Integrations

## NPM Dependencies (Already Installed)

| Package | Version | Purpose |
|---------|---------|---------|
| @supabase/supabase-js | ^2.84.0 | Database + Storage + Realtime |
| @supabase/ssr | ^0.7.0 | Server-side Supabase client |
| openai | ^6.9.1 | Embeddings generation |
| zod | ^4.1.13 | Validation (use `.issues` not `.errors`) |
| react-hook-form | ^7.66.1 | Form handling |
| @hookform/resolvers | ^5.2.2 | Zod resolver for react-hook-form |
| sonner | ^2.0.7 | Toast notifications |
| lucide-react | ^0.554.0 | Icons |

## New Dependencies Required

| Package | Version | Purpose | Install Command |
|---------|---------|---------|-----------------|
| react-dropzone | ^14.3.5 | Drag-and-drop file upload zone | `npm install react-dropzone` |
| react-pdf | ^9.2.1 | PDF rendering in document viewer | `npm install react-pdf` |
| pdfjs-dist | ^4.10.38 | PDF.js worker for react-pdf | `npm install pdfjs-dist` |

**Installation Command:**
```bash
npm install react-dropzone react-pdf pdfjs-dist
```

**Note:** LlamaParse is called via REST API from Edge Function (no npm package needed for Deno runtime).

## External Services

| Service | Purpose | API Documentation |
|---------|---------|-------------------|
| Docling (Self-hosted) | PDF/DOCX/XLSX extraction with 97.9% table accuracy | https://github.com/docling-project/docling |
| ~~LlamaParse (LlamaIndex Cloud)~~ | ~~PDF extraction~~ (DEPRECATED - replaced by Docling) | ~~https://docs.cloud.llamaindex.ai/~~ |
| OpenAI Embeddings | text-embedding-3-small (1536 dim) | https://platform.openai.com/docs/guides/embeddings |
| Supabase Storage | S3-compatible file storage | https://supabase.com/docs/guides/storage |
| Supabase Realtime | Live status updates | https://supabase.com/docs/guides/realtime |

## Environment Variables

**Already Configured (from Epic 1):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...
```

**New for Epic 4 (Post Story 4.8 Migration):**
```bash
# DEPRECATED: LLAMA_CLOUD_API_KEY=llx-...  # Replaced by Docling
DOCLING_SERVICE_URL=http://localhost:8000  # Local development
# DOCLING_SERVICE_URL=https://docling.your-domain.com  # Production
```

**Edge Function Environment:**
```bash
# Set in Supabase Dashboard > Edge Functions > Secrets
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...
DOCLING_SERVICE_URL=https://docling.your-domain.com  # Docling service URL
# DEPRECATED: LLAMA_CLOUD_API_KEY (removed after Story 4.8)
```

## Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS APPLICATION                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │ Upload Zone  │  │ Document List│  │   Document Viewer     │  │
│  │ (react-drop) │  │              │  │   (react-pdf)         │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬───────────┘  │
└─────────┼─────────────────┼──────────────────────┼──────────────┘
          │                 │                      │
          ▼                 ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐   │
│  │ Storage  │  │ Database │  │ Realtime │  │ Edge Functions │   │
│  │ (PDFs)   │  │ +pgvector│  │ (status) │  │ (processing)   │   │
│  └──────────┘  └──────────┘  └──────────┘  └───────┬────────┘   │
└────────────────────────────────────────────────────┼────────────┘
                                                     │
          ┌──────────────────────────────────────────┼───────┐
          │                                          │       │
          ▼                                          ▼       ▼
┌─────────────────────┐                    ┌─────────────────────┐
│    Docling Service  │                    │      OpenAI         │
│    (Self-hosted)    │                    │   (Embeddings)      │
│    PDF/DOCX/XLSX    │                    │   text-embedding-   │
│    → Markdown       │                    │   3-small           │
│    ~2.45 pages/sec  │                    │                     │
└─────────────────────┘                    └─────────────────────┘
```

## Database Migrations Required

```sql
-- Migration: add_document_organization_fields
-- File: supabase/migrations/XXXXXX_add_document_organization.sql

-- Add display_name for rename functionality
ALTER TABLE documents ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Add labels as JSONB array for tagging
ALTER TABLE documents ADD COLUMN IF NOT EXISTS labels JSONB DEFAULT '[]';

-- Add GIN index for label filtering
CREATE INDEX IF NOT EXISTS idx_documents_labels ON documents USING gin(labels);

-- Optional: Agency-level label definitions for autocomplete
CREATE TABLE IF NOT EXISTS document_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#475569',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agency_id, name)
);

ALTER TABLE document_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Labels scoped to agency" ON document_labels
  FOR ALL USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));
```

## Supabase Edge Function Deployment

```bash
# Deploy document processing Edge Function
npx supabase functions deploy process-document --project-ref <project-ref>

# Set secrets for Edge Function
npx supabase secrets set OPENAI_API_KEY=sk-... --project-ref <project-ref>
npx supabase secrets set LLAMA_CLOUD_API_KEY=llx-... --project-ref <project-ref>
```
