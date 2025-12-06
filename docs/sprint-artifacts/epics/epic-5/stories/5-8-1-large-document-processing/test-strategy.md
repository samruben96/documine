# Test Strategy

## Unit Tests

```typescript
// documents.test.ts
describe('validateFileSize', () => {
  it('rejects files > 15MB', () => {
    const file = new File(['x'.repeat(16 * 1024 * 1024)], 'large.pdf');
    const result = validateFileSize(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('15MB');
  });

  it('warns for files > 5MB', () => {
    const file = new File(['x'.repeat(6 * 1024 * 1024)], 'medium.pdf');
    const result = validateFileSize(file);
    expect(result.valid).toBe(true);
    expect(result.warning).toContain('2-5 minutes');
  });

  it('accepts files < 5MB without warning', () => {
    const file = new File(['x'.repeat(1 * 1024 * 1024)], 'small.pdf');
    const result = validateFileSize(file);
    expect(result.valid).toBe(true);
    expect(result.warning).toBeUndefined();
  });
});
```

## Manual Testing

- [ ] Upload 1MB PDF - should process in <30s
- [ ] Upload 5MB PDF - should show warning, process in 1-2 min
- [ ] Upload 16MB PDF - should be rejected before upload
- [ ] Upload 10MB complex PDF - should either complete or fail gracefully with clear message

---
