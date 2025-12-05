# 7. UX Pattern Decisions

## 7.1 Consistency Rules

These patterns ensure a consistent experience across all screens.

### Button Hierarchy

| Type | Style | Usage |
|------|-------|-------|
| Primary | Solid slate (#475569), white text | Main action per screen (Send, Compare, Upload) |
| Secondary | Outline, slate border | Supporting actions (View Document, Export) |
| Ghost | Text only, slate color | Tertiary actions (Cancel, Back) |
| Destructive | Solid red (#dc2626), white text | Delete, Remove (always with confirmation) |

**Rule:** One primary button per view. Never two competing primary actions.

---

### Feedback Patterns

| Feedback Type | Pattern | Duration |
|---------------|---------|----------|
| Success | Toast (bottom-right), green accent | 3 seconds, auto-dismiss |
| Error | Toast (bottom-right), red accent | Persistent until dismissed |
| Warning | Inline alert, amber accent | Persistent |
| Info | Inline or toast, slate accent | Context-dependent |
| Loading (< 200ms) | No indicator | — |
| Loading (> 200ms) | Skeleton shimmer | Until complete |
| Loading (> 2s) | Progress indicator | Until complete |

**Rule:** Never show a spinner for less than 200ms. Use skeleton states for content loading.

---

### Form Patterns

| Element | Pattern |
|---------|---------|
| Labels | Above input, 13px, medium weight |
| Required fields | No indicator (assume all required unless stated optional) |
| Optional fields | "(optional)" suffix on label |
| Validation timing | On blur for format, on submit for required |
| Error display | Inline below field, red text, 12px |
| Help text | Below input, muted text, 12px |

**Rule:** Forms are minimal. Only ask for what's needed.

---

### Modal Patterns

| Aspect | Pattern |
|--------|---------|
| Size | Small (400px) for confirms, Medium (600px) for forms |
| Dismiss | Click outside, Escape key, or explicit close button |
| Focus | Auto-focus first interactive element |
| Stacking | Never stack modals. Close current before opening new. |

**Rule:** Modals are rare. Prefer inline interactions where possible.

---

### Navigation Patterns

| Element | Pattern |
|---------|---------|
| Active state | Left border accent + darker background (sidebar) |
| Breadcrumbs | Not used (flat navigation) |
| Back button | Browser back works naturally |
| Deep linking | All views are URL-addressable |

**Rule:** Navigation is minimal. Sidebar + top bar only.

---

### Empty State Patterns

| Context | Pattern |
|---------|---------|
| No documents | Centered upload zone with clear CTA |
| No search results | "No documents match your search" + clear search button |
| No conversation | "Ask anything about this document" placeholder |
| Error loading | "Something went wrong" + retry button |

**Rule:** Empty states guide action. Never leave users stranded.

---

### Confirmation Patterns

| Action | Confirmation |
|--------|--------------|
| Delete document | Modal: "Delete [filename]? This can't be undone." |
| Leave unsaved | None (auto-save everything) |
| Logout | None (one-click logout) |
| Export | None (one-click export) |

**Rule:** Only confirm destructive, irreversible actions.

---

### Notification Patterns

| Type | Placement | Behavior |
|------|-----------|----------|
| Transient (success, info) | Bottom-right toast | Auto-dismiss 3s |
| Persistent (error) | Bottom-right toast | Manual dismiss |
| Contextual (form errors) | Inline | Persistent until fixed |

**Rule:** Notifications are minimal and unobtrusive.

---

### AI Response Language

| Situation | Language Pattern |
|-----------|------------------|
| Found answer | "I found..." / "The policy states..." / "According to..." |
| Uncertain | "I'm not certain, but..." / "This might be..." |
| Not found | "I couldn't find information about that in this document." |
| Error | "I had trouble processing that. Could you try again?" |

**Rule:** Conversational, helpful, like a coworker. Never robotic or overly formal.

---
