# Testing Approach

## Test Framework & Standards

**Framework:** Vitest 4.0.14 + Playwright 1.57.0
**Coverage Target:** >80% for new code

## Test Categories

**1. Schema Validation (High Volume)**
```typescript
describe('Enhanced QuoteExtraction Schema', () => {
  it('validates PolicyMetadata with all fields')
  it('validates PolicyMetadata with minimal fields')
  it('validates Endorsement array')
  it('validates CarrierInfo with AM Best rating')
  it('validates PremiumBreakdown with itemized costs')
  it('handles null fields gracefully')
  it('rejects invalid coverage types')
  it('rejects invalid policy types')
})
```

**2. Gap Analysis Logic (Medium Volume)**
```typescript
describe('Gap Analysis Service', () => {
  it('detects missing critical coverages')
  it('detects missing critical endorsements')
  it('detects inadequate limits')
  it('calculates risk score correctly')
  it('handles quotes with no gaps')
  it('compares endorsements across multiple quotes')
})
```

**3. Backward Compatibility (Critical)**
```typescript
describe('Backward Compatibility', () => {
  it('loads v1 extraction without new fields')
  it('renders v1 extraction in UI')
  it('cache invalidates on version bump')
  it('new extraction includes all fields')
})
```

**4. E2E Tests**
```typescript
describe('Enhanced Extraction E2E', () => {
  it('extracts endorsements from uploaded quote')
  it('displays endorsement matrix in comparison')
  it('shows gap analysis banner for missing endorsements')
  it('includes new sections in one-pager PDF')
})
```

---
