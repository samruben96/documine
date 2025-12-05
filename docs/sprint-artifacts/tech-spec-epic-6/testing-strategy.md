# Testing Strategy

## Test-Driven Bug Fixing (TDBF)

For each bug:

1. **Write failing Playwright test first**
   ```bash
   # Test should fail
   npx playwright test conversation-persistence --headed
   ```

2. **Commit failing test**
   ```bash
   git add __tests__/e2e/
   git commit -m "test: add failing test for BUG-X conversation loading"
   ```

3. **Implement fix**

4. **Verify test passes**
   ```bash
   npx playwright test conversation-persistence --headed
   ```

5. **Commit fix with passing test**
   ```bash
   git add .
   git commit -m "fix: resolve conversation loading 406 error (BUG-1)"
   ```

## Playwright Test Structure

```
__tests__/
├── e2e/
│   ├── conversation-persistence.spec.ts  # Story 6.1 - DONE
│   ├── confidence-display.spec.ts        # Story 6.2 - DONE
│   ├── citation-navigation.spec.ts       # Story 6.3 - DONE
│   # mobile-tab-state.spec.ts            # Story 6.4 - DEFERRED
├── fixtures/
│   └── test-documents/                   # PDFs for testing
└── playwright.config.ts
```

## CI Integration

Add to GitHub Actions:
```yaml
- name: Run Playwright Tests
  run: npx playwright test
  env:
    PLAYWRIGHT_TEST_BASE_URL: http://localhost:3000
```

---
