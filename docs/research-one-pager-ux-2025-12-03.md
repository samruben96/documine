# One-Pager UX Research: Professional Insurance Comparison Templates

**Researcher:** Sally (UX Designer)
**Date:** 2025-12-03
**Purpose:** Inform Epic 9 One-Pager Generation design

---

## Research Summary

This research examines professional insurance one-pager and comparison templates to identify best practices for docuMINE's one-pager generation feature.

---

## Key Findings

### 1. Essential Sections for Insurance One-Pagers

Based on industry templates ([Insly](https://insly.com/en/blog/the-art-of-crafting-an-effective-insurance-proposal-tips-and-templates/), [Proposify](https://www.proposify.com/proposal-templates/insurance-proposal-template)):

| Section | Purpose | Priority |
|---------|---------|----------|
| **Coverage Schedule** | Table of key coverages, limits, deductibles | Critical |
| **Premium Summary** | Total cost, payment options | Critical |
| **Coverage Comparison** | Side-by-side carrier differences | Critical |
| **Gaps/Exclusions** | What's NOT covered | High |
| **Recommendation** | Agent's suggested option | Medium |
| **Next Steps** | Clear call to action | Medium |

### 2. Visual Design Best Practices

From [Better Proposals](https://betterproposals.io/proposal-templates/insurance-proposal-template) and [Qwilr](https://qwilr.com/blog/how-to-write-a-commercial-insurance-proposal/):

- **Clean, Professional Layout**: Insurance clients expect conservative, trustworthy design
- **Agency Branding**: Logo, colors, contact info prominently displayed
- **Table-Heavy Format**: Coverage comparisons work best as structured tables
- **Visual Hierarchy**: Most important info (premium, key differences) highlighted
- **Scannable**: Clients should grasp key points in 30 seconds
- **Single Page**: True one-pager (or max 2 pages for complex comparisons)

### 3. Comparison Table Structure

From [SlideTeam](https://www.slideteam.net/one-pager-for-price-comparison-chart-of-multiple-health-insurance-plans-report-infographic-ppt-pdf-document.html) and [PrintFriendly](https://www.printfriendly.com/document/auto-insurance-comparison-worksheet):

```
| Coverage Type     | Carrier A      | Carrier B      | Carrier C      |
|-------------------|----------------|----------------|----------------|
| Liability         | $500K/$1M      | $1M/$2M        | $500K/$1M      |
| Property          | $2M            | $1.5M          | $2M            |
| Deductible        | $5,000         | $2,500         | $10,000        |
| Annual Premium    | $12,500        | $15,200        | $9,800         |
```

**Key pattern**: Rows = coverage types, Columns = carriers

### 4. Trust Elements

Critical for insurance (from [Insly](https://insly.com/en/blog/the-art-of-crafting-an-effective-insurance-proposal-tips-and-templates/)):

- **Source transparency**: "Data extracted from [Document Name]"
- **Date stamp**: When comparison was generated
- **Agent attribution**: Who prepared this comparison
- **Disclaimer**: Standard E&O protection language

### 5. Call to Action

From [Better Proposals](https://betterproposals.io/proposal-templates/insurance-proposal-template):

- Clear "Next Steps" section
- Agent contact information
- "Ready to proceed? Contact [Agent Name]"
- Optional: Digital signature capability (future feature)

---

## Recommended One-Pager Template Structure

Based on research, the optimal one-pager structure for docuMINE:

```
┌─────────────────────────────────────────────────────────────┐
│ [Agency Logo]                      [Date: Dec 3, 2025]      │
│                                                             │
│          INSURANCE COMPARISON SUMMARY                       │
│          Prepared for: [Client Name]                        │
│          Prepared by: [Agent Name]                          │
├─────────────────────────────────────────────────────────────┤
│ COVERAGE COMPARISON                                         │
│ ┌─────────────┬──────────┬──────────┬──────────┐           │
│ │ Coverage    │ Option A │ Option B │ Option C │           │
│ ├─────────────┼──────────┼──────────┼──────────┤           │
│ │ Liability   │ $500K    │ $1M      │ $500K    │           │
│ │ Property    │ $2M      │ $1.5M    │ $2M      │           │
│ │ Deductible  │ $5,000   │ $2,500   │ $10,000  │           │
│ │ ...         │ ...      │ ...      │ ...      │           │
│ └─────────────┴──────────┴──────────┴──────────┘           │
├─────────────────────────────────────────────────────────────┤
│ PREMIUM COMPARISON                                          │
│ Option A: $12,500/yr  │  Option B: $15,200/yr  │  ...      │
├─────────────────────────────────────────────────────────────┤
│ ⚠️ KEY DIFFERENCES                                          │
│ • Option B has higher liability limits                      │
│ • Option C has lowest premium but highest deductible        │
│ • Only Option A includes cyber coverage                     │
├─────────────────────────────────────────────────────────────┤
│ 🔴 COVERAGE GAPS                                            │
│ • None of the options include flood coverage                │
│ • Option C excludes professional liability                  │
├─────────────────────────────────────────────────────────────┤
│ NEXT STEPS                                                  │
│ Contact [Agent Name] at [Phone] or [Email]                  │
│ to discuss these options and select your coverage.          │
├─────────────────────────────────────────────────────────────┤
│ [Agency Name] │ [Address] │ [Phone] │ [Website]             │
│ Comparison generated by docuMINE on [Date]                  │
│ Source documents: [Doc1.pdf], [Doc2.pdf], [Doc3.pdf]        │
└─────────────────────────────────────────────────────────────┘
```

---

## Design Specifications

### Colors & Branding

| Element | Approach |
|---------|----------|
| Primary Color | Agency's brand color (configurable) |
| Secondary Color | Agency's accent color (configurable) |
| Background | White (#FFFFFF) |
| Text | Dark gray (#1F2937) |
| Table Headers | Agency primary color |
| Warnings/Gaps | Red accent (#DC2626) |
| Highlights | Yellow accent (#FCD34D) |

### Typography

| Element | Font | Size |
|---------|------|------|
| Title | Sans-serif (Inter/Helvetica) | 24px |
| Section Headers | Sans-serif Bold | 16px |
| Table Headers | Sans-serif Bold | 12px |
| Body Text | Sans-serif | 11px |
| Footer | Sans-serif | 9px |

### Page Layout

- **Page Size**: US Letter (8.5" x 11")
- **Margins**: 0.5" all sides
- **Target**: Single page for 2-3 quote comparison
- **Fallback**: 2 pages for 4+ quotes or complex coverages

---

## Agency Branding Requirements

### MVP Branding Fields

| Field | Type | Required |
|-------|------|----------|
| Agency Name | Text | Yes |
| Agency Logo | Image (PNG/JPG) | Optional |
| Primary Color | Hex code | Optional (default: #2563EB) |
| Phone | Text | Yes |
| Email | Text | Yes |
| Address | Text | Optional |
| Website | URL | Optional |

### Logo Handling

- **Placement**: Top-left header
- **Max Dimensions**: 200px x 60px
- **Fallback**: Agency name in styled text if no logo
- **Format**: PNG with transparency preferred

---

## Competitive Analysis

| Platform | Strengths | Gaps |
|----------|-----------|------|
| [Jotform](https://www.jotform.com/pdf-templates/insurance-quote) | Customizable templates, PDF export | Manual data entry required |
| [Proposify](https://www.proposify.com/proposal-templates/insurance-proposal-template) | Professional design, e-signature | Expensive, complex |
| [Canva](https://www.canva.com/templates/s/insurance/) | Beautiful templates | Manual, not data-driven |
| [PandaDoc](https://www.pandadoc.com/insurance-proposal-template/) | CRM integration | Overkill for simple comparisons |

**docuMINE Advantage**: Auto-generated from extracted data, no manual entry, source citations included.

---

## Recommendations for Epic 9

### Must-Have (MVP)

1. **Comparison table** with coverage rows, carrier columns
2. **Premium summary** prominently displayed
3. **Key differences** highlighted
4. **Agency branding** (name, logo, contact)
5. **PDF export** with professional formatting
6. **Source attribution** for trust

### Nice-to-Have (Future)

1. **Agent recommendation** section
2. **Custom notes** field
3. **Digital signature** integration
4. **Email direct send** from app
5. **Template variants** (detailed vs. summary)

---

## Sources

- [SlideTeam - Insurance Comparison Templates](https://www.slideteam.net/one-pager-for-price-comparison-chart-of-multiple-health-insurance-plans-report-infographic-ppt-pdf-document.html)
- [Jotform - Insurance Quote Templates](https://www.jotform.com/pdf-templates/insurance-quote)
- [Insly - Crafting Effective Insurance Proposals](https://insly.com/en/blog/the-art-of-crafting-an-effective-insurance-proposal-tips-and-templates/)
- [Proposify - Insurance Proposal Template](https://www.proposify.com/proposal-templates/insurance-proposal-template)
- [Better Proposals - Insurance Quote Template](https://betterproposals.io/proposal-templates/insurance-proposal-template)
- [Qwilr - Commercial Insurance Proposal Guide](https://qwilr.com/blog/how-to-write-a-commercial-insurance-proposal/)
- [PrintFriendly - Auto Insurance Comparison](https://www.printfriendly.com/document/auto-insurance-comparison-worksheet)
- [Canva - Insurance Templates](https://www.canva.com/templates/s/insurance/)
- [PandaDoc - Commercial Insurance Template](https://www.pandadoc.com/insurance-proposal-template/)

---

*Research compiled by Sally (UX Designer) for Epic 9 planning*
