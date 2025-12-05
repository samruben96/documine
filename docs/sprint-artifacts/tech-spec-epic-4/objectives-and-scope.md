# Objectives and Scope

**In Scope:**
- Document upload via drag-and-drop and file picker (PDF only, max 50MB)
- Upload progress indicators with real-time feedback
- Document processing pipeline using Docling for PDF→Markdown extraction (migrated from LlamaParse)
- Text chunking with semantic boundaries (~500 tokens, 50 token overlap)
- OpenAI embeddings generation (text-embedding-3-small, 1536 dimensions)
- Document list view with sidebar navigation (per UX spec)
- Document status tracking (processing, ready, failed)
- Document deletion with cascade cleanup
- Document rename and labeling for organization
- Processing queue management for fair multi-agency handling
- Multi-file upload (up to 5 simultaneous files)
- Real-time status updates via Supabase Realtime

**Out of Scope:**
- Document Q&A chat interface (Epic 5)
- Quote comparison (Epic 6)
- Non-PDF document types (Word, Excel, images) - PDF only for MVP
- OCR for scanned documents (LlamaParse handles this)
- Document versioning (single version per document)
- Folder hierarchies (flat structure with labels for MVP)
- Document sharing between agencies (strict isolation)
- Batch operations (bulk delete, bulk label) - single operations for MVP
