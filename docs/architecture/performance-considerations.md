# Performance Considerations

## Response Time Targets

| Operation | Target | Strategy |
|-----------|--------|----------|
| Page load | < 1s | SSR + streaming |
| Document upload | < 30s | Direct to Supabase Storage |
| Document processing | < 2 min | Background Edge Function |
| Q&A response | < 10s | Streaming, vector index |
| Quote comparison | < 60s/doc | Parallel extraction |

## Optimization Strategies

**Vector Search**
- IVFFlat index with 100 lists for ~1M vectors
- Filter by document_id before similarity search
- Limit to top 5 chunks for context

**Streaming**
- Stream AI responses character-by-character
- Show source citations as soon as identified
- Use React Suspense for loading states

**Caching**
- Document metadata: SWR with 5-minute stale time
- Conversation history: Keep in React state
- No caching of AI responses (always fresh)

**Edge Functions**
- Keep warm with scheduled pings
- Process one document per invocation
- Timeout at 150 seconds (Supabase limit)
