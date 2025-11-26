-- Storage Bucket Migration: documents bucket with agency-scoped RLS
-- Path structure: {agency_id}/{document_id}/{filename}

-- Create or update the documents storage bucket (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,  -- Not public, requires authentication
  52428800,  -- 50MB in bytes
  ARRAY['application/pdf']  -- PDF only
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS Policies
-- Extract agency_id from path: storage.foldername(name)[1] returns first folder segment

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Upload to agency folder" ON storage.objects;
DROP POLICY IF EXISTS "Read from agency folder" ON storage.objects;
DROP POLICY IF EXISTS "Update in agency folder" ON storage.objects;
DROP POLICY IF EXISTS "Delete from agency folder" ON storage.objects;

-- Policy: Users can upload files to their agency folder only
CREATE POLICY "Upload to agency folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = (
    SELECT agency_id::text FROM public.users WHERE id = auth.uid()
  )
);

-- Policy: Users can read files from their agency folder only
CREATE POLICY "Read from agency folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = (
    SELECT agency_id::text FROM public.users WHERE id = auth.uid()
  )
);

-- Policy: Users can update files in their agency folder only
CREATE POLICY "Update in agency folder"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = (
    SELECT agency_id::text FROM public.users WHERE id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = (
    SELECT agency_id::text FROM public.users WHERE id = auth.uid()
  )
);

-- Policy: Users can delete files from their agency folder only
CREATE POLICY "Delete from agency folder"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = (
    SELECT agency_id::text FROM public.users WHERE id = auth.uid()
  )
);
