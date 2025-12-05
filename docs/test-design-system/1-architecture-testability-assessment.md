# 1. Architecture Testability Assessment

## 1.1 Controllability Analysis

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

## 1.2 Observability Analysis

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

## 1.3 Reliability Analysis

Does the system behave predictably under test conditions?

| Concern | Risk | Mitigation |
|---------|------|------------|
| AI non-determinism | CRITICAL | Mock all AI responses - same input always yields same output |
| OpenAI rate limits | HIGH | Zero real API calls in CI |
| Large document processing | MEDIUM | Use small test PDFs (<10 pages) for unit/integration, dedicated performance suite for large files |
| Supabase connection limits | LOW | Connection pooling, test database isolation |
| Stripe webhook timing | MEDIUM | Mock webhooks with fixed payloads |

---
