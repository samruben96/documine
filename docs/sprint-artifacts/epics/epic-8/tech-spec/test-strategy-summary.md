# Test Strategy Summary

## Unit Tests

| Area | Coverage Target | Framework |
|------|-----------------|-----------|
| Rate limit utility | 100% paths | Vitest |
| Rate limit headers | All header combinations | Vitest |

## Integration Tests

| Area | Coverage | Framework |
|------|----------|-----------|
| RLS policies post-migration | All CRUD operations per table | Supabase client tests |
| Rate limit DB operations | Increment, reset, concurrent | Supabase RPC tests |

## E2E Tests

| Flow | Coverage | Framework |
|------|----------|-----------|
| Document upload → chat | Verify RLS still works | Playwright |
| Comparison flow | Verify rate limit 429 handling | Playwright |
| Rate limit error display | User sees friendly message | Playwright |

## Verification Steps (Post-Epic)

1. **Security Audit:**
   ```bash
   mcp__supabase__get_advisors(project_id, type: 'security')
   # Expected: 0 WARN-level issues
   ```

2. **Performance Audit:**
   ```bash
   mcp__supabase__get_advisors(project_id, type: 'performance')
   # Expected: 0 WARN-level issues
   ```

3. **Test Suite:**
   ```bash
   npm run test
   # Expected: All 1097+ tests passing
   ```

4. **Build Verification:**
   ```bash
   npm run build
   # Expected: No TypeScript errors
   ```

5. **Manual Smoke Test:**
   - Upload document → Process → Chat
   - Create comparison → Export
   - Verify rate limit behavior (optional: temporarily set limit to 1)

---
