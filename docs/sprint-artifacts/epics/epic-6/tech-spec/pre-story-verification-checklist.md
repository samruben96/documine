# Pre-Story Verification Checklist

**CRITICAL: Complete before starting ANY story implementation**

## For Each Bug Fix Story (6.1-6.4)

Before writing code:
- [ ] Reproduce bug in local environment
- [ ] Document exact steps to reproduce
- [ ] Capture console errors/network requests
- [ ] Write failing Playwright test
- [ ] Commit failing test with message `test: add failing test for BUG-X`

After implementing fix:
- [ ] Playwright test passes
- [ ] Manual verification in browser (desktop)
- [ ] Manual verification in browser (mobile viewport)
- [ ] No new console errors
- [ ] `npm run build` passes
- [ ] `npm run test` passes

## For Each UI Polish Story (6.5-6.9)

Before writing code:
- [ ] Take "before" screenshot
- [ ] Identify all affected files
- [ ] Check for existing components/patterns to reuse
- [ ] Write Playwright test for expected behavior

After implementing:
- [ ] Take "after" screenshot
- [ ] Visual comparison shows improvement
- [ ] No regressions in other areas
- [ ] Responsive at all breakpoints (mobile, tablet, desktop)
- [ ] Dark mode still works (if applicable)

---
