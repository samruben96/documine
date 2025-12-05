# Technical Details

## Extraction Prompt Engineering (Story 10.10)

**Challenge:** Current prompt is ~200 lines. Adding all new fields risks prompt degradation.

**Strategy:**
1. **Structured sections** - Group related instructions (Endorsements, Carrier, Premium)
2. **Examples** - Add few-shot examples for complex extractions
3. **Mappings** - Clear field mappings (like existing coverage type mappings)
4. **Testing** - Benchmark accuracy before/after on test corpus

**New Prompt Sections (~150 additional lines):**

```
ENDORSEMENT EXTRACTION:
- Section indicators: "Endorsements", "Schedule of Forms", "Attached Forms"
- Extract form numbers exactly (preserve spaces: "CG 20 10" not "CG2010")
- Classification:
  * broadening: Adds coverage (Additional Insured, Blanket endorsements)
  * restricting: Limits coverage (Exclusions, Limitations)
  * conditional: Depends on circumstances (Audit provisions)

CRITICAL ENDORSEMENTS (prioritize finding these):
1. CG 20 10 - Additional Insured - Owners, Lessees or Contractors
2. CG 20 37 - Additional Insured - Owners, Lessees or Contractors - Completed Operations
3. CG 24 04 - Waiver of Transfer of Rights (Waiver of Subrogation)
4. CG 20 01 - Primary and Non-Contributory
5. Blanket Additional Insured (any form)

POLICY METADATA:
- Policy Type indicators:
  * "Occurrence" → occurrence
  * "Claims-Made", "Claims Made" → claims-made
- Form numbers appear on declarations page (CG 0001 = ISO CGL form)
- Retroactive date only applies to claims-made policies
- Audit provisions: look for "audit", "premium adjustment"

CARRIER INFORMATION:
- AM Best ratings: A++, A+, A, A-, B++, B+, B, B-, C++, C+, C, C-
- Financial Size Class: I through XV (Roman numerals)
- Admitted vs Non-Admitted: look for "surplus lines", "excess lines", "non-admitted"

PREMIUM BREAKDOWN:
- Look for itemized premium schedules
- Separate: base premium, taxes, fees, surplus lines tax
- Payment terms: annual, semi-annual, quarterly, monthly
```

## Gap Analysis Logic (Story 10.7)

**Detection Rules:**

```typescript
// Critical missing coverages (based on business type)
const CRITICAL_COVERAGES: CoverageType[] = [
  'general_liability',  // Always critical
  'property',           // If any property exposure
  'workers_comp',       // If employees in states requiring it
];

// Critical endorsements
const CRITICAL_ENDORSEMENTS = [
  { form: 'CG 20 10', name: 'Additional Insured - OLC', importance: 'critical' },
  { form: 'CG 20 37', name: 'Additional Insured - Completed Ops', importance: 'critical' },
  { form: 'Waiver of Subrogation', importance: 'critical' },
  { form: 'Primary and Non-Contributory', importance: 'recommended' },
];

// Limit adequacy (industry minimums)
const MINIMUM_LIMITS: Record<CoverageType, number> = {
  general_liability: 1000000,      // $1M per occurrence
  property: 500000,                // $500K building
  umbrella: 1000000,               // $1M umbrella
  professional_liability: 1000000, // $1M E&O
  cyber: 500000,                   // $500K cyber
};
```

**Gap Analysis Algorithm:**
1. Compare each quote against CRITICAL_COVERAGES → flag missing
2. Compare endorsements across quotes → flag inconsistencies
3. Check limits against MINIMUM_LIMITS → flag inadequate
4. Calculate overallRiskScore based on severity and count

## UI Implementation (Story 10.8)

**Collapsible Sections Pattern:**
```tsx
<ComparisonSection
  title="Policy Overview"
  defaultOpen={true}
>
  {/* Carrier, dates, policy type */}
</ComparisonSection>

<ComparisonSection
  title="Coverage Comparison"
  defaultOpen={true}
>
  {/* Existing coverage table */}
</ComparisonSection>

<ComparisonSection
  title="Endorsements"
  defaultOpen={false}
  badge={endorsementCount}
>
  <EndorsementMatrix quotes={extractions} />
</ComparisonSection>

<ComparisonSection
  title="Premium Breakdown"
  defaultOpen={false}
>
  <PremiumBreakdownTable quotes={extractions} />
</ComparisonSection>
```

**Endorsement Matrix:**
| Endorsement | Quote A | Quote B | Quote C |
|-------------|---------|---------|---------|
| Additional Insured (CG 20 10) | ✅ | ✅ | ❌ |
| Waiver of Subrogation | ✅ | ❌ | ✅ |
| Primary & Non-Contributory | ❌ | ✅ | ❌ |

---
