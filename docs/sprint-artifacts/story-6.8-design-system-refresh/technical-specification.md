# Technical Specification

## Files to Modify

**1. Global Theme (`src/app/globals.css`):**
```css
@theme inline {
  /* NEW: Electric Blue brand accent */
  --color-primary: oklch(0.59 0.20 255); /* blue-500 #3b82f6 */
  --color-primary-foreground: oklch(1 0 0);

  /* Improved surface colors */
  --color-background: oklch(1 0 0);
  --color-surface: oklch(0.98 0 0); /* subtle off-white */
  --color-muted: oklch(0.96 0.01 260); /* hint of accent */

  /* Better text hierarchy */
  --color-foreground: oklch(0.15 0.01 260);
  --color-muted-foreground: oklch(0.50 0.02 260);
}
```

**2. shadcn/ui Config (`components.json`):**
- Update `baseColor` from "neutral" to custom
- OR regenerate components with new theme

**3. Component Updates:**
- `src/components/ui/button.tsx` — Accent primary variant
- `src/components/documents/document-list-item.tsx` — Selection highlight
- `src/components/chat/chat-panel.tsx` — Message styling
- `src/components/layout/header.tsx` — Accent touches

**4. Spacing Audit Files:**
- `src/components/documents/document-list.tsx`
- `src/components/chat/chat-message.tsx`
- `src/app/(dashboard)/settings/page.tsx`
- `src/app/(dashboard)/documents/[id]/page.tsx`

## Implementation Approach

1. **Phase 1: Define New Palette**
   - Update CSS custom properties in globals.css
   - Test with existing components (no breakage)

2. **Phase 2: Update Key Components**
   - Primary buttons (most visible)
   - Selected/active states
   - Links and interactive elements

3. **Phase 3: Spacing Audit**
   - Document list items
   - Chat messages
   - Card padding
   - Section gaps

4. **Phase 4: Polish**
   - Microinteractions (transitions)
   - Hover states
   - Focus rings

---
