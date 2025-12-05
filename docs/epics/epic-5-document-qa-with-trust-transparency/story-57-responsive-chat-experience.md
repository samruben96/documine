# Story 5.7: Responsive Chat Experience

As a **mobile/tablet user**,
I want **to ask questions about documents on smaller screens**,
So that **I can use docuMINE on any device**.

**Acceptance Criteria:**

**Given** I am on a tablet or mobile device
**When** I view a document
**Then** the layout adapts:

**Tablet (640-1024px):**
- Split view maintained but narrower
- Sidebar collapsed by default (hamburger toggle)
- Chat panel 40% width

**Mobile (<640px):**
- Tabbed interface: [Document] [Chat] tabs
- Swipe gesture to switch tabs
- Tab indicator shows current view
- Chat input fixed at bottom of screen

**And** touch-friendly interactions:
- All buttons minimum 44x44px touch targets
- Tap source citation → switch to Document tab + scroll to source
- No hover-dependent features (tooltips on tap instead)

**And** the experience maintains:
- Same trust elements (confidence, citations)
- Same streaming response feel
- Document readable at mobile zoom levels

**Prerequisites:** Story 5.5

**Technical Notes:**
- Use CSS media queries for breakpoint detection
- Tab state managed in React state
- Touch events for swipe (optional: use library)
- Test on actual mobile devices

---
