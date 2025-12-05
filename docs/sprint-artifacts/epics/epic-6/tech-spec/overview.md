# Overview

Epic 6 is a focused cleanup and polish epic that addresses:
1. **4 bugs** discovered during comprehensive Epic 5 testing
2. **5 UI polish items** identified through Party Mode UI exploration and research

These issues undermine the core "trust transparency" value proposition and professional appearance. They must be fixed before proceeding to Quote Comparison (now Epic 7).

This epic also establishes improved testing practices with Playwright E2E tests for each fix, ensuring we have regression protection going forward.

## Why This Epic Matters

**Bugs Found (Stories 6.1-6.4):**
1. **Conversations don't persist** (406 error) - Users lose their chat history
2. **Confidence badges are wrong** - Correct answers show "Not Found"
3. **Source citations don't navigate** - Click does nothing
4. **Mobile loses state** - Tab switching resets chat

**UI Polish Issues (Stories 6.5-6.9):**
5. **Stale "Coming in Epic 5" text** - Damages professional credibility
6. **"Connecting..." indicator** - No meaningful feedback to users
7. **No selected document highlight** - Users can't tell which document is active
8. **Bland empty state** - Doesn't guide users or inspire action
9. **Long filename truncation** - Names cut off without tooltip

These are not edge cases - they're core functionality and UX issues that erode user trust.

## Research Basis

UI polish stories (6.5-6.9) are informed by comprehensive research documented in:
- `docs/research-ui-best-practices-2025-12-02.md`

Key sources include:
- [Smashing Magazine: Design Patterns for AI Interfaces](https://www.smashingmagazine.com/2025/07/design-patterns-ai-interfaces/)
- [NN/g: Designing Empty States](https://www.nngroup.com/articles/empty-state-interface-design/)
- [Smashing Magazine: Psychology of Trust in AI](https://www.smashingmagazine.com/2025/09/psychology-trust-ai-guide-measuring-designing-user-confidence/)
