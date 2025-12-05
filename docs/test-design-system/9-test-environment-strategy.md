# 9. Test Environment Strategy

## 9.1 Environment Matrix

| Environment | Purpose | AI Behavior | Database |
|-------------|---------|-------------|----------|
| **Local Dev** | Developer testing | Mocked | Local SQLite or Supabase local |
| **CI** | Automated tests | Mocked | Test database (isolated) |
| **Staging** | Integration testing | Real (optional) | Staging database |
| **Production** | Live system | Real | Production database |

## 9.2 Environment Variables

```bash
# .env.test
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=test-anon-key
OPENAI_API_KEY=mock-key-not-real
USE_MOCK_AI=true
STRIPE_SECRET_KEY=sk_test_xxx
RESEND_API_KEY=mock-key
```

---
