# 2. Architecturally Significant Requirements (ASRs)

## 2.1 Utility Tree: Quality Attribute Prioritization

```
docuMINE Quality Attributes
├── Accuracy (Trust is the product)
│   ├── [H,H] AI responses cite correct source location
│   ├── [H,H] Quote comparison extracts correct values
│   └── [M,H] Confidence scores reflect actual certainty
├── Security (Multi-tenant, sensitive data)
│   ├── [H,H] Agency data isolation - no cross-tenant access
│   ├── [H,M] Authentication/authorization enforcement
│   └── [M,M] Document access control per user role
├── Performance (Speed perception critical)
│   ├── [M,H] First token streaming < 3 seconds
│   ├── [M,M] Document upload processing < 30s for 50 pages
│   └── [L,M] Quote comparison < 45 seconds for 4 documents
├── Reliability (Production stability)
│   ├── [M,H] Graceful degradation when AI service unavailable
│   ├── [M,M] Retry logic for transient failures
│   └── [L,M] Health check monitoring
└── Usability (Non-tech-savvy users)
    ├── [M,H] Zero learning curve - intuitive UI
    ├── [L,M] Error messages guide recovery
    └── [L,L] Accessibility (WCAG 2.1 AA)
```

_Legend: [Probability, Impact] - H=High, M=Medium, L=Low_

## 2.2 Risk-Scored ASRs

| ID | Requirement | P | I | Score | Category | Owner | Test Approach |
|----|-------------|---|---|-------|----------|-------|---------------|
| ASR-001 | AI responses cite correct document source | 3 | 3 | **9** | DATA | TBD | Contract tests + golden dataset validation (manual pre-release) |
| ASR-002 | Quote comparison extracts correct values | 3 | 3 | **9** | DATA | TBD | Mock extraction, verify comparison logic unit tests |
| ASR-003 | Agency data isolation (multi-tenant) | 3 | 3 | **9** | SEC | TBD | E2E tests: User A cannot see User B's documents |
| ASR-004 | Confidence scoring accuracy | 2 | 3 | **6** | BUS | TBD | Boundary tests for 90%/70% thresholds, UI badge rendering |
| ASR-005 | First token streaming < 3s | 2 | 3 | **6** | PERF | TBD | k6 performance test with mocked AI |
| ASR-006 | Document processing < 30s (50 pages) | 2 | 3 | **6** | PERF | TBD | Performance suite with test PDFs |
| ASR-007 | Auth enforcement on all protected routes | 2 | 3 | **6** | SEC | TBD | E2E auth tests, 401/403 response validation |
| ASR-008 | Graceful degradation (AI unavailable) | 2 | 2 | **4** | OPS | TBD | E2E test with mocked 500 from AI service |

**Gate Rule:** Score ≥6 requires documented test coverage. Score = 9 is release blocker if tests fail.

---
