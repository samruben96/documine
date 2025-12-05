# 9. Implementation Guidance

## 9.1 What We Created

| Deliverable | Description |
|-------------|-------------|
| **Design System** | shadcn/ui with 6 custom components |
| **Visual Foundation** | Trustworthy Slate color theme, system typography, 4px spacing |
| **Design Direction** | Hybrid Split View + Sidebar (verification-focused) |
| **User Journeys** | 4 flows: Q&A, Comparison, First-time, Returning |
| **UX Patterns** | 10 consistency rules covering all interactions |
| **Responsive Strategy** | 3 breakpoints with specific adaptations |
| **Accessibility** | WCAG 2.1 AA compliance requirements |

## 9.2 Key Design Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Design System | shadcn/ui | Modern, accessible, AI-product friendly |
| Color Theme | Trustworthy Slate | Professional, serious, trusted advisor feel |
| Primary Layout | Split View + Sidebar | Trust through verification, familiar pattern |
| AI Response Style | Coworker conversation | Natural, not robotic, builds trust |
| Loading Pattern | Streaming text | Perceived speed, builds confidence |
| Confidence Display | Subtle badges | Trust without clutter |
| Navigation | Minimal sidebar | Documents + Compare, nothing else |
| Mobile Strategy | Tabbed interface | Practical for quick lookups |

## 9.3 Implementation Priority

**Phase 1: Core Experience**
1. Document upload + processing
2. Split view layout (document + chat)
3. Chat interface with streaming responses
4. Source citations with document highlighting
5. Confidence badges

**Phase 2: Compare & Polish**
1. Quote comparison table
2. Multi-document upload
3. Export functionality
4. Responsive adaptations

**Phase 3: Refinement**
1. Accessibility audit and fixes
2. Performance optimization
3. Edge case handling
4. User feedback integration

## 9.4 Developer Handoff Notes

**Tech Stack Alignment:**
- React/Next.js recommended
- Tailwind CSS for styling
- shadcn/ui for component base
- pdf.js for document rendering
- Streaming API for AI responses

**Critical Implementation Details:**

1. **Streaming Responses:** Use Server-Sent Events or WebSocket for character-by-character streaming. Response should feel instant even if full answer takes 3-5 seconds.

2. **Source Citations:** Store exact document positions (page, coordinates) with each AI response. Clicking citation should smooth-scroll and highlight.

3. **Document Highlighting:** Temporary highlight (yellow #fef08a) that fades after 3 seconds. Should work with PDF text layer.

4. **Confidence Scoring:** Backend should return confidence level with each response. Display logic:
   - 90%+ → High Confidence (green)
   - 70-89% → Needs Review (amber)
   - <70% or not found → Not Found (gray)

5. **Conversation Context:** Maintain conversation history per document. Switching documents should preserve each document's conversation.

## 9.5 Quality Checklist

Before shipping each feature, verify:

- [ ] Works without mouse (keyboard only)
- [ ] Screen reader announces correctly
- [ ] Loading states feel fast (skeleton, not spinner)
- [ ] Error states guide recovery
- [ ] Mobile layout is usable
- [ ] Source citations link correctly
- [ ] Confidence badges display appropriately
- [ ] AI language sounds conversational

## 9.6 Completion Summary

**UX Design Specification Complete!**

**What was created:**
- Comprehensive UX specification for docuMINE
- Two interactive HTML deliverables (color themes, design directions)
- Complete component library with custom components
- User journey flows with error handling
- Responsive and accessibility strategies

**Your Deliverables:**
- `docs/ux-design-specification.md` (this document)
- `docs/ux-color-themes.html` (interactive color explorer)
- `docs/ux-design-directions.html` (8 design direction mockups)

**Next Steps:**
1. Run validation with `*validate-design` (optional)
2. Proceed to Architecture workflow
3. Or generate additional artifacts (wireframes, prototypes)

---
