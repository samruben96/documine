# 8. CI/CD Quality Gates

## 8.1 Pipeline Stages

```yaml
# .github/workflows/ci.yml
stages:
  - lint        # ESLint, Prettier (< 1 min)
  - unit        # Unit tests + coverage (< 2 min)
  - integration # Integration tests (< 3 min)
  - api         # API contract tests (< 2 min)
  - e2e         # E2E critical paths (< 5 min)
  - security    # npm audit, SAST (< 2 min)
  - performance # k6 smoke test (< 3 min)
```

## 8.2 Gate Criteria

| Stage | Pass Criteria | Fail Action |
|-------|---------------|-------------|
| Lint | 0 errors | Block merge |
| Unit | 100% pass, ≥80% coverage | Block merge |
| Integration | 100% pass | Block merge |
| API | All contracts valid | Block merge |
| E2E | All critical paths pass | Block merge |
| Security | 0 critical/high CVEs | Block merge |
| Performance | P95 < thresholds | Warning (non-blocking for MVP) |

## 8.3 Pre-Release Manual Gates

| Gate | Frequency | Owner | Criteria |
|------|-----------|-------|----------|
| AI Golden Dataset | Pre-release | QA Lead | 95% accuracy on curated Q&A |
| Quote Extraction | Pre-release | QA Lead | Verified against 5 real carrier quotes |
| Accessibility Audit | Pre-release | UX Lead | WCAG 2.1 AA compliance |
| Security Pen Test | Before launch | Security | No critical findings |

---
