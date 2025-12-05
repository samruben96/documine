# Documentation Updates Required

## CLAUDE.md Additions

1. **Confidence Thresholds:**
```markdown
## Confidence Score Thresholds

| Score Type | High | Needs Review | Not Found |
|------------|------|--------------|-----------|
| Vector Similarity | >= 0.75 | 0.50 - 0.74 | < 0.50 |
| Cohere Reranker | >= 0.30 | 0.10 - 0.29 | < 0.10 |
```

2. **RLS Policy Summary:**
```markdown
## RLS Policies

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| documents | agency_id match | agency_id match | agency_id match | agency_id match |
| conversations | user_id match | user_id match | user_id match | user_id match |
| chat_messages | agency_id match | agency_id match | - | - |
```

3. **Error Codes:**
```markdown
## API Error Codes

| Code | HTTP Status | User Message |
|------|-------------|--------------|
| VALIDATION_ERROR | 400 | Invalid request: {details} |
| UNAUTHORIZED | 401 | Authentication required |
| DOCUMENT_NOT_FOUND | 404 | Document not found |
| RATE_LIMIT | 429 | Too many requests. Please wait. |
```

---
