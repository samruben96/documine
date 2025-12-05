# API Contracts

## Authentication

```typescript
// POST /api/auth/signup
Request: { email: string; password: string; agencyName: string; fullName: string; }
Response: { data: { user: User; agency: Agency; }; error: null; }

// POST /api/auth/login
Request: { email: string; password: string; }
Response: { data: { user: User; session: Session; }; error: null; }

// POST /api/auth/reset-password
Request: { email: string; }
Response: { data: { message: string; }; error: null; }
```

## Documents

```typescript
// GET /api/documents
Response: { data: Document[]; error: null; }

// POST /api/documents (multipart/form-data)
Request: FormData with file
Response: { data: Document; error: null; }

// GET /api/documents/:id
Response: { data: Document & { chunks: DocumentChunk[]; }; error: null; }

// DELETE /api/documents/:id
Response: { data: { deleted: true; }; error: null; }
```

## Chat

```typescript
// POST /api/chat (streaming)
Request: { documentId: string; message: string; conversationId?: string; }
Response: Server-Sent Events stream

// Event types:
{ type: 'text', content: string }
{ type: 'source', content: { page: number; text: string; boundingBox?: BoundingBox; } }
{ type: 'confidence', content: 'high' | 'needs_review' | 'not_found' }
{ type: 'done', content: { conversationId: string; messageId: string; } }
```

## Compare

```typescript
// POST /api/compare
Request: { documentIds: string[]; }  // 2-4 documents
Response: {
  data: {
    comparison: {
      field: string;  // e.g., "Liability Limit"
      values: { documentId: string; value: string; source: Source; }[];
      winner?: string;  // documentId with best value
    }[];
  };
  error: null;
}
```
