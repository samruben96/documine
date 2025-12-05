# Playwright E2E Testing

Playwright was added for E2E testing in Epic 6. Configuration and tests are located at:

- **Config:** `playwright.config.ts`
- **Tests:** `__tests__/e2e/`

**Run E2E tests:**
```bash
# Run all E2E tests
npx playwright test

# Run with headed browser (see what's happening)
npx playwright test --headed

# Run specific test file
npx playwright test conversation-persistence
```

**Test components have `data-testid` attributes:**
- `chat-panel` - Main chat panel container
- `chat-message` - Individual chat messages (with `data-role` attribute)
- `chat-input` - Message input textarea
- `suggested-questions` - Suggested questions container
- `document-list` - Document sidebar list
