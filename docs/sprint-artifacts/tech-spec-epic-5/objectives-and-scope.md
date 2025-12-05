# Objectives and Scope

**In Scope:**
- Split-view layout with Document Viewer and Chat Panel side-by-side
- Natural language query input with suggested questions for empty conversations
- Streaming AI responses via Server-Sent Events (text appears word-by-word)
- Trust elements on every response: Confidence badges (High Confidence / Needs Review / Not Found) and Source citations
- Source citation links that scroll to and highlight the exact passage in the document
- PDF document viewer with text layer, page navigation, zoom controls, and highlight support
- Conversation history persisted per document in database
- Follow-up questions with context from previous messages (up to 10 messages)
- Responsive design: split view on desktop/tablet, tabbed interface on mobile
- RAG (Retrieval-Augmented Generation) pipeline using pgvector semantic search
- Keyboard shortcuts (Enter to send, Shift+Enter for newline)

**Out of Scope:**
- Quote comparison (Epic 6)
- Multi-document Q&A (asking across multiple documents simultaneously)
- Document editing or annotation
- Voice input
- Export conversation history
- AI-generated document summaries (post-MVP feature)
- Custom confidence thresholds per agency
- Conversation sharing between users
- Real-time collaborative chat
