# Dependencies and Integrations

| Dependency | Purpose | Risk |
|------------|---------|------|
| Supabase MCP | Apply migrations, run advisors | Low - existing integration |
| Supabase Dashboard | Enable leaked password protection | Low - one-time manual action |
| Vitest | Test verification | Low - existing infrastructure |

**Optional (evaluate in Story 8.5):**
| Dependency | Purpose | Decision Criteria |
|------------|---------|-------------------|
| Upstash Redis | Faster rate limiting | Only if Supabase table latency > 50ms |

---
