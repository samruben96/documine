# Story Q7-3: RAM Mutual Carrier Configuration

## Story

**As a** user
**I want** RAM Mutual added as a supported carrier
**So that** I can get quotes from RAM Mutual via AI automation

## Description

Add RAM Mutual to the carrier registry with:
1. Carrier configuration (portal URL, logo, lines of business)
2. Clipboard formatter for manual workflow (Phase 3)
3. AI automation configuration for Browser Use
4. Live testing with actual portal credentials

## Acceptance Criteria

### AC-Q7.3-1: Carrier Registry Entry
- [ ] RAM Mutual added to `CARRIERS` in `src/lib/quoting/carriers/index.ts`
- [ ] Carrier code: `ram-mutual`
- [ ] Display name: `RAM Mutual`
- [ ] Portal URL configured correctly
- [ ] Logo asset added to `/public/carriers/`
- [ ] Lines of business: `['auto', 'home']`

### AC-Q7.3-2: Clipboard Formatter
- [ ] Create `src/lib/quoting/carriers/ram-mutual.ts`
- [ ] `formatForClipboard()` outputs RAM Mutual format
- [ ] `generatePreview()` creates UI preview
- [ ] `validateRequiredFields()` checks required fields
- [ ] Formatter follows RAM Mutual portal field order

### AC-Q7.3-3: AI Automation Config
- [ ] Create RAM Mutual automation prompt template
- [ ] Configure form field mappings
- [ ] Document portal navigation flow
- [ ] Test automation with headless=false to observe

### AC-Q7.3-4: Live Testing
- [ ] Portal credentials configured (env vars for POC)
- [ ] Browser Use successfully logs into portal
- [ ] Form filling completes without errors
- [ ] Quote result extracted successfully
- [ ] Screenshot captured of final quote page

### AC-Q7.3-5: Test Coverage
- [ ] Unit tests for formatter
- [ ] Integration test with mock portal (if possible)
- [ ] Manual validation with live portal documented

## Technical Notes

### RAM Mutual Portal Info

- **Company:** RAM Mutual Insurance Company
- **Portal URL:** https://www.rfrm.com/agents (verify with user)
- **Headquarters:** Evansville, Wisconsin
- **Lines:** Auto, Home, Farm, Umbrella
- **Focus:** Personal lines in Wisconsin/Illinois

### Carrier Registry Entry

```typescript
// src/lib/quoting/carriers/index.ts
import { ramMutualFormatter } from './ram-mutual';

export const CARRIERS: Record<string, CarrierInfo> = {
  // ... existing carriers
  'ram-mutual': {
    code: 'ram-mutual',
    name: 'RAM Mutual',
    portalUrl: 'https://www.rfrm.com/agents', // Verify
    logoPath: '/carriers/ram-mutual.svg',
    formatter: ramMutualFormatter,
    linesOfBusiness: ['home', 'auto'],
  },
};
```

### Formatter Template

```typescript
// src/lib/quoting/carriers/ram-mutual.ts
import type { CarrierFormatter, FormattedPreview, ValidationResult } from './types';
import type { QuoteClientData } from '@/types/quoting';

export const ramMutualFormatter: CarrierFormatter = {
  formatForClipboard(data: QuoteClientData): string {
    // Format data for RAM Mutual portal copy/paste
    const lines: string[] = [];

    // Personal info section
    lines.push('=== APPLICANT INFO ===');
    lines.push(`Name:\t${data.personal?.firstName} ${data.personal?.lastName}`);
    lines.push(`DOB:\t${formatDate(data.personal?.dateOfBirth)}`);
    // ... continue with all fields

    return lines.join('\n');
  },

  generatePreview(data: QuoteClientData): FormattedPreview {
    // Generate structured preview for UI
  },

  validateRequiredFields(data: QuoteClientData): ValidationResult {
    // Check RAM Mutual required fields
  },
};
```

### Environment Variables (Temporary)

```bash
# RAM Mutual test credentials (move to vault in Q8)
RAM_MUTUAL_USERNAME=agent@example.com
RAM_MUTUAL_PASSWORD=***
RAM_MUTUAL_AGENCY_CODE=12345
```

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/quoting/carriers/ram-mutual.ts` | Create | Formatter implementation |
| `src/lib/quoting/carriers/index.ts` | Modify | Add to registry |
| `public/carriers/ram-mutual.svg` | Create | Carrier logo |
| `__tests__/lib/quoting/carriers/ram-mutual.test.ts` | Create | Unit tests |
| `.env.example` | Modify | Document credentials |

## Dependencies

- Story Q7-1: Browser Use Setup (for live testing)
- Story Q7-2: BrowserUseAdapter (for automation testing)
- RAM Mutual portal credentials from user

## Estimation

- **Story Points:** 3
- **Complexity:** Medium
- **Risk:** Medium (portal structure unknown until explored)

## Definition of Done

- [ ] RAM Mutual in carrier registry
- [ ] Formatter implemented and tested
- [ ] Live portal login succeeds
- [ ] At least one successful quote extraction
- [ ] Documentation updated
- [ ] Code review approved
