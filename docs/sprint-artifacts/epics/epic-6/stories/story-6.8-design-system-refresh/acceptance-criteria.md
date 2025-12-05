# Acceptance Criteria

## AC-6.8.1: Brand Accent Color
**Given** the current slate-only palette
**When** viewing any page in docuMINE
**Then** a brand accent color is visible in:
- Primary buttons (submit, upload, send)
- Active/selected states
- Links and interactive elements
- Header/navigation accents

**Proposed Accent:** Choose ONE of:
- Electric Blue (#3b82f6 / blue-500) — trustworthy, professional
- Indigo (#6366f1 / indigo-500) — modern, sophisticated
- Violet (#8b5cf6 / violet-500) — creative, fresh

## AC-6.8.2: Updated Color Palette
**Given** the new accent color
**When** viewing the application
**Then** the color system includes:
- **Primary:** New accent color (replaces slate-600)
- **Primary Foreground:** White or appropriate contrast
- **Background:** Clean white (light) / dark neutral (dark)
- **Surface/Card:** Subtle off-white (#f9fafb) for depth
- **Text:** Improved hierarchy with better contrast

## AC-6.8.3: Spacing Improvements
**Given** existing spacing inconsistencies
**When** viewing document list, chat panel, and settings
**Then** spacing is consistent:
- Document list items: uniform padding (py-3 px-4)
- Chat messages: proper vertical rhythm (gap-4)
- Cards and sections: consistent inner padding (p-6)
- Sidebar: proper separation between sections

## AC-6.8.4: Button Styling Refresh
**Given** current button styles
**When** viewing buttons throughout the app
**Then** buttons appear modern:
- Primary buttons use accent color
- Hover states have subtle lift/shadow
- Ghost/outline variants have visible accent
- Consistent border-radius (8px)

## AC-6.8.5: Interactive States
**Given** hover and focus interactions
**When** interacting with elements
**Then** states are visually distinct:
- Hover: subtle background change + cursor pointer
- Focus: visible ring in accent color
- Active/pressed: slight darkening
- Selected: accent color border or background

## AC-6.8.6: Visual Hierarchy Enhancement
**Given** the document and chat views
**When** scanning the interface
**Then** hierarchy is clear:
- Primary actions stand out (accent color)
- Secondary actions are subdued but visible
- Disabled states clearly indicate non-interactivity
- Reading order is intuitive

---
