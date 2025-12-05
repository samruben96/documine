# 4. Design Direction

## 4.1 Chosen Design Approach

**Primary Direction:** Hybrid of #3 (Split View) + #1 (Sidebar Chat)

**Core Layout Philosophy:**
The interface is built around two things: the document and the conversation. Nothing else competes for attention.

**Layout Structure:**

```
┌─────────────────────────────────────────────────────────────┐
│  Logo                              [Compare]  [User Menu]   │
├──────────────┬──────────────────────┬───────────────────────┤
│              │                      │                       │
│  SIDEBAR     │   DOCUMENT VIEWER    │     CHAT PANEL        │
│              │                      │                       │
│  Recent      │   • PDF rendered     │   • Conversation      │
│  Documents   │   • Highlighted      │   • Source citations  │
│              │     passages         │   • Confidence badges │
│  • Doc 1     │   • Page navigation  │                       │
│  • Doc 2     │                      │   ┌─────────────────┐ │
│  • Doc 3     │                      │   │ Ask question... │ │
│              │                      │   └─────────────────┘ │
│  [+ Upload]  │                      │                       │
└──────────────┴──────────────────────┴───────────────────────┘
```

**Why This Approach:**

1. **Split View (#3)** - Document and chat side-by-side
   - Users can verify answers instantly by seeing the source
   - Builds trust through transparency
   - Highlighted passages link directly to AI responses
   - "Show me the proof" is one click away

2. **Sidebar Navigation (#1)** - Document list always accessible
   - Familiar ChatGPT-style pattern
   - Easy document switching without losing context
   - Recent documents visible at a glance
   - Upload always accessible

3. **Minimal Empty State (#8 influence)** - When no document selected
   - Simple upload zone
   - "Drop a document or select from recent"
   - Zero friction to get started

**Screen States:**

| State | Layout |
|-------|--------|
| No documents | Centered upload zone (minimal) |
| Document selected | Split view: Document + Chat |
| Compare mode | Full-width comparison table |
| Mobile | Tabbed: Document / Chat (swipe) |

**What We're NOT Doing:**
- No dashboard with widgets
- No analytics or metrics views
- No complex navigation hierarchies
- No feature tours or onboarding flows

**Interactive Mockups:**

- Design Direction Showcase: [ux-design-directions.html](./ux-design-directions.html)

---
