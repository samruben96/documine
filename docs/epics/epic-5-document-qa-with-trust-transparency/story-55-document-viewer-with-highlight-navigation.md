# Story 5.5: Document Viewer with Highlight Navigation

As a **user**,
I want **to click a source citation and see the relevant passage highlighted in the document**,
So that **I can quickly verify the answer**.

**Acceptance Criteria:**

**Given** an AI response has a source citation
**When** I click the citation link
**Then** the document viewer:
- Scrolls to the relevant page (smooth scroll)
- Highlights the cited passage with yellow background (#fef08a)
- Highlight includes slight padding around text

**And** the highlight behavior:
- Highlight appears immediately on scroll
- Fades after 3 seconds (or click elsewhere)
- Can click highlight to keep it visible

**And** if bounding box data is available:
- Highlight exact region in rendered PDF
- Draw semi-transparent overlay

**And** if only page number is available:
- Scroll to top of page
- Flash the page (subtle pulse animation)

**And** document viewer features:
- PDF rendering with text layer (for selection)
- Page navigation (previous/next, page number input)
- Zoom controls (fit width, zoom in/out)
- Current page indicator: "Page X of Y"

**Prerequisites:** Story 5.4

**Technical Notes:**
- Use react-pdf or pdf.js for PDF rendering
- PDF viewer component: `@/components/documents/document-viewer.tsx`
- Maintain viewer state: current page, zoom level
- Sync scroll position to page number
- Text layer enables text selection and search
- Highlight coordinates from document_chunks.bounding_box

---
