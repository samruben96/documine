# 8. Responsive Design & Accessibility

## 8.1 Responsive Strategy

**Target Devices:**
- Primary: Desktop (1024px+) - where agents do most work
- Secondary: Tablet (640px - 1024px) - occasional use
- Tertiary: Mobile (< 640px) - quick lookups only

### Breakpoint Behavior

| Breakpoint | Layout | Navigation | Key Changes |
|------------|--------|------------|-------------|
| Desktop (1024px+) | Three-panel: Sidebar + Document + Chat | Sidebar always visible | Full split view |
| Tablet (640-1024px) | Two-panel: Document + Chat | Sidebar collapsible (hamburger) | Narrower panels |
| Mobile (< 640px) | Single panel with tabs | Bottom tab bar | Tab: Document / Chat |

### Desktop Layout (Primary)

```
┌──────────┬─────────────────┬──────────────┐
│ Sidebar  │   Document      │    Chat      │
│ (240px)  │   (flexible)    │   (360px)    │
└──────────┴─────────────────┴──────────────┘
```

### Tablet Layout

```
┌──────────────────┬──────────────┐
│    Document      │    Chat      │
│    (60%)         │    (40%)     │
└──────────────────┴──────────────┘
[≡] Hamburger → Sidebar overlay
```

### Mobile Layout

```
┌────────────────────────┐
│    [Document] [Chat]   │  ← Tab bar
├────────────────────────┤
│                        │
│   Active Tab Content   │
│                        │
└────────────────────────┘
```

### Responsive Adaptations

| Element | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Sidebar | Always visible | Collapsible overlay | Hidden (bottom nav) |
| Split view | Side-by-side | Side-by-side (narrower) | Tabbed |
| Chat input | Full width | Full width | Fixed bottom |
| Document viewer | Full height | Full height | Full screen |
| Comparison table | Full table | Horizontal scroll | Card view per quote |

---

## 8.2 Accessibility Strategy

**Target:** WCAG 2.1 Level AA

This level is the industry standard and covers most accessibility needs without being impractical.

### Color & Contrast

| Requirement | Implementation |
|-------------|----------------|
| Text contrast | Minimum 4.5:1 for body text, 3:1 for large text |
| UI contrast | Minimum 3:1 for interactive elements |
| Color independence | Never use color alone to convey information |
| Focus indicators | Visible 2px outline on all interactive elements |

**Trustworthy Slate palette passes AA contrast:**
- Text (#0f172a) on white: 15.5:1 ✓
- Primary (#475569) on white: 5.9:1 ✓
- Muted text (#64748b) on white: 4.6:1 ✓

### Keyboard Navigation

| Requirement | Implementation |
|-------------|----------------|
| All interactive elements | Focusable via Tab key |
| Focus order | Logical left-to-right, top-to-bottom |
| Skip links | "Skip to main content" link (hidden until focused) |
| Modal focus trap | Focus stays within modal when open |
| Escape key | Closes modals, dropdowns, popovers |

### Screen Reader Support

| Requirement | Implementation |
|-------------|----------------|
| Semantic HTML | Proper heading hierarchy (h1 → h2 → h3) |
| ARIA labels | All interactive elements have accessible names |
| Live regions | AI responses announced as they stream |
| Alt text | Meaningful descriptions for all images |
| Form labels | Properly associated with inputs |

### Specific Accessibility Considerations

| Feature | Accessibility Approach |
|---------|------------------------|
| Chat messages | `role="log"` + `aria-live="polite"` for new messages |
| Confidence badges | Text + icon (not icon alone) |
| Document highlights | Yellow bg + underline (color + style) |
| Loading states | `aria-busy="true"` + screen reader announcement |
| Source citations | Descriptive link text ("View in document, page 12") |

### Touch Targets

| Requirement | Implementation |
|-------------|----------------|
| Minimum size | 44x44px for all touch targets |
| Spacing | Minimum 8px between adjacent targets |
| Mobile buttons | Full-width on mobile for easy tapping |

### Testing Strategy

| Method | Tools |
|--------|-------|
| Automated | Lighthouse, axe DevTools, WAVE |
| Keyboard | Manual tab-through testing |
| Screen reader | VoiceOver (Mac), NVDA (Windows) |
| Color | Contrast checker, colorblind simulation |

---
