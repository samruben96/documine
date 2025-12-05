# What Could Have Gone Better

## 1. Pre-existing Test Failure

One test failure persists (`use-document-status.test.ts > useAgencyId`):
- Unrelated to Epic 6 changes
- Test environment/mocking issue
- Should be addressed in Epic 7 setup

## 2. Deferred Items

Some items were appropriately deferred but still represent incomplete work:
- **AC-6.8.18:** Source Text Highlighting → Epic F5
- **AC-6.8.19-21:** Microinteractions, skeleton loaders, dark mode polish → Future
- **Story 6.4:** Mobile Tab State Preservation → Epic F4

## 3. Manual Verification Dependencies

Several stories rely on manual testing that's difficult to automate:
- Multi-user security testing (AC-6.1.5)
- Dark mode visual verification
- Network disconnect/reconnect testing

## 4. Dependencies Added

Three new npm packages added during Epic 6:
- `react-resizable-panels: ^3.0.6`
- `react-markdown: ^10.1.0`
- `remark-gfm: ^4.0.1`

While necessary, each dependency adds maintenance burden.

---
