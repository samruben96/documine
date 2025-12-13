# Story Q7-5: A/B Testing & Comparison

## Story

**As a** product owner
**I want** documented A/B testing results comparing Browser Use and Skyvern
**So that** we can make data-driven decisions about which agent to use per carrier

## Description

Conduct systematic A/B testing between Browser Use and Skyvern:
1. Run both agents on RAM Mutual portal
2. Track success rates, timing, and costs
3. Document qualitative observations
4. Create comparison report with recommendations

## Acceptance Criteria

### AC-Q7.5-1: Test Infrastructure
- [ ] Logging captures agent selection per job
- [ ] Success/failure tracked per agent per carrier
- [ ] Timing captured (start to completion)
- [ ] LLM token usage tracked for cost estimation

### AC-Q7.5-2: RAM Mutual Testing
- [ ] Minimum 5 test runs per agent
- [ ] Same test data used for both agents
- [ ] Screenshots captured for each run
- [ ] Results logged to database

### AC-Q7.5-3: Metrics Collection
- [ ] Success rate (% of successful quotes)
- [ ] Average completion time
- [ ] Error distribution by type
- [ ] Estimated cost per quote

### AC-Q7.5-4: Comparison Report
- [ ] Create `docs/features/research/browser-use-vs-skyvern-comparison.md`
- [ ] Side-by-side metrics comparison
- [ ] Qualitative observations (ease of use, reliability)
- [ ] Recommendations per carrier
- [ ] Screenshots of key differences

### AC-Q7.5-5: Configuration Update
- [ ] Update carrier-agent configs based on results
- [ ] Set optimal A/B split percentages
- [ ] Document rationale for choices

## Technical Notes

### Test Data Template

```typescript
// Use consistent test data across both agents
const testClientData: QuoteClientData = {
  personal: {
    firstName: 'John',
    lastName: 'TestUser',
    dateOfBirth: '1985-06-15',
    email: 'john.test@example.com',
    phone: '555-123-4567',
  },
  property: {
    address: '123 Test Street',
    city: 'Madison',
    state: 'WI',
    zip: '53703',
    yearBuilt: 2000,
    squareFeet: 2000,
  },
  auto: {
    vehicles: [{
      year: 2020,
      make: 'Toyota',
      model: 'Camry',
      vin: 'TEST1234567890123',
    }],
  },
  drivers: [{
    firstName: 'John',
    lastName: 'TestUser',
    dateOfBirth: '1985-06-15',
    licenseNumber: 'T123-4567-8901',
    licenseState: 'WI',
  }],
};
```

### Metrics Schema

```typescript
interface AgentTestResult {
  testId: string;
  agentType: 'browser-use' | 'skyvern';
  carrierCode: string;
  success: boolean;
  durationMs: number;
  errorCode?: string;
  errorMessage?: string;
  llmTokensUsed?: number;
  estimatedCost?: number;
  screenshotUrl?: string;
  timestamp: string;
}
```

### Comparison Report Template

```markdown
# Browser Use vs Skyvern Comparison Report

## Executive Summary
[One paragraph summary]

## Test Methodology
- Test period: [dates]
- Carriers tested: RAM Mutual
- Test runs per agent: [N]
- Test data: Standardized personal auto quote

## Results

### RAM Mutual Carrier

| Metric | Browser Use | Skyvern |
|--------|-------------|---------|
| Success Rate | X% | Y% |
| Avg Duration | Xs | Ys |
| Avg Cost | $X | $Y |
| Errors | [breakdown] | [breakdown] |

### Key Observations
1. [Observation 1]
2. [Observation 2]

### Screenshots
[Side by side screenshots]

## Recommendations
- RAM Mutual: Use [agent] because [reason]
- Default agent: [agent]
- A/B testing: [continue/conclude]

## Next Steps
1. [Action item]
2. [Action item]
```

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `scripts/run-ab-test.ts` | Create | Test runner script |
| `docs/features/research/browser-use-vs-skyvern-comparison.md` | Create | Comparison report |
| `src/lib/quoting/agent/agent-factory.ts` | Modify | Update configs based on results |

## Dependencies

- Story Q7-1: Browser Use Setup (completed)
- Story Q7-2: BrowserUseAdapter (completed)
- Story Q7-3: RAM Mutual Carrier (completed)
- Story Q7-4: Agent Factory (completed)

## Estimation

- **Story Points:** 2
- **Complexity:** Low
- **Risk:** Low (analysis work, no new code risk)

## Definition of Done

- [ ] Minimum 5 tests run per agent
- [ ] All metrics captured
- [ ] Comparison report created
- [ ] Recommendations documented
- [ ] Configs updated based on findings
- [ ] Code review approved (for report)
