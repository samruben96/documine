# Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Cohere threshold calibration wrong | Medium | Medium | Log scores, analyze distribution, iterate |
| Breaking existing confidence logic | Low | High | Comprehensive unit tests, careful refactoring |
| TypeScript type errors during refactor | Medium | Low | Update types first, let compiler catch issues |
| Score distribution varies by document type | Medium | Medium | Add logging, plan for threshold tuning post-release |

---
