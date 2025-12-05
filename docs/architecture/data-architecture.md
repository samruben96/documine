# Data Architecture

## Core Tables

```sql
-- Agencies (tenants)
create table agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subscription_tier text not null default 'starter',
  seat_limit integer not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Users
create table users (
  id uuid primary key references auth.users(id),
  agency_id uuid not null references agencies(id),
  email text not null,
  full_name text,
  role text not null default 'member', -- 'admin' | 'member'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Documents
create table documents (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id),
  uploaded_by uuid not null references users(id),
  filename text not null,
  storage_path text not null,
  status text not null default 'processing', -- 'processing' | 'ready' | 'failed'
  page_count integer,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Document chunks (for vector search)
create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  agency_id uuid not null references agencies(id),
  content text not null,
  page_number integer not null,
  chunk_index integer not null,
  bounding_box jsonb, -- {x, y, width, height} if available
  embedding vector(1536) not null,
  created_at timestamptz not null default now()
);

-- Chat conversations
create table conversations (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id),
  document_id uuid not null references documents(id),
  user_id uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Chat messages
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  agency_id uuid not null references agencies(id),
  role text not null, -- 'user' | 'assistant'
  content text not null,
  sources jsonb, -- Array of source citations
  confidence text, -- 'high' | 'needs_review' | 'not_found'
  created_at timestamptz not null default now()
);

-- Processing jobs queue
create table processing_jobs (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  status text not null default 'pending', -- 'pending' | 'processing' | 'completed' | 'failed'
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_documents_agency on documents(agency_id);
create index idx_document_chunks_document on document_chunks(document_id);
create index idx_document_chunks_embedding on document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index idx_conversations_document on conversations(document_id);
create index idx_chat_messages_conversation on chat_messages(conversation_id);
create index idx_processing_jobs_status on processing_jobs(status) where status = 'pending';
```

## RLS Policies

```sql
-- Enable RLS on all tables
alter table agencies enable row level security;
alter table users enable row level security;
alter table documents enable row level security;
alter table document_chunks enable row level security;
alter table conversations enable row level security;
alter table chat_messages enable row level security;
alter table processing_jobs enable row level security;

-- Users can only see their own agency
create policy "Users see own agency" on agencies
  for select using (id = (select agency_id from users where id = auth.uid()));

-- Users can only see users in their agency
create policy "Users see agency members" on users
  for select using (agency_id = (select agency_id from users where id = auth.uid()));

-- Documents scoped to agency
create policy "Documents scoped to agency" on documents
  for all using (agency_id = (select agency_id from users where id = auth.uid()));

-- Document chunks scoped to agency
create policy "Chunks scoped to agency" on document_chunks
  for all using (agency_id = (select agency_id from users where id = auth.uid()));

-- Conversations scoped to agency
create policy "Conversations scoped to agency" on conversations
  for all using (agency_id = (select agency_id from users where id = auth.uid()));

-- Chat messages scoped to agency
create policy "Messages scoped to agency" on chat_messages
  for all using (agency_id = (select agency_id from users where id = auth.uid()));

-- Processing jobs - service role only (Edge Functions)
create policy "Jobs service role only" on processing_jobs
  for all using (auth.role() = 'service_role');
```

## Storage Policies

```sql
-- Storage bucket: documents
-- Path structure: {agency_id}/{document_id}/{filename}

-- Users can upload to their agency folder
create policy "Upload to agency folder" on storage.objects
  for insert with check (
    bucket_id = 'documents' and
    (storage.foldername(name))[1] = (select agency_id::text from users where id = auth.uid())
  );

-- Users can read from their agency folder
create policy "Read from agency folder" on storage.objects
  for select using (
    bucket_id = 'documents' and
    (storage.foldername(name))[1] = (select agency_id::text from users where id = auth.uid())
  );

-- Users can delete from their agency folder
create policy "Delete from agency folder" on storage.objects
  for delete using (
    bucket_id = 'documents' and
    (storage.foldername(name))[1] = (select agency_id::text from users where id = auth.uid())
  );
```
