# Acceptance Criteria

1. **AC-3.4.1:** Billing tab shows: Current plan name, Seat limit, Current usage (X/Y seats used)
   - Displays subscription tier prominently (Starter/Professional/Agency)
   - Shows seats used vs seat limit (e.g., "3 of 5 seats used")
   - Uses progress bar or visual indicator for seat usage

2. **AC-3.4.2:** Plan tier displayed with feature summary (Starter: 3 seats, Professional: 10 seats, Agency: 25 seats)
   - Card or section shows current plan features
   - Displays seat limit for current tier
   - Clear visual distinction between tiers

3. **AC-3.4.3:** "Contact support to change plan" message displayed (no self-service for MVP)
   - Clear message that plan changes require contacting support
   - Support email or link provided
   - Professional tone explaining MVP limitation

4. **AC-3.4.4:** ~~Stripe integration~~ DEFERRED per Epic 2 retro - future "Billing Infrastructure Epic"
   - No payment processing in MVP
   - No Stripe Customer Portal redirect
   - Manual tier assignment only

5. **AC-3.4.5:** Non-admin users see Billing tab in view-only mode
   - Billing information visible to all team members
   - No action buttons for non-admins
   - Clear visual indication of view-only state

6. **AC-3.4.6:** Admin can manually change tier via `updateSubscriptionTier()` (internal use only for MVP)
   - Server action for manual tier changes (used by support/admin)
   - Validates seat limit not exceeded when downgrading
   - Updates both subscription_tier and seat_limit fields
