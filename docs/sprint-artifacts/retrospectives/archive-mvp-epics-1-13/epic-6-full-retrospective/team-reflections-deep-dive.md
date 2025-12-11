# Team Reflections (Deep Dive)

## Winston (Architect)

"Epic 6 validated our architectural decisions. The bugs we fixed were integration issues, not design flaws:

1. **Supabase query patterns** - We now have clear guidance on `.single()` vs `.maybeSingle()`
2. **Score semantics** - The dual-threshold system properly separates concerns
3. **Component rendering** - Conditional rendering vs CSS hiding is now a documented pattern

The OpenRouter abstraction from Story 5.10 is paying dividends. We can switch models without touching UI code. For Epic 7, I'm excited about using GPT-4o function calling for structured quote extraction."

## Amelia (Developer)

"The phased approach for Story 6.8 was transformative. Instead of guessing what 'modern design' means, we:
1. Implemented core accent color
2. Captured screenshots of every page
3. Got specific UX feedback with 15 concrete ACs
4. Implemented improvements with clear requirements

The dual-instance bug in 6.3 was my favorite debugging challenge. Using Playwright's `browser_evaluate` to discover there were TWO viewers in the DOM was a lightbulb moment. The fix (conditional rendering) was elegant.

The new features (resizable panels, markdown, dockable chat) significantly improve power-user experience. Users can customize their workspace."

## Sally (UX Designer)

"This epic transformed docuMINE from 'enterprise grey' to a modern SaaS product. Key wins:

**Color:** Electric Blue (#3b82f6) brings energy without being overwhelming. It's trustworthy and professional - perfect for insurance.

**Features That Matter:**
- Resizable panels let users optimize for their workflow (more document space vs more chat)
- Markdown rendering makes AI responses scannable with headers, lists, code blocks
- Dockable chat is a power-user feature - floating mode is great for multitasking

**What I'm Proud Of:**
- The connection indicator is subtle but builds trust
- Empty states now guide users instead of showing dead ends
- Auth pages feel branded, not like a template

**For Epic 7:** The comparison table needs to be crystal clear. Multiple documents, multiple data points, potential conflicts - visual hierarchy is critical."

## Murat (Test Architect)

"Epic 6 validated TDBF (Test-Driven Bug Fixing):

**Story 6.1:** E2E test `conversation-persistence.spec.ts` verifies the fix works
**Story 6.2:** 43 unit tests cover every confidence calculation path
**Story 6.3:** E2E tests verify scroll behavior with `getBoundingClientRect`
**Story 6.6:** 17 unit tests for ConnectionIndicator component

The result? **Zero post-completion bugs found.** Compare to Epic 5's four bugs found after completion.

**Test Coverage Growth:**
- Before Epic 6: 847 tests
- After Epic 6: 864 tests (+17)
- E2E tests: 3 → 8+

The one failing test (`use-document-status.test.ts > useAgencyId`) is a pre-existing mock chain issue, not from Epic 6. Should be fixed before Epic 7."

## John (Product Manager)

"Epic 6 delivered on its promise: stabilize before building new features.

**What Users Will Notice:**
1. The app feels faster (no 406 errors blocking page load)
2. Trust indicators actually work (confidence badges are accurate)
3. Citations work (click to navigate to source)
4. Modern look (Electric Blue, not grey on grey)
5. Power features (resizable panels, dockable chat)

**What They Won't Notice (But Should):**
- OpenRouter gives us model flexibility
- The codebase is cleaner and better tested
- We have patterns for similar issues in the future

**Epic 7 Readiness:** We can confidently build Quote Comparison on this foundation."

## Bob (Scrum Master)

"Process improvements that worked:

1. **Story Consolidation:** Combining 6.7+6.8+6.9 into one story saved context-switching overhead
2. **Phased Approach:** Story 6.8's Phase 1 + UX Audit + Phase 2 pattern should be standard for large stories
3. **Code Review Quality:** Reviews caught additional issues (arrow buttons in 6.3)
4. **DoD Enforcement:** Every story has documented completion notes

**What I'm Changing for Epic 7:**
- Cap stories at 10 ACs. If more, split into phases
- UX audit after major UI changes is now standard practice
- Pre-existing test failures should be fixed at epic start, not carried"

## Mary (Analyst)

"Root cause analysis was excellent this epic:

| Bug | Initial Theory | Actual Cause | Method |
|-----|---------------|--------------|--------|
| 406 Error | RLS policy | `.single()` behavior | Web search |
| Confidence Wrong | Thresholds | Score overwriting | Code trace |
| Citation Navigation | Event wiring | Dual instances | browser_evaluate |

**Pattern Discovered:** We're good at finding bugs but initially hypothesize incorrectly. Building in investigation time before jumping to fixes is valuable.

**Documentation Quality:** Every bug fix is now in CLAUDE.md with:
- Issue description
- Root cause
- Files changed
- Key learning

This prevents future regressions and helps new developers understand our choices."

## Paige (Tech Writer)

"CLAUDE.md evolved significantly during Epic 6:

**New Sections Added:**
- Supabase Query Patterns (`.single()` vs `.maybeSingle()`)
- Confidence Threshold Configuration (vector vs Cohere)
- Cohere Model Names (`rerank-v3.5`)
- Playwright E2E Testing setup

**Documentation Debt Paid:**
- OpenRouter configuration documented
- Model hierarchy and pricing documented
- LLM configuration module fully documented

**Epic 7 Prep:** We need to document the Quote Comparison data model and extraction schema before implementation. I'll work with the Architect on that."

---
