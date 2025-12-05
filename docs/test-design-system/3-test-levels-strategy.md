# 3. Test Levels Strategy

## 3.1 Test Pyramid for docuMINE

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

## 3.2 Test Level Allocation by Component

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

## 3.3 Test Level Decision Rules

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
