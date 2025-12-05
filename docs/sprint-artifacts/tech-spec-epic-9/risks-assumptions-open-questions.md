# Risks, Assumptions, Open Questions

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **R1:** Logo rendering fails in PDF | Medium | Medium | Base64 conversion with text fallback |
| **R2:** PDF doesn't fit single page with large data | Medium | Low | Limit comparison to 10 coverage rows per page |
| **R3:** Live preview is sluggish | Low | Medium | Debounce form updates, memoize PDF render |
| **R4:** Admin-only access bypassed | Low | High | RLS policies at database level |

## Assumptions

| ID | Assumption | Validation |
|----|------------|------------|
| **A1** | @react-pdf/renderer handles dynamic branding colors | Tested in Story 7.6 |
| **A2** | Agencies have at most 2MB logo files | Enforce in upload validation |
| **A3** | Users understand "One-Pager" terminology | Consider "Client Summary" as alternative |
| **A4** | Single-page format is sufficient for typical comparisons | Research shows 2-4 quotes with 10-15 coverages |

## Open Questions

| ID | Question | Resolution Path |
|----|----------|-----------------|
| **Q1** | Should we support document-only one-pagers (no comparison)? | Yes - included in scope |
| **Q2** | How to handle comparisons with 5+ quotes? | Two-page layout or limit selection |
| **Q3** | Custom fields per agency? | Future enhancement - not MVP |

---
