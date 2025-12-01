# Product Backlog

## Tech Debt & Enhancements

| Date | Story | Epic | Type | Severity | Owner | Status | Notes |
|------|-------|------|------|----------|-------|--------|-------|
| 2025-11-26 | 2.4 | 2 | Enhancement | Low | TBD | Open | **Remember me session duration**: Implement custom cookie maxAge configuration to differentiate session-only (browser close) vs 7-day persistent sessions based on "Remember me" checkbox. Currently checkbox is captured but not used for duration. Requires modifying `@supabase/ssr` cookie options in `src/lib/supabase/server.ts`. Reference: AC-2.4.1 |

## Future Features

_Items identified during development that are out of scope for current MVP._

| Date | Description | Source | Priority |
|------|-------------|--------|----------|
