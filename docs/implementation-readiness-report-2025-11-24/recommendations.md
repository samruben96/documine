# Recommendations

## Immediate Actions Required

**None.** No blocking issues that must be resolved before implementation begins.

## Suggested Improvements

1. **Add invitations table to database schema**
   - Update Architecture doc or add to Story 1.2/3.2
   - Simple addition: `invitations (id, agency_id, email, role, token, status, expires_at, created_at)`

2. **Decide on Stripe integration scope for MVP**
   - Option A: Full Stripe integration in Story 3.4
   - Option B: Stub with manual tier assignment (faster MVP)
   - Recommend: Option B for faster MVP, add full Stripe in Phase 2

3. **Establish golden dataset early**
   - Start collecting test PDFs (policies, quotes) during Epic 1
   - Document expected extraction results for each
   - Use for manual QA validation before releases

## Sequencing Adjustments

**Current sequence is optimal. No changes recommended.**

Proposed implementation order:
1. **Epic 1** (Foundation) - Weeks 1-2
2. **Epic 2** (Auth) - Weeks 2-3
3. **Epic 4** (Documents) + **Epic 3** (Agency) in parallel - Weeks 3-5
4. **Epic 5** (Q&A) - Weeks 5-7
5. **Epic 6** (Comparison) - Weeks 7-8

*Note: Timeline estimates removed per workflow guidelines. Actual duration depends on team capacity and velocity.*

---
