# Traceability Mapping

| AC | FR | Spec Section | Component(s)/API(s) | Test Idea |
|----|-----|--------------|---------------------|-----------|
| AC-5.1.1 | FR13 | Chat Layout | `split-view.tsx`, `/documents/[id]/page.tsx` | Measure panel widths at desktop viewport |
| AC-5.1.2 | FR13 | Chat Layout | `chat-panel.tsx` | Verify scroll on long conversations |
| AC-5.1.3 | FR13 | Chat Layout | `chat-input.tsx` | Check placeholder text renders |
| AC-5.1.4 | FR13 | Chat Layout | `chat-input.tsx` | Verify send button visible and clickable |
| AC-5.1.5 | FR13 | Chat Layout | `chat-input.tsx` | Press Enter, verify send; Shift+Enter verify newline |
| AC-5.1.6 | FR13 | Chat Layout | `chat-input.tsx` | Page load, verify input has focus |
| AC-5.1.7 | FR32 | Responsive | `split-view.tsx` | Test at 800px viewport width |
| AC-5.1.8 | FR32 | Responsive | `split-view.tsx` | Test at 500px viewport width |
| AC-5.1.9 | FR32 | Responsive | `split-view.tsx` | Verify tab indicator shows active tab |
| AC-5.1.10 | FR32 | Responsive | Global styles | Verify color values in computed styles |
| AC-5.2.1 | FR13 | Query Input | `chat-input.tsx` | Type various questions, verify accepted |
| AC-5.2.2 | FR13 | Query Input | `chat-input.tsx` | Type 4+ lines, verify expansion |
| AC-5.2.3 | FR13 | Query Input | `chat-input.tsx` | Type 950+ chars, verify counter appears |
| AC-5.2.4 | FR13 | Query Input | `chat-input.tsx` | Type 1001+ chars, verify error |
| AC-5.2.5 | FR13 | Query Input | `chat-panel.tsx` | New document, verify suggestions display |
| AC-5.2.6 | FR13 | Query Input | `chat-panel.tsx` | Click suggestion, verify input populated |
| AC-5.2.7 | FR13 | Query Input | `chat-message.tsx` | Send message, verify bubble styling |
| AC-5.2.8 | FR13 | Query Input | `chat-panel.tsx` | Send message, verify thinking indicator |
| AC-5.2.9 | FR13 | Query Input | `chat-input.tsx` | During stream, verify input disabled |
| AC-5.3.1 | FR14 | Streaming | `/api/chat`, `useChat.ts` | Time between tokens during stream |
| AC-5.3.2 | FR14 | Streaming | `chat-message.tsx` | Verify partial text visible during stream |
| AC-5.3.3 | FR16 | Trust Elements | `chat-message.tsx` | Verify badge appears after stream ends |
| AC-5.3.4 | FR16 | Trust Elements | `confidence-badge.tsx` | High confidence, verify exact colors |
| AC-5.3.5 | FR16 | Trust Elements | `confidence-badge.tsx` | Needs review, verify exact colors |
| AC-5.3.6 | FR16 | Trust Elements | `confidence-badge.tsx` | Not found, verify exact colors |
| AC-5.3.7 | FR16 | Trust Elements | `rag.ts` | Unit test confidence calculation |
| AC-5.3.8 | FR19 | Not Found | `chat-message.tsx` | Mock low-score response, verify message |
| AC-5.3.9 | FR34 | Error Handling | `useChat.ts` | Mock timeout, verify error UI + retry |
| AC-5.3.10 | FR34 | Error Handling | `useChat.ts` | Mock 429, verify error message |
| AC-5.3.11 | FR34 | Error Handling | `useChat.ts` | Mock 500, verify generic error + retry |
| AC-5.4.1 | FR15 | Citations | `source-citation.tsx` | Verify citation renders with page number |
| AC-5.4.2 | FR15 | Citations | `source-citation.tsx` | Check computed styles for subtle appearance |
| AC-5.4.3 | FR15 | Citations | `source-citation.tsx` | Response with 3 sources, verify format |
| AC-5.4.4 | FR15 | Citations | `source-citation.tsx` | Response with 5 sources, verify expandable |
| AC-5.4.5 | FR15 | Citations | `/api/chat` | Verify source data structure in response |
| AC-5.4.6 | FR15 | Citations | `chat_messages` table | Query DB, verify sources JSONB populated |
| AC-5.5.1 | FR17 | PDF Viewer | `document-viewer.tsx` | Select text in PDF, verify works |
| AC-5.5.2 | FR17 | PDF Viewer | `document-viewer.tsx` | Click next/prev, verify page changes |
| AC-5.5.3 | FR17 | PDF Viewer | `document-viewer.tsx` | Click zoom controls, verify scale changes |
| AC-5.5.4 | FR17 | PDF Viewer | `document-viewer.tsx` | Click citation, verify smooth scroll |
| AC-5.5.5 | FR17 | PDF Viewer | `document-viewer.tsx` | Verify highlight color is #fef08a |
| AC-5.5.6 | FR17 | PDF Viewer | `document-viewer.tsx` | Verify highlight has padding |
| AC-5.5.7 | FR17 | PDF Viewer | `document-viewer.tsx` | Wait 3s, verify highlight fades |
| AC-5.5.8 | FR17 | PDF Viewer | `document-viewer.tsx` | Click elsewhere, verify dismiss |
| AC-5.5.9 | FR17 | PDF Viewer | `document-viewer.tsx` | Citation without bbox, verify page flash |
| AC-5.5.10 | FR17, FR32 | PDF Viewer | `document-viewer.tsx` | Mobile: click citation, verify tab switch |
| AC-5.6.1 | FR18 | Conversation | `chat-panel.tsx` | Multiple messages, verify scroll |
| AC-5.6.2 | FR18 | Conversation | DB tables | Query conversations and chat_messages |
| AC-5.6.3 | FR18 | Conversation | `conversations` table | Verify document_id foreign key |
| AC-5.6.4 | FR18 | Conversation | `getConversation()` | Return to doc, verify history loads |
| AC-5.6.5 | FR18 | Conversation | `/api/chat`, RAG prompt | Ask "tell me more", verify context used |
| AC-5.6.6 | FR18 | Conversation | `rag.ts` | Verify prompt includes last 10 messages |
| AC-5.6.7 | FR18 | Conversation | `chat-panel.tsx` | Verify New Chat button visible |
| AC-5.6.8 | FR18 | Conversation | `chat-panel.tsx` | Click New Chat, verify confirmation modal |
| AC-5.6.9 | FR18 | Conversation | `clearConversation()` | Confirm, verify new conversation created |
| AC-5.6.10 | FR18 | Conversation | DB | After new chat, query old conversation exists |
| AC-5.7.1 | FR32 | Responsive | `split-view.tsx` | Test at 1200px viewport |
| AC-5.7.2 | FR32 | Responsive | `split-view.tsx` | Test at 800px viewport |
| AC-5.7.3 | FR32 | Responsive | `split-view.tsx` | Test at 500px viewport |
| AC-5.7.4 | FR32 | Responsive | `split-view.tsx` | Tap tabs, verify switch |
| AC-5.7.5 | FR32 | Responsive | All components | Measure touch targets |
| AC-5.7.6 | FR32 | Responsive | `chat-input.tsx` | Mobile viewport, verify fixed bottom |
| AC-5.7.7 | FR32 | Responsive | `chat-message.tsx` | Mobile viewport, verify trust elements |
| AC-5.7.8 | FR32 | Responsive | `useChat.ts` | Test streaming on mobile device |
| AC-5.7.9 | FR32 | Responsive | `document-viewer.tsx` | Mobile zoom, verify readable |
| AC-5.7.10 | FR32 | Responsive | Tooltips | Tap on mobile, verify tooltip shows |

## FR Coverage Summary

| FR | Description | Stories | ACs | Status |
|----|-------------|---------|-----|--------|
| FR13 | Natural language Q&A | 5.1, 5.2 | AC-5.1.1 to AC-5.2.9 | ✓ Covered |
| FR14 | Extract answers from documents | 5.3, 5.8 | AC-5.3.1, AC-5.3.2, AC-5.8.* | ✓ Covered |
| FR15 | Source citations on answers | 5.4 | AC-5.4.1 to AC-5.4.6 | ✓ Covered |
| FR16 | Confidence indicators | 5.3, 5.8 | AC-5.3.3 to AC-5.3.7, AC-5.8.* | ✓ Covered |
| FR17 | Click-to-view source in document | 5.5 | AC-5.5.1 to AC-5.5.10 | ✓ Covered |
| FR18 | Follow-up questions (conversation) | 5.6 | AC-5.6.1 to AC-5.6.10 | ✓ Covered |
| FR19 | Clear "not found" responses | 5.3 | AC-5.3.8 | ✓ Covered |
| FR32 | Responsive design | 5.1, 5.7 | AC-5.1.7 to AC-5.1.10, AC-5.7.* | ✓ Covered |
| FR34 | Clear error messages | 5.3 | AC-5.3.9 to AC-5.3.11 | ✓ Covered |

**Coverage: 9/9 FRs (100%)**

---
