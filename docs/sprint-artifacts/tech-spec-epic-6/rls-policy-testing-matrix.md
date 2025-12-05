# RLS Policy Testing Matrix

**Learning from Epic 5:** RLS policies need symmetric testing for all operations.

## Required Tests for Story 6.1

| Table | Operation | Test Case | Expected Result |
|-------|-----------|-----------|-----------------|
| conversations | SELECT | Own conversation by document_id + user_id | ✅ Returns data |
| conversations | SELECT | Other user's conversation | ❌ Empty result (not 406) |
| conversations | SELECT | Different agency conversation | ❌ Empty result |
| conversations | INSERT | Create with own user_id/agency_id | ✅ Success |
| conversations | INSERT | Create with other user_id | ❌ Policy rejection |
| chat_messages | SELECT | Messages for own conversation | ✅ Returns data |
| chat_messages | SELECT | Messages for other user's conversation | ❌ Empty result |

## SQL Verification Queries

```sql
-- Run as authenticated user to verify policies
-- 1. Check policy definitions
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual::text
FROM pg_policies
WHERE tablename IN ('conversations', 'chat_messages')
ORDER BY tablename, cmd;

-- 2. Test SELECT on conversations (should return own rows)
SELECT id, document_id, user_id, created_at
FROM conversations
WHERE document_id = 'test-doc-id';

-- 3. Verify get_user_agency_id() function works
SELECT get_user_agency_id();
```

---
