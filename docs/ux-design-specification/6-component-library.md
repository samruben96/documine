# 6. Component Library

## 6.1 Component Strategy

**Base:** shadcn/ui components (40+ accessible components)

**Standard Components (Use As-Is):**
- Button, Input, Textarea
- Dialog, Dropdown, Popover
- Table, Tabs, Toast
- Card, Avatar, Badge
- Tooltip, Skeleton

## 6.2 Custom Components Needed

### ChatMessage

**Purpose:** Display AI responses with trust elements

**Anatomy:**
```
┌─────────────────────────────────────────┐
│ [Avatar] Message text that streams in   │
│          word by word as response       │
│          is generated...                │
│                                         │
│ [✓ High Confidence]  View source →      │
└─────────────────────────────────────────┘
```

**States:**
- Streaming (text appearing)
- Complete (full response + citation)
- Error (failed to respond)

**Variants:**
- User message (right-aligned, primary color bubble)
- AI message (left-aligned, surface color, with citations)

---

### ConfidenceBadge

**Purpose:** Indicate AI confidence level

**Variants:**

| Variant | Appearance | Usage |
|---------|------------|-------|
| High Confidence | `✓` + green bg (#d1fae5) | Default, most responses |
| Needs Review | `⚠` + amber bg (#fef3c7) | Uncertain or conflicting info |
| Not Found | `○` + gray bg (#f1f5f9) | Information not in document |

**Behavior:**
- High Confidence: Subtle, doesn't demand attention
- Needs Review: Slightly more prominent, draws eye
- Not Found: Neutral, informational

---

### SourceCitation

**Purpose:** Link AI response to exact document location

**Anatomy:**
```
View in document → (clickable link)
```

**Behavior:**
- Click → Document viewer scrolls to location
- Passage highlighted with yellow background (#fef08a)
- Highlight fades after 3 seconds

---

### DocumentViewer

**Purpose:** Render PDF with interactive highlighting

**Features:**
- PDF rendering (pdf.js or similar)
- Page navigation
- Zoom controls (optional, minimal)
- Text selection
- Highlight support (yellow background for cited passages)
- Scroll-to-location API

**States:**
- Loading (skeleton)
- Ready (PDF visible)
- Highlighted (passage marked)
- Error (failed to load)

---

### ComparisonTable

**Purpose:** Side-by-side quote comparison with highlighting

**Anatomy:**
```
┌──────────┬───────────┬───────────┬───────────┐
│ Coverage │ Hartford  │ Travelers │ Liberty   │
├──────────┼───────────┼───────────┼───────────┤
│ Limit    │ $1M  ●    │ $1M       │ $500K  ○  │
│ Deduct   │ $5K       │ $2.5K  ●  │ $10K   ○  │
│ Premium  │ $4,200    │ $4,800 ○  │ $3,900 ●  │
└──────────┴───────────┴───────────┴───────────┘
● = Best in row (green)  ○ = Worst in row (red)
```

**Features:**
- Auto-highlights best/worst values
- Each cell has "View source" link
- Sortable columns
- Export to PDF

---

### UploadZone

**Purpose:** Drag-and-drop file upload

**States:**
- Default: Dashed border, "Drop a document here"
- Hover: Border color change, background highlight
- Uploading: Progress bar or percentage
- Processing: "Analyzing document..." with shimmer
- Complete: Transitions to document view
- Error: Red border, error message

---

### DocumentListItem

**Purpose:** Sidebar document entry

**Anatomy:**
```
┌────────────────────────────┐
│ 📄 Hartford_GL_Quote.pdf   │
│    Uploaded 2 hours ago    │
└────────────────────────────┘
```

**States:**
- Default
- Hover (background highlight)
- Selected (left border accent, darker background)
- Processing (shimmer/loading indicator)

---
