# Test Strategy Summary

## Test Coverage by Layer

| Layer | Framework | Location | Coverage Target |
|-------|-----------|----------|-----------------|
| Unit | Vitest | `__tests__/lib/one-pager/` | Generator functions, type validation |
| Component | React Testing Library | `__tests__/components/one-pager/` | Form interactions, preview updates |
| E2E | Playwright | `__tests__/e2e/one-pager-*.spec.ts` | Full flows for all entry points |

## Test Scenarios

**Unit Tests:**
- `generator.test.ts` - PDF blob creation, logo fallback, color application
- `types.test.ts` - Data validation, schema compliance

**Component Tests:**
- `one-pager-form.test.tsx` - Client name validation, notes input
- `one-pager-preview.test.tsx` - Render with mock data, update on prop change
- `branding-form.test.tsx` - Logo upload, color picker, save button

**E2E Tests:**
- `one-pager-from-comparison.spec.ts` - Full flow from comparison page
- `one-pager-from-document.spec.ts` - Full flow from document viewer
- `one-pager-direct.spec.ts` - Direct access with selector
- `branding-admin.spec.ts` - Admin branding configuration

## Visual Testing

Manual verification of generated PDFs in:
- macOS Preview
- Chrome PDF viewer
- Adobe Acrobat Reader

---
