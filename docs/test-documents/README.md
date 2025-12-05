# Test Documents for Quote Extraction

This directory contains anonymized commercial policy documents for testing extraction accuracy.

## Purpose

Per AC-10.10.6, we maintain a test corpus of 5+ real commercial policies to measure extraction accuracy.

## Accuracy Targets

| Field Type | Target Accuracy |
|------------|-----------------|
| Original fields (carrier, policy#, dates, basic coverages) | 95%+ |
| New fields (endorsements, metadata, carrier info, premium) | 90%+ |

## Test Document Structure

Each test document should have:
1. The document itself (PDF, anonymized)
2. An expected extraction JSON file (same name with `.expected.json` suffix)

Example:
```
test-policy-1.pdf
test-policy-1.expected.json
```

## Expected JSON Format

```json
{
  "carrierName": "Example Insurance Co",
  "policyNumber": "POL-12345",
  "namedInsured": "Test Corp",
  "effectiveDate": "2024-01-01",
  "expirationDate": "2025-01-01",
  "annualPremium": 15000,
  "coverages": [
    {
      "type": "general_liability",
      "name": "Commercial General Liability",
      "limit": 1000000,
      "limitType": "per_occurrence",
      "deductible": 5000,
      "description": "Standard CGL coverage",
      "sourcePages": [3, 4]
    }
  ],
  "exclusions": [],
  "deductibles": []
}
```

## Coverage Types to Test

### Original Types (9)
- general_liability
- property
- auto_liability
- auto_physical_damage
- umbrella
- workers_comp
- professional_liability
- cyber
- other

### New Types (12) - Epic 10
- epli
- d_and_o
- crime
- pollution
- inland_marine
- builders_risk
- business_interruption
- product_liability
- garage_liability
- liquor_liability
- medical_malpractice
- fiduciary

## Running Accuracy Tests

```bash
# Run extraction accuracy tests
npm run test -- __tests__/lib/compare/extraction-accuracy.test.ts
```

## Adding New Test Documents

1. Obtain a commercial policy PDF
2. Anonymize all PII (company names, addresses, policy numbers)
3. Create the expected extraction JSON
4. Add both files to this directory
5. Update the test file to include the new document

## Document Sources

Test documents should represent a variety of:
- Carrier types (admitted, surplus lines)
- Policy types (occurrence, claims-made)
- Coverage combinations
- Document formats (different carriers have different layouts)
