# 4. Test Strategy by Epic

## 4.1 Epic 1: Document Chat & Q&A

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

## 4.2 Epic 2: Quote Comparison

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

## 4.3 Epic 3: Core Platform

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
