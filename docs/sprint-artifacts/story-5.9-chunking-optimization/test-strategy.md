# Test Strategy

## Unit Tests

```typescript
// chunking.test.ts
describe('RecursiveCharacterTextSplitter', () => {
  it('splits on paragraph boundaries first', () => {
    const text = 'Para 1.\n\nPara 2.\n\nPara 3.';
    const chunks = recursiveCharacterTextSplitter(text, { chunkSize: 50 });
    expect(chunks).toHaveLength(3);
  });

  it('maintains overlap between chunks', () => {
    const text = 'Long paragraph...'; // 1000+ chars
    const chunks = recursiveCharacterTextSplitter(text, {
      chunkSize: 500,
      chunkOverlap: 100
    });
    // Verify overlap exists between consecutive chunks
    expect(chunks[0].slice(-50)).toContain(chunks[1].slice(0, 50));
  });

  it('handles text smaller than chunk size', () => {
    const text = 'Short text.';
    const chunks = recursiveCharacterTextSplitter(text);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(text);
  });
});

// table-detection.test.ts
describe('Table Detection', () => {
  it('extracts tables from Docling output', () => {
    const docling = { /* sample Docling JSON with table */ };
    const tables = extractTables(docling);
    expect(tables).toHaveLength(1);
    expect(tables[0].type).toBe('table');
  });

  it('preserves table structure', () => {
    const docling = { /* multi-row table */ };
    const tables = extractTables(docling);
    expect(tables[0].rows.length).toBeGreaterThan(1);
  });
});
```

## Integration Tests

- Test full chunking pipeline with sample documents
- Verify table chunks stored with correct metadata
- Test summary generation with mocked GPT

## E2E Test Checklist

- [ ] Process new document with new chunking
- [ ] Verify tables preserved as single chunks
- [ ] Run table test queries
- [ ] Verify ≥15% improvement on table queries
- [ ] Test re-processing on existing document
- [ ] Verify A/B testing capability works

---
