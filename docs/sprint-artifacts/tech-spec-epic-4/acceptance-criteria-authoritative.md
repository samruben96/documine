# Acceptance Criteria (Authoritative)

## Story 4.1: Document Upload Zone

1. **AC-4.1.1:** Upload zone displays dashed border with "Drop a document here or click to upload" text
2. **AC-4.1.2:** Drag hover state shows border color change (#475569) and background highlight
3. **AC-4.1.3:** Click on zone opens native file picker filtered to PDF files
4. **AC-4.1.4:** Drag-and-drop accepts PDF files and rejects other file types with toast: "Only PDF files are supported"
5. **AC-4.1.5:** Files over 50MB are rejected with toast: "File too large. Maximum size is 50MB"
6. **AC-4.1.6:** Multiple files (up to 5) can be uploaded simultaneously
7. **AC-4.1.7:** Uploaded file is stored at path `{agency_id}/{document_id}/{filename}` in Supabase Storage
8. **AC-4.1.8:** Document record created with status='processing' immediately after upload

## Story 4.2: Upload Progress & Status Feedback

9. **AC-4.2.1:** Upload progress bar shows 0-100% during file upload to storage
10. **AC-4.2.2:** Filename is displayed alongside progress bar
11. **AC-4.2.3:** "Cancel" option available during upload (removes from queue)
12. **AC-4.2.4:** Status changes to "Analyzing..." with shimmer animation when upload completes
13. **AC-4.2.5:** Status shows "Ready" with checkmark when processing completes
14. **AC-4.2.6:** Success toast appears: "{filename} is ready"
15. **AC-4.2.7:** Failed status shows error icon with "Retry" and "Delete" options
16. **AC-4.2.8:** Processing status persists across page navigation (realtime subscription)

## Story 4.3: Document List View

17. **AC-4.3.1:** Documents displayed in sidebar list with icon + filename + upload date
18. **AC-4.3.2:** Upload date shows relative format ("2 hours ago", "Yesterday", "Nov 20")
19. **AC-4.3.3:** Status indicator visible: Ready (✓), Processing (⟳), Failed (✗)
20. **AC-4.3.4:** List sorted by most recently uploaded first
21. **AC-4.3.5:** List is scrollable when documents exceed viewport
22. **AC-4.3.6:** Search input filters documents by filename match
23. **AC-4.3.7:** Clicking document opens split view (document + chat panel)
24. **AC-4.3.8:** Selected document shows left border accent and darker background
25. **AC-4.3.9:** Empty state shows centered upload zone with "Upload your first document to get started"
26. **AC-4.3.10:** Sidebar width is 240px on desktop, collapsible on tablet, hidden on mobile

## Story 4.4: Delete Documents

27. **AC-4.4.1:** Delete action available via trash icon or context menu
28. **AC-4.4.2:** Confirmation modal displays: "Delete {filename}?"
29. **AC-4.4.3:** Modal body text: "This will permanently delete the document and all conversations about it. This cannot be undone."
30. **AC-4.4.4:** "Cancel" and "Delete" buttons in modal (Delete is destructive red)
31. **AC-4.4.5:** On confirm: document record deleted (cascades to chunks, conversations)
32. **AC-4.4.6:** On confirm: file deleted from Supabase Storage
33. **AC-4.4.7:** Success toast: "Document deleted"
34. **AC-4.4.8:** If viewing deleted document, navigate to /documents

## Story 4.5: Document Organization (Rename/Label)

35. **AC-4.5.1:** Rename action available via edit icon or context menu
36. **AC-4.5.2:** Inline edit: filename becomes editable text field
37. **AC-4.5.3:** Enter to save, Escape to cancel rename
38. **AC-4.5.4:** Rename validation: 1-255 characters, no path separators
39. **AC-4.5.5:** "+ Add label" action available on document
40. **AC-4.5.6:** Label input with autocomplete from existing agency labels
41. **AC-4.5.7:** Labels displayed as small pills below filename
42. **AC-4.5.8:** Click X on label pill to remove label
43. **AC-4.5.9:** Maximum 10 labels per document
44. **AC-4.5.10:** Label dropdown in sidebar filters document list by selected label

## Story 4.6: Document Processing Pipeline (LlamaParse)

45. **AC-4.6.1:** PDF sent to LlamaParse API for extraction
46. **AC-4.6.2:** LlamaParse returns markdown with preserved tables and page numbers
47. **AC-4.6.3:** Text chunked at ~500 tokens with 50 token overlap
48. **AC-4.6.4:** Each chunk tagged with page_number and chunk_index
49. **AC-4.6.5:** Bounding box stored when available from LlamaParse
50. **AC-4.6.6:** Embeddings generated via OpenAI text-embedding-3-small (1536 dimensions)
51. **AC-4.6.7:** Chunks stored in document_chunks table with embeddings
52. **AC-4.6.8:** Document status updated to 'ready' on success
53. **AC-4.6.9:** Document page_count stored in metadata
54. **AC-4.6.10:** LlamaParse failure retried once, then marked 'failed' with error message
55. **AC-4.6.11:** Processing time logged for observability

## Story 4.7: Processing Queue Management

56. **AC-4.7.1:** Processing jobs processed in FIFO order per agency
57. **AC-4.7.2:** One active processing job per agency at a time
58. **AC-4.7.3:** Cross-agency jobs can run in parallel
59. **AC-4.7.4:** Queued documents show "Processing... (X documents ahead)"
60. **AC-4.7.5:** Stale jobs (>10 minutes without update) marked as failed
61. **AC-4.7.6:** Failed jobs can be retried manually via "Retry" button
62. **AC-4.7.7:** Rate limit: max 10 documents per agency per hour
63. **AC-4.7.8:** Rate limit exceeded shows toast: "Upload limit reached. Please try again later."

## Story 4.8: Migrate Document Processing to Docling

**Background:** Story 4.8 was added post-Epic 4 completion (2025-11-30) based on LlamaParse issues discovered during Epic 5 development. Research showed Docling provides 97.9% table accuracy vs 75% for LlamaParse, eliminates API costs, and provides self-hosted data control.

64. **AC-4.8.1:** Docling runs as a self-hosted Python microservice with REST API endpoint accepting PDF/DOCX/XLSX/image files
65. **AC-4.8.2:** Supports PDF, DOCX, XLSX, and image files (PNG, JPEG, TIFF) with markdown output
66. **AC-4.8.3:** Output includes page markers (`--- PAGE X ---`) compatible with existing chunking service
67. **AC-4.8.4:** Edge Function calls Docling service instead of LlamaParse with same retry logic (2 attempts)
68. **AC-4.8.5:** `src/lib/llamaparse/client.ts` replaced with `src/lib/docling/client.ts` maintaining same interface
69. **AC-4.8.6:** Complex tables with merged cells and borderless tables extracted correctly
70. **AC-4.8.7:** Docker Compose configuration for local development, production deployment documented
71. **AC-4.8.8:** Logging, error handling, and retry logic maintained from LlamaParse implementation
72. **AC-4.8.9:** Existing document_chunks table structure unchanged, no database migration required
73. **AC-4.8.10:** Unit tests for Docling client, integration test with sample PDF, build passes
