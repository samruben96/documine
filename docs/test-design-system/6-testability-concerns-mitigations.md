# 6. Testability Concerns & Mitigations

## 6.1 Critical Concerns

| Concern | Risk Score | Mitigation | Owner |
|---------|------------|------------|-------|
| **AI non-determinism** | 9 | Contract testing only; mock all AI responses in CI; manual golden dataset validation pre-release | TBD |
| **Source citation accuracy** | 9 | Cannot fully automate without real AI; manual QA with known documents before each release | TBD |
| **Quote extraction accuracy** | 9 | Mock extraction results; unit test comparison logic; manual QA with real carrier quotes | TBD |

## 6.2 Architecture Recommendations

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

## 6.3 Deferred Testability Items

| Item | Rationale | Revisit When |
|------|-----------|--------------|
| AI output quality testing | Requires real AI calls, exceeds budget | Pre-release manual QA, consider Phase 5 |
| Visual regression testing | Not MVP critical | Phase 5 polish |
| Chaos engineering | Premature for MVP | Post-launch stability phase |
| Accessibility automation | Manual audit sufficient for MVP | Phase 5 or compliance requirement |

---
