# Implementation Patterns

These patterns ensure consistent implementation across all AI agents:

## API Response Format

All API responses follow this structure:

```typescript
// Success response
{
  data: T;
  error: null;
}

// Error response
{
  data: null;
  error: {
    code: string;      // e.g., "DOCUMENT_NOT_FOUND"
    message: string;   // Human-readable message
    details?: unknown; // Additional context
  };
}
```

## Streaming Response Format

For chat endpoints, use Server-Sent Events:

```typescript
// Stream format
data: {"type": "text", "content": "The liability"}
data: {"type": "text", "content": " limit is"}
data: {"type": "text", "content": " $1,000,000"}
data: {"type": "source", "content": {"page": 3, "text": "..."}}
data: {"type": "confidence", "content": "high"}
data: [DONE]
```

## Database Query Pattern

Always include agency_id in queries (RLS enforces this, but be explicit):

```typescript
// Good - explicit agency filter
const { data } = await supabase
  .from('documents')
  .select('*')
  .eq('agency_id', user.agency_id)
  .eq('id', documentId);

// RLS policy ensures this anyway, but explicit is better for clarity
```

## File Upload Pattern

```typescript
// 1. Upload to Supabase Storage
const { data: file } = await supabase.storage
  .from('documents')
  .upload(`${agencyId}/${documentId}/${filename}`, fileBuffer);

// 2. Create database record
const { data: document } = await supabase
  .from('documents')
  .insert({
    id: documentId,
    agency_id: agencyId,
    filename,
    storage_path: file.path,
    status: 'processing'
  });

// 3. Trigger processing (Edge Function picks up)
await supabase
  .from('processing_jobs')
  .insert({ document_id: documentId });
```
