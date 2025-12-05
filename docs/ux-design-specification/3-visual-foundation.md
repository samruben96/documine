# 3. Visual Foundation

## 3.1 Color System

**Selected Theme:** Trustworthy Slate

**Personality:** Understated, serious, reliable. Feels like a trusted advisor, not a flashy app.

**Why This Theme:**
- Matches the "professional empowerment" emotional goal
- Doesn't scream "tech startup" - appeals to conservative, skeptical audience
- Slate tones convey reliability and seriousness
- Cyan accent provides subtle visual interest without being flashy
- Feels like enterprise software they can trust

**Primary Palette:**

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary | Slate | `#475569` | Buttons, links, key actions |
| Primary Hover | Dark Slate | `#334155` | Hover states |
| Primary Light | Light Slate | `#f1f5f9` | Backgrounds, highlights |
| Secondary | Cool Gray | `#94a3b8` | Secondary actions, borders |
| Accent | Cyan | `#0891b2` | Links, interactive elements |

**Semantic Colors:**

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Success | Emerald | `#059669` | High confidence, success states |
| Warning | Amber | `#d97706` | Needs review, caution states |
| Error | Red | `#dc2626` | Errors, destructive actions |

**Neutral Scale:**

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background | White | `#ffffff` | Page background |
| Surface | Off-white | `#f8fafc` | Cards, panels |
| Border | Light gray | `#e2e8f0` | Dividers, borders |
| Text | Near-black | `#0f172a` | Primary text |
| Text Muted | Gray | `#64748b` | Secondary text, captions |

## 3.2 Typography System

**Font Stack:** System fonts for maximum familiarity and performance

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
```

**Type Scale:**

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| H1 | 24px | 600 | Page titles |
| H2 | 20px | 600 | Section headers |
| H3 | 16px | 600 | Card titles |
| Body | 14px | 400 | Primary content |
| Small | 13px | 400 | Secondary content |
| Caption | 12px | 400 | Labels, badges |
| Tiny | 11px | 500 | Confidence badges |

**Line Heights:** 1.5 for body text, 1.3 for headings

## 3.3 Spacing System

**Base Unit:** 4px

**Scale:**

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight spacing, badge padding |
| sm | 8px | Icon gaps, small padding |
| md | 16px | Standard padding, margins |
| lg | 24px | Section spacing |
| xl | 32px | Large gaps |
| 2xl | 48px | Page sections |

## 3.4 Layout Grid

- **Container max-width:** 1280px
- **Columns:** 12-column grid
- **Gutter:** 24px
- **Responsive breakpoints:**
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

**Interactive Visualizations:**

- Color Theme Explorer: [ux-color-themes.html](./ux-color-themes.html)

---
