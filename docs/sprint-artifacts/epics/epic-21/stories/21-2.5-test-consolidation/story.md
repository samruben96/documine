# Story 21.2.5: Test Suite Consolidation

**Status:** Backlog

---

## User Story

As a **developer**,
I want **the test suite consolidated and optimized**,
So that **my machine remains usable while tests run and I can easily run relevant subsets**.

---

## Background

The test suite has grown to **2,796 tests** across **175 test files**. Running the full suite:
- Takes ~20 seconds
- Consumes significant memory and CPU
- **Freezes the machine** making it impossible to continue working
- Makes local development painful during TDD

**Key Insight from Team Discussion:** The primary pain point is *machine usability during test runs*, not raw test duration. A 20-second wait is acceptable if the developer can continue working; a 20-second freeze where the IDE locks up is not.

---

## Two-Phase Approach

This story uses a phased approach: audit first, then consolidate with data-driven targets.

---

## Phase 1: Test Audit (Pre-requisite)

### AC-1: Coverage Overlap Analysis
**Given** the current test suite
**When** coverage analysis is complete
**Then** tests with >80% overlapping coverage are identified
**And** documented in an audit report

### AC-2: Resource-Heavy Tests Identified
**Given** the test profiling is complete
**When** the audit report is produced
**Then** the top 10 slowest/most resource-intensive tests are documented
**And** root causes identified (heavy mocks, environment setup, etc.)

### AC-3: Test Categorization Complete
**Given** all 175 test files
**When** categorization is complete
**Then** test counts are broken down by type:
- Unit tests
- Integration tests
- Component tests
- Hook tests
- API route tests
- E2E tests
**And** each category's contribution to resource usage is documented

### AC-4: Recommendations Document Produced
**Given** the audit findings
**When** analysis is complete
**Then** a recommendations document is produced with:
- Specific tests to consolidate or remove
- Proposed Phase 2 targets (with justification)
- Prioritized list of quick wins vs larger refactors
- Estimated effort for each recommendation

---

## Phase 2: Consolidation (Targets TBD by Audit)

### AC-5: Machine Remains Usable During Test Run
**Given** a developer runs `npm test`
**When** the test suite executes
**Then** CPU usage stays below 80% sustained
**And** the developer can continue working (IDE responsive, browser usable)
**And** memory usage stays under 4GB

### AC-6: Subset Execution Enabled
**Given** a developer working on a specific feature
**When** they want to run relevant tests
**Then** they can use `--changed` flag to run only affected tests
**And/Or** they can use tags/patterns to run specific test categories
**And** documentation explains the available options

### AC-7: Redundant Tests Consolidated
**Given** the audit identified redundant tests
**When** consolidation is complete
**Then** overlapping tests are merged or removed
**And** parameterized tests (`test.each()`) replace repetitive similar tests
**And** test count is reduced by target % (TBD from audit)
**And** no reduction in actual coverage of critical paths

### AC-8: CI Pipeline Optimized
**Given** the CI pipeline
**When** tests run on PR
**Then** test sharding is configured (if audit shows benefit)
**And** caching is optimized for test artifacts
**And** CI test time is documented (baseline vs optimized)

---

## Technical Notes

### Current State (Baseline)
- 175 test files
- 2,796 individual tests
- ~20s full run
- High resource usage (machine freezes)
- Mix of unit, integration, component, hook, API, and E2E tests

### Prime Consolidation Candidates
1. **AI Buddy tests (Epics 14-20)** - Recently added, likely over-tested during feature build. Each story added tests in isolation without stepping back to check for redundancy.
2. **Component tests** - May be testing render details rather than behavior
3. **Hook tests** - Can likely consolidate with `test.each()` patterns
4. **API route tests** - May duplicate integration test coverage

### Audit Commands
```bash
# Coverage analysis
npm test -- --coverage --reporter=json > coverage-report.json

# Test duration profiling
npm test -- --reporter=verbose 2>&1 | grep -E "duration|PASS|FAIL"

# Count by directory
find __tests__ -name "*.test.ts" -o -name "*.test.tsx" | xargs dirname | sort | uniq -c | sort -rn
```

### Vitest Configuration Options
```typescript
// vitest.config.ts options to explore
{
  maxConcurrency: 5,        // Limit parallel tests
  maxWorkers: '50%',        // Use half of available CPUs
  minWorkers: 1,            // Minimum workers
  isolate: false,           // Share environment (faster but riskier)
  pool: 'threads',          // vs 'forks' - threads are lighter
}
```

---

## Team Discussion Summary (2025-12-09)

**Participants:** Murat (Test Architect), Amelia (Dev), Winston (Architect), John (PM), Mary (Analyst), Sally (UX), Bob (SM)

**Key Decisions:**
1. **Two-phase approach** - Audit before setting targets; can't optimize what you don't understand
2. **Experience-focused metric** - "Can I keep working?" is more important than raw seconds
3. **AI Buddy tests** identified as prime candidates for consolidation
4. **Resource throttling** may be as important as test reduction

**Insight from Sally (UX):** The developer IS the user. 20 seconds waiting while machine is responsive = acceptable. 20 seconds of machine freeze = rage-inducing. Measure experience, not just time.

---

## Dependencies

- None (can be done independently)

---

## Out of Scope

- Adding new test coverage
- Changing testing framework (staying with Vitest)
- Major architectural changes to test structure
- Rewriting tests from scratch

---

## Definition of Done

- [ ] Phase 1 audit report complete with all findings
- [ ] Phase 2 targets defined based on audit data
- [ ] All Phase 2 ACs met (after targets defined)
- [ ] Developer documentation updated with new test running options
- [ ] Team sign-off that local dev experience is improved
