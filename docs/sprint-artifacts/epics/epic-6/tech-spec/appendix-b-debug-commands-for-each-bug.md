# Appendix B: Debug Commands for Each Bug

## BUG-1: 406 Error Debug

```bash
# Check Supabase RLS policies
npx supabase db dump --schema public | grep -A 10 "conversations"

# Test policy locally
curl -X GET 'http://localhost:54321/rest/v1/conversations?select=*&document_id=eq.XXX&user_id=eq.YYY' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_JWT"
```

## BUG-2: Confidence Score Debug

```javascript
// Add to src/lib/chat/reranker.ts temporarily
console.log('Score debug:', {
  vectorSimilarity: chunk.vectorSimilarity,
  rerankerScore: result.relevanceScore,
  queryIntent: intent,
  finalConfidence: confidence
});
```

## BUG-3: Citation Navigation Debug

```javascript
// Add to source-citation.tsx onClick handler
console.log('Citation click:', { targetPage, currentPage });

// Add to document-viewer.tsx
useEffect(() => {
  console.log('Page changed to:', currentPage);
}, [currentPage]);
```

## BUG-4: Mobile Tab Debug

```javascript
// Add to chat-panel.tsx
useEffect(() => {
  console.log('ChatPanel mounted, conversation:', conversation?.id);
  return () => console.log('ChatPanel unmounting');
}, []);
```

---
