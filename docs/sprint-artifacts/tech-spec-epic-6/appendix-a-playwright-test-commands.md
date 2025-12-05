# Appendix A: Playwright Test Commands

```bash
# Install Playwright (if not already)
npx playwright install

# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test conversation-persistence

# Run with headed browser (see what's happening)
npx playwright test --headed

# Run with debug mode
npx playwright test --debug

# Generate test from recording
npx playwright codegen http://localhost:3000

# Run specific test by name
npx playwright test -g "confidence badge"

# Run tests with specific browser
npx playwright test --project=chromium
npx playwright test --project=webkit
npx playwright test --project=firefox
```

---
