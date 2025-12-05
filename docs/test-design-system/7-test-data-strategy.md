# 7. Test Data Strategy

## 7.1 Test Data Categories

| Category | Source | Lifecycle | Usage |
|----------|--------|-----------|-------|
| **Static fixtures** | Checked into repo | Permanent | Unit tests, contract validation |
| **Factory-generated** | faker.js at runtime | Per-test | Integration, E2E tests |
| **Seeded database** | SQL scripts | Per-suite | API tests, E2E tests |
| **Golden documents** | Curated PDFs | Permanent | AI validation (manual) |

## 7.2 Test Document Inventory

| Document | Pages | Purpose | Known Data |
|----------|-------|---------|------------|
| `test-policy-simple.pdf` | 3 | Basic Q&A tests | Known coverages, limits |
| `test-policy-complex.pdf` | 25 | Multi-page navigation | Table of contents, cross-references |
| `test-quote-hartford.pdf` | 5 | Quote extraction | Premium: $4,200, Limit: $1M |
| `test-quote-travelers.pdf` | 5 | Quote comparison | Premium: $4,800, Limit: $1M |
| `test-quote-liberty.pdf` | 5 | Quote comparison | Premium: $3,900, Limit: $500K |

## 7.3 Factory Patterns

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
