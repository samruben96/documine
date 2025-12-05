# Overview

Epic 4 delivers the complete document upload and management system for docuMINE - the foundational capability that enables all AI-powered document analysis features. This epic enables users to upload insurance PDFs (policies, quotes, certificates), view their document library, organize files with naming and labels, and ensures documents are properly processed and indexed for natural language querying.

Building on the authentication and agency infrastructure from Epics 1-3, this epic implements the document storage layer using Supabase Storage with agency-scoped RLS policies, the document processing pipeline using Docling for document extraction (migrated from LlamaParse in Story 4.8) and OpenAI for embeddings, and the document management UI following the UX specification's "Invisible Technology" design philosophy.

This is a critical path epic - without document upload and processing, the core value proposition (Document Q&A in Epic 5 and Quote Comparison in Epic 6) cannot function.
