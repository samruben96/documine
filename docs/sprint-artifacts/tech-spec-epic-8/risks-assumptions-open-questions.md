# Risks, Assumptions, Open Questions

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| RLS policy changes break existing functionality | Medium | High | Run full E2E test suite after each migration; manual smoke test core flows |
| Rate limiting too aggressive | Low | Medium | Start with generous limits (10/hr compare, 100/hr chat); monitor and adjust |
| Index creation locks tables | Low | Low | Use CONCURRENTLY for all index creation |
| Unused index removal affects future queries | Medium | Low | Document reasoning; keep indexes if uncertain |

## Assumptions

1. Supabase MCP has permission to apply migrations
2. Current test suite adequately covers RLS policy behavior
3. Rate limits can be adjusted post-launch without migration
4. Leaked password protection has no negative UX impact

## Open Questions

| Question | Owner | Due | Resolution |
|----------|-------|-----|------------|
| Upstash Redis vs Supabase table for rate limiting? | Architect | Story 8.5 | Evaluate latency during implementation |
| Keep or remove unused indexes? | Architect | Story 8.3 | Analyze query patterns, document decision |
| Rate limit UI - toast vs modal? | UX | Story 8.5 | Toast preferred for non-blocking UX |

---
