# docuMINE System Test Design

_Created on 2025-11-24 by Murat (Master Test Architect)_
_Generated using BMad Method - Test Design Workflow v1.0_

---

## Executive Summary

**Project:** docuMINE - AI-powered document analysis platform for insurance agents
**Phase:** 3 (Solutioning - System-Level Testability Review)
**Risk Profile:** HIGH - AI non-determinism + multi-tenant data isolation + E&O liability exposure

**Key Decisions:**
- AI Testing Strategy: **Contract Testing** (validate prompt structure & response schema, mock actual AI calls)
- CI Budget: **Zero Cost** (all AI calls mocked in CI pipeline)
- Primary Framework: **Playwright** (E2E + API testing)
- Performance Testing: **k6** (load/stress testing)

---

## 1. Architecture Testability Assessment

### 1.1 Controllability Analysis

Can we put the system into desired states for testing?

| Component | Technology | Controllability | Risk Level | Mitigation |
|-----------|------------|-----------------|------------|------------|
| Frontend | Next.js + shadcn/ui | HIGH | Low | Standard React testing patterns, component isolation via Storybook |
| Authentication | Supabase Auth (JWT) | HIGH | Low | Generate test tokens, mock auth context |
| Database | Supabase PostgreSQL | MEDIUM | Medium | Test database with seeded data, transaction rollback isolation |
| RAG Pipeline | LangChain + pgvector | LOW | High | Contract tests for prompt structure, mock embeddings |
| AI Service | OpenAI GPT-4 | LOW | Critical | Mock all AI responses in CI, contract validation only |
| Email | Resend | HIGH | Low | Mock email service, verify outbound payloads |
| Payments | Stripe | MEDIUM | Medium | Use Stripe test mode, mock webhooks |
| File Storage | Supabase Storage | HIGH | Low | Test bucket with auto-cleanup |

### 1.2 Observability Analysis

Can we verify the system is in the correct state after actions?

| Concern | Observable? | Validation Strategy |
|---------|-------------|---------------------|
| AI response content | YES | Contract: validate JSON schema, required fields |
| Source citation accuracy | PARTIAL | Mock pipeline returns predetermined citations, verify UI renders correctly |
| Confidence scores | YES | Mock returns fixed scores, test UI badge rendering at 90%/70%/below boundaries |
| Streaming responses | PARTIAL | Test SSE connection established, mock streamed chunks |
| PDF text extraction | YES | Use known test PDFs, verify extracted text matches expected |
| Quote comparison accuracy | PARTIAL | Mock extraction results, verify comparison logic |
| Multi-tenant isolation | YES | Create users in different agencies, verify cross-access blocked |

### 1.3 Reliability Analysis

Does the system behave predictably under test conditions?

| Concern | Risk | Mitigation |
|---------|------|------------|
| AI non-determinism | CRITICAL | Mock all AI responses - same input always yields same output |
| OpenAI rate limits | HIGH | Zero real API calls in CI |
| Large document processing | MEDIUM | Use small test PDFs (<10 pages) for unit/integration, dedicated performance suite for large files |
| Supabase connection limits | LOW | Connection pooling, test database isolation |
| Stripe webhook timing | MEDIUM | Mock webhooks with fixed payloads |

---

## 2. Architecturally Significant Requirements (ASRs)

### 2.1 Utility Tree: Quality Attribute Prioritization

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

### 2.2 Risk-Scored ASRs

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

## 3. Test Levels Strategy

### 3.1 Test Pyramid for docuMINE

```
                    ▲
                   /E2E\           ~10% of tests
                  /─────\          Critical user journeys
                 /  API  \         ~20% of tests
                /─────────\        Service contracts, auth
               / Integration\      ~20% of tests
              /─────────────\      Component interactions
             /     Unit      \     ~50% of tests
            /─────────────────\    Business logic, utilities
```

### 3.2 Test Level Allocation by Component

| Component | Unit | Integration | API | E2E |
|-----------|------|-------------|-----|-----|
| **Price Calculator** | Primary | - | - | - |
| **Document Parser** | Primary | Secondary | - | - |
| **Confidence Scoring Logic** | Primary | - | - | - |
| **Quote Comparison Engine** | Primary | Secondary | - | - |
| **RAG Pipeline** | Contract | Integration | - | Smoke |
| **Supabase Auth** | - | Primary | Primary | Secondary |
| **API Endpoints** | - | - | Primary | Secondary |
| **Document Chat UI** | Component | - | - | Primary |
| **Quote Comparison UI** | Component | - | - | Primary |
| **Multi-tenant Isolation** | - | - | Primary | Primary |

### 3.3 Test Level Decision Rules

**Unit Tests (50%):**
- All business logic functions (pricing, scoring, parsing)
- Input validation and data transformation
- Utility functions
- State management reducers

**Integration Tests (20%):**
- Database operations (CRUD, transactions)
- Component-to-service communication
- File storage operations

**API Tests (20%):**
- Endpoint contracts (request/response schemas)
- Authentication/authorization enforcement
- Error response formats
- Rate limiting behavior

**E2E Tests (10%):**
- Critical user journeys only:
  - Document upload → Ask question → See answer with citation
  - Quote comparison flow
  - Signup → Login → Protected route access
- Visual regression for key screens

---

## 4. Test Strategy by Epic

### 4.1 Epic 1: Document Chat & Q&A

**Primary Test Focus:** AI contract validation, citation accuracy

| Story Area | Unit | Integration | API | E2E |
|------------|------|-------------|-----|-----|
| Document upload | Parser logic | Storage + DB | Upload endpoint | Upload flow |
| Text extraction | Extraction utils | PDF.js integration | - | - |
| RAG pipeline | - | Embedding generation | Query endpoint | - |
| AI response | Prompt builder | - | Response contract | Chat flow |
| Source citation | Citation parser | - | Citation endpoint | Click-to-source |
| Confidence badge | Score calculator | - | - | Badge rendering |
| Conversation context | Context builder | - | - | Follow-up questions |

**Contract Tests Required:**
```typescript
// AI Response Contract
interface AIResponse {
  answer: string;              // Required, non-empty
  confidence: number;          // 0-100
  sources: Source[];           // Required, at least 1 when answer found
  conversationId: string;      // Required for context
}

interface Source {
  documentId: string;          // Required
  pageNumber: number;          // Required, >= 1
  startOffset: number;         // Character position
  endOffset: number;           // Character position
  snippet: string;             // Extracted text
}
```

### 4.2 Epic 2: Quote Comparison

**Primary Test Focus:** Extraction accuracy, comparison logic

| Story Area | Unit | Integration | API | E2E |
|------------|------|-------------|-----|-----|
| Multi-doc upload | - | Storage | Upload endpoint | Upload 2-4 quotes |
| Field extraction | Extraction logic | AI integration | Extraction endpoint | - |
| Comparison engine | Comparison logic | - | Compare endpoint | Comparison table |
| Best/worst highlight | Highlight logic | - | - | Visual highlighting |
| Export to PDF | PDF generation | - | Export endpoint | Export flow |

**Critical Test Scenarios:**
- Extract premium correctly from 3 different carrier formats
- Identify coverage gaps (field exists in Quote A but not Quote B)
- Handle missing/unclear fields gracefully

### 4.3 Epic 3: Core Platform

**Primary Test Focus:** Security, auth, multi-tenancy

| Story Area | Unit | Integration | API | E2E |
|------------|------|-------------|-----|-----|
| Signup/Login | Validation | Supabase Auth | Auth endpoints | Auth flow |
| Agency accounts | - | DB relationships | Agency endpoints | - |
| User roles | Permission logic | - | Role endpoints | Role-based access |
| Document storage | - | Storage + DB | Storage endpoints | - |
| Multi-tenant | Isolation logic | DB queries | - | Cross-tenant blocked |

**Security Tests Required:**
```typescript
// Multi-tenant isolation tests
test('user cannot access documents from different agency', async ({ request }) => {
  const agencyAUser = await createUser({ agencyId: 'agency-a' });
  const agencyBDoc = await createDocument({ agencyId: 'agency-b' });

  const response = await request.get(`/api/documents/${agencyBDoc.id}`, {
    headers: { Authorization: `Bearer ${agencyAUser.token}` }
  });

  expect(response.status()).toBe(403);
});
```

---

## 5. NFR Testing Approach

### 5.1 Security NFR Testing

| NFR | Test Type | Tool | Threshold |
|-----|-----------|------|-----------|
| Authentication enforcement | API Test | Playwright | All protected routes return 401 without token |
| Authorization (RBAC) | API Test | Playwright | Users cannot access resources outside their agency |
| JWT expiration | API Test | Playwright | Token expires after configured TTL |
| SQL injection | API Test | Playwright | Malicious inputs return error, not data |
| XSS prevention | E2E Test | Playwright | Script tags rendered as text, not executed |

### 5.2 Performance NFR Testing

| NFR | Test Type | Tool | Threshold |
|-----|-----------|------|-----------|
| First token latency | Load Test | k6 | P95 < 3 seconds (with mocked AI) |
| Document upload | Load Test | k6 | P95 < 30 seconds for 50-page PDF |
| API response time | Load Test | k6 | P95 < 500ms for standard endpoints |
| Concurrent users | Load Test | k6 | Support 50 concurrent users |
| Error rate | Load Test | k6 | < 1% under normal load |

**k6 Configuration:**
```javascript
export const options = {
  stages: [
    { duration: '1m', target: 25 },   // Ramp up
    { duration: '3m', target: 50 },   // Sustained load
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    errors: ['rate<0.01'],
  },
};
```

### 5.3 Reliability NFR Testing

| NFR | Test Type | Tool | Validation |
|-----|-----------|------|------------|
| AI service unavailable | E2E Test | Playwright | User sees friendly error, app remains functional |
| Network disconnection | E2E Test | Playwright | Offline indicator shown, reconnect works |
| Retry on transient failure | API Test | Playwright | 503 response triggers retry (up to 3 attempts) |
| Health check | API Test | Playwright | /api/health returns service status |

### 5.4 Maintainability NFR Testing

| NFR | Test Type | Tool | Threshold |
|-----|-----------|------|-----------|
| Test coverage | CI Job | Jest/Vitest | ≥ 80% line coverage |
| Code duplication | CI Job | jscpd | < 5% duplication |
| Vulnerability scan | CI Job | npm audit | 0 critical/high vulnerabilities |
| Error tracking | E2E Test | Playwright | Errors captured by Sentry/monitoring |

---

## 6. Testability Concerns & Mitigations

### 6.1 Critical Concerns

| Concern | Risk Score | Mitigation | Owner |
|---------|------------|------------|-------|
| **AI non-determinism** | 9 | Contract testing only; mock all AI responses in CI; manual golden dataset validation pre-release | TBD |
| **Source citation accuracy** | 9 | Cannot fully automate without real AI; manual QA with known documents before each release | TBD |
| **Quote extraction accuracy** | 9 | Mock extraction results; unit test comparison logic; manual QA with real carrier quotes | TBD |

### 6.2 Architecture Recommendations

**Recommendation 1: Introduce AI Response Contract Layer**

Add a validation layer between the AI service and the application that enforces response schema:

```typescript
// src/lib/ai/response-validator.ts
export function validateAIResponse(raw: unknown): AIResponse {
  const parsed = AIResponseSchema.parse(raw);

  // Business rules
  if (parsed.confidence > 90 && parsed.sources.length === 0) {
    throw new Error('High confidence requires at least one source');
  }

  return parsed;
}
```

**Recommendation 2: Add Seams for Testing**

Ensure all external service calls are injectable:

```typescript
// src/services/document-service.ts
export class DocumentService {
  constructor(
    private aiClient: AIClient,        // Injectable for mocking
    private storage: StorageClient,    // Injectable for mocking
    private db: DatabaseClient         // Injectable for mocking
  ) {}
}
```

**Recommendation 3: Implement Feature Flags for AI**

Add feature flag to swap between real AI and mock responses:

```typescript
if (config.USE_MOCK_AI || process.env.CI) {
  return mockAIResponse(prompt);
} else {
  return await openaiClient.complete(prompt);
}
```

### 6.3 Deferred Testability Items

| Item | Rationale | Revisit When |
|------|-----------|--------------|
| AI output quality testing | Requires real AI calls, exceeds budget | Pre-release manual QA, consider Phase 5 |
| Visual regression testing | Not MVP critical | Phase 5 polish |
| Chaos engineering | Premature for MVP | Post-launch stability phase |
| Accessibility automation | Manual audit sufficient for MVP | Phase 5 or compliance requirement |

---

## 7. Test Data Strategy

### 7.1 Test Data Categories

| Category | Source | Lifecycle | Usage |
|----------|--------|-----------|-------|
| **Static fixtures** | Checked into repo | Permanent | Unit tests, contract validation |
| **Factory-generated** | faker.js at runtime | Per-test | Integration, E2E tests |
| **Seeded database** | SQL scripts | Per-suite | API tests, E2E tests |
| **Golden documents** | Curated PDFs | Permanent | AI validation (manual) |

### 7.2 Test Document Inventory

| Document | Pages | Purpose | Known Data |
|----------|-------|---------|------------|
| `test-policy-simple.pdf` | 3 | Basic Q&A tests | Known coverages, limits |
| `test-policy-complex.pdf` | 25 | Multi-page navigation | Table of contents, cross-references |
| `test-quote-hartford.pdf` | 5 | Quote extraction | Premium: $4,200, Limit: $1M |
| `test-quote-travelers.pdf` | 5 | Quote comparison | Premium: $4,800, Limit: $1M |
| `test-quote-liberty.pdf` | 5 | Quote comparison | Premium: $3,900, Limit: $500K |

### 7.3 Factory Patterns

```typescript
// test/factories/user.factory.ts
export const createUser = (overrides?: Partial<User>): User => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  agencyId: overrides?.agencyId || faker.string.uuid(),
  role: 'user',
  createdAt: new Date(),
  ...overrides,
});

// test/factories/document.factory.ts
export const createDocument = (overrides?: Partial<Document>): Document => ({
  id: faker.string.uuid(),
  name: `${faker.commerce.productName()}.pdf`,
  agencyId: overrides?.agencyId || faker.string.uuid(),
  uploadedBy: overrides?.uploadedBy || faker.string.uuid(),
  status: 'processed',
  pageCount: faker.number.int({ min: 1, max: 100 }),
  createdAt: new Date(),
  ...overrides,
});
```

---

## 8. CI/CD Quality Gates

### 8.1 Pipeline Stages

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

### 8.2 Gate Criteria

| Stage | Pass Criteria | Fail Action |
|-------|---------------|-------------|
| Lint | 0 errors | Block merge |
| Unit | 100% pass, ≥80% coverage | Block merge |
| Integration | 100% pass | Block merge |
| API | All contracts valid | Block merge |
| E2E | All critical paths pass | Block merge |
| Security | 0 critical/high CVEs | Block merge |
| Performance | P95 < thresholds | Warning (non-blocking for MVP) |

### 8.3 Pre-Release Manual Gates

| Gate | Frequency | Owner | Criteria |
|------|-----------|-------|----------|
| AI Golden Dataset | Pre-release | QA Lead | 95% accuracy on curated Q&A |
| Quote Extraction | Pre-release | QA Lead | Verified against 5 real carrier quotes |
| Accessibility Audit | Pre-release | UX Lead | WCAG 2.1 AA compliance |
| Security Pen Test | Before launch | Security | No critical findings |

---

## 9. Test Environment Strategy

### 9.1 Environment Matrix

| Environment | Purpose | AI Behavior | Database |
|-------------|---------|-------------|----------|
| **Local Dev** | Developer testing | Mocked | Local SQLite or Supabase local |
| **CI** | Automated tests | Mocked | Test database (isolated) |
| **Staging** | Integration testing | Real (optional) | Staging database |
| **Production** | Live system | Real | Production database |

### 9.2 Environment Variables

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

## 10. Traceability Matrix Template

To be populated during Epic-level test planning (Phase 4):

| Story ID | Acceptance Criteria | Test ID | Test Level | Status |
|----------|---------------------|---------|------------|--------|
| 1.1-01 | User can upload PDF | - | E2E | TODO |
| 1.1-02 | Processing shows progress | - | E2E | TODO |
| 1.2-01 | User can ask question | - | E2E | TODO |
| 1.2-02 | Response streams in | - | E2E | TODO |
| 1.2-03 | Source citation shown | - | E2E | TODO |
| ... | ... | ... | ... | ... |

---

## 11. Next Steps

1. **Epic Planning:** When entering Phase 4, run `*test-design` per epic to generate detailed test scenarios
2. **Framework Setup:** Initialize Playwright + k6 with configurations from this document
3. **Golden Dataset:** Curate 10-20 test documents with known correct answers
4. **Contract Definitions:** Finalize AI response contracts before implementation
5. **CI Pipeline:** Implement pipeline stages per Section 8

---

## Appendix A: Risk Register

| Risk ID | Description | Score | Status | Mitigation |
|---------|-------------|-------|--------|------------|
| R-001 | AI citation accuracy cannot be automated | 9 | OPEN | Manual golden dataset testing |
| R-002 | Quote extraction varies by carrier format | 9 | OPEN | Expand golden dataset per carrier |
| R-003 | Streaming response testing complexity | 4 | ACCEPTED | SSE connection test only |
| R-004 | Large PDF processing timeout | 6 | OPEN | Performance test suite |

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **ASR** | Architecturally Significant Requirement - high-risk requirements needing focused test attention |
| **Contract Test** | Test that validates the structure/schema of inputs/outputs without testing actual behavior |
| **Golden Dataset** | Curated set of inputs with known correct outputs for validation |
| **NFR** | Non-Functional Requirement - security, performance, reliability, maintainability |
| **RAG** | Retrieval-Augmented Generation - AI pattern combining document retrieval with generation |

---

_This document was generated by the Test Architect workflow. Review with the development team and update risk owners before Phase 4 implementation._
