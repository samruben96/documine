# Critical Issues

## AC-6.8.7: Mobile Header Overflow Fix
**Priority:** 🔴 Critical | **Effort:** XS

**Given** the mobile viewport (< 640px)
**When** viewing any page with the header
**Then** the "docuMINE" logo displays fully without truncation

**Problem:** Logo shows as "uMINE" due to nav items crowding.
**Fix:** Hide nav links behind hamburger menu on mobile, give logo proper space.

## AC-6.8.8: Primary Button Color Verification
**Priority:** 🔴 Critical | **Effort:** S

**Given** the OKLCH color definition for primary
**When** viewing primary buttons in the browser
**Then** buttons display vibrant Electric Blue (#3b82f6), not a muted/dark variant

**Problem:** Buttons appear darker than intended in screenshots.
**Action:** Verify OKLCH conversion, test in different browsers.

---
