# Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| 406 fix breaks existing functionality | Low | High | Comprehensive Playwright tests |
| Cohere threshold calibration wrong | Medium | Medium | Log scores, analyze distribution, iterate |
| Mobile fix requires architecture change | Low | Medium | Try simple fixes first, escalate if needed |
| Playwright tests flaky | Medium | Low | Use proper waits, retry logic |

---
