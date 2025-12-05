# Acceptance Criteria (Authoritative)

## Story 5.1: Chat Interface Layout (Split View)

1. **AC-5.1.1:** Document view page (`/documents/[id]`) displays split-view layout with Document Viewer on left (min 40% width) and Chat Panel on right (360px fixed width on desktop)
2. **AC-5.1.2:** Chat Panel contains scrollable conversation history area and fixed input area at bottom
3. **AC-5.1.3:** Input area displays placeholder text "Ask a question..."
4. **AC-5.1.4:** Send button (arrow icon) is visible next to input
5. **AC-5.1.5:** Pressing Enter sends message (Shift+Enter inserts newline)
6. **AC-5.1.6:** Input automatically receives focus when document page loads
7. **AC-5.1.7:** On tablet (640-1024px): both panels visible, chat panel 40% width, sidebar collapsed
8. **AC-5.1.8:** On mobile (<640px): tabbed interface with [Document] and [Chat] tabs
9. **AC-5.1.9:** Mobile tabs show current view indicator
10. **AC-5.1.10:** Layout uses Trustworthy Slate color theme (#475569 primary, system font stack)

## Story 5.2: Natural Language Query Input

11. **AC-5.2.1:** Input field accepts free-form natural language text
12. **AC-5.2.2:** Input expands to accommodate multi-line questions (up to 4 visible lines)
13. **AC-5.2.3:** Character count displays when approaching 1000 character limit
14. **AC-5.2.4:** Messages over 1000 characters are rejected with inline error
15. **AC-5.2.5:** Empty conversations show 3 suggested questions: "What's the coverage limit?", "Are there any exclusions?", "What's the deductible?"
16. **AC-5.2.6:** Clicking a suggested question fills the input field
17. **AC-5.2.7:** After sending: input clears, user message appears (right-aligned, primary color bubble)
18. **AC-5.2.8:** "Thinking..." indicator with animated dots appears while waiting for response
19. **AC-5.2.9:** Input is disabled while response is streaming

## Story 5.3: AI Response with Streaming & Trust Elements

20. **AC-5.3.1:** Response text streams in word-by-word (approximately 50-100ms between words)
21. **AC-5.3.2:** User can read text as it appears (not waiting for complete response)
22. **AC-5.3.3:** After streaming completes, confidence badge appears below response
23. **AC-5.3.4:** High Confidence badge: green background (#d1fae5), checkmark icon (✓), text "High Confidence"
24. **AC-5.3.5:** Needs Review badge: amber background (#fef3c7), warning icon (⚠), text "Needs Review"
25. **AC-5.3.6:** Not Found badge: gray background (#f1f5f9), circle icon (○), text "Not Found"
26. **AC-5.3.7:** Confidence thresholds: ≥0.85 similarity = High, 0.60-0.84 = Needs Review, <0.60 = Not Found
27. **AC-5.3.8:** "Not Found" responses include message: "I couldn't find information about that in this document."
28. **AC-5.3.9:** API timeout (>30s) shows: "I'm having trouble processing that. Please try again." with Retry button
29. **AC-5.3.10:** Rate limit error shows: "Too many requests. Please wait a moment."
30. **AC-5.3.11:** Generic errors show: "Something went wrong. Please try again." with Retry button

## Story 5.4: Source Citation Display

31. **AC-5.4.1:** Source citation link appears after confidence badge: "View in document →" or "Page X →"
32. **AC-5.4.2:** Citation link styled subtly (small text, muted color, underline on hover)
33. **AC-5.4.3:** Multiple sources show as: "Sources: Page 3, Page 7, Page 12" (each page is a link)
34. **AC-5.4.4:** If more than 3 sources, show expandable "View X sources"
35. **AC-5.4.5:** Source data includes: documentId, pageNumber, text excerpt, chunkId, similarityScore
36. **AC-5.4.6:** Source citations are saved with assistant message in database (sources JSONB column)

## Story 5.5: Document Viewer with Highlight Navigation

37. **AC-5.5.1:** PDF renders with text layer enabled (text is selectable)
38. **AC-5.5.2:** Page navigation controls: previous/next buttons, page number input, "Page X of Y" display
39. **AC-5.5.3:** Zoom controls: fit-to-width button, zoom in (+), zoom out (-)
40. **AC-5.5.4:** Clicking source citation scrolls document viewer to target page (smooth scroll)
41. **AC-5.5.5:** Source passage highlighted with yellow background (#fef08a)
42. **AC-5.5.6:** Highlight includes slight padding around text
43. **AC-5.5.7:** Highlight fades out after 3 seconds (gradual fade animation)
44. **AC-5.5.8:** User can click elsewhere to dismiss highlight early
45. **AC-5.5.9:** If only page number available (no bounding box): page border flashes with subtle pulse
46. **AC-5.5.10:** On mobile: clicking citation switches to Document tab, then scrolls to source

## Story 5.6: Conversation History & Follow-up Questions

47. **AC-5.6.1:** Conversation history visible in scrollable chat panel
48. **AC-5.6.2:** Conversations persisted to database (conversations + chat_messages tables)
49. **AC-5.6.3:** Each document has its own conversation (conversation.document_id)
50. **AC-5.6.4:** Returning to document shows previous conversation
51. **AC-5.6.5:** Follow-up questions understand context: "Tell me more", "What about that?" work correctly
52. **AC-5.6.6:** Last 10 messages included in RAG prompt for context
53. **AC-5.6.7:** "New Chat" button visible in chat panel header
54. **AC-5.6.8:** Clicking "New Chat" shows confirmation: "Start a new conversation?"
55. **AC-5.6.9:** Confirming "New Chat" creates new conversation record, clears chat panel
56. **AC-5.6.10:** Old conversations remain in database (not deleted, just new one created)

## Story 5.7: Responsive Chat Experience

57. **AC-5.7.1:** Desktop (>1024px): Split view with 360px chat panel
58. **AC-5.7.2:** Tablet (640-1024px): Split view with narrower panels, sidebar hamburger menu
59. **AC-5.7.3:** Mobile (<640px): Tabbed [Document] | [Chat] interface
60. **AC-5.7.4:** Mobile tabs can be switched by tapping
61. **AC-5.7.5:** All touch targets minimum 44x44px
62. **AC-5.7.6:** Mobile chat input fixed at bottom of screen
63. **AC-5.7.7:** Trust elements (confidence badges, citations) display on all screen sizes
64. **AC-5.7.8:** Streaming response feels identical across devices
65. **AC-5.7.9:** Document remains readable at mobile zoom levels
66. **AC-5.7.10:** Tooltips show on tap (not hover) for touch devices
