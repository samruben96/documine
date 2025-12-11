# UI/UX Issues

## Settings Page Whitespace Bug (AI Disclosure Editor, 2025-12-09)

**Issue:** Large whitespace appeared at the bottom of the Settings page when viewing AI Buddy Admin tab, causing the page to be almost twice as tall as needed.

**Root Cause:** The `sr-only` (screen reader only) class on a Label component uses `position: absolute`, but the parent container lacked `position: relative`. This caused the label to be positioned relative to a distant ancestor, extending the HTML element's scroll height to ~1730px instead of ~734px.

**Problematic Element:**
```tsx
// In src/components/ai-buddy/admin/ai-disclosure-editor.tsx
<div className="space-y-2">  {/* Missing position: relative */}
  <Label htmlFor="ai-disclosure-message" className="sr-only">
    AI Disclosure Message
  </Label>
```

**Resolution:** Added `relative` class to the parent container:
```tsx
<div className="space-y-2 relative">
  <Label htmlFor="ai-disclosure-message" className="sr-only">
```

**Files Changed:**
- `src/components/ai-buddy/admin/ai-disclosure-editor.tsx` - Added `relative` class to sr-only label's parent

**Key Learning:** When using `sr-only` (or any `position: absolute` element), ensure a positioned ancestor exists to contain it. Otherwise, the absolutely positioned element can extend the page layout unexpectedly.
