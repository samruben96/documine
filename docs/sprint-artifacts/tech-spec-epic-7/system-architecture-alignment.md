# System Architecture Alignment

## Components Referenced

| Component | Usage | Source |
|-----------|-------|--------|
| Document Processing | Docling-parsed content as extraction context | Epic 4, ADR-002 |
| Vector Search | Retrieve relevant chunks for extraction prompts | Epic 5, Architecture RAG Pipeline |
| GPT-5.1 Function Calling | Structured data extraction with CFG constraints (400K context) | New for Epic 7, ADR-007 |
| Claude Sonnet 4.5 via OpenRouter | Alternative extraction model if needed | ADR-005 |
| PDF Viewer | Source citation navigation | Epic 5, Story 5.5 |
| Supabase Storage | Quote document storage | Epic 1, Story 1.4 |
| RLS Policies | Agency-scoped comparison data | Epic 1, Story 1.2 |

## Architectural Constraints

1. **Agency Isolation** - Comparisons are agency-scoped; users can only compare documents within their agency
2. **Document Readiness** - Only documents with status='ready' can be selected for comparison
3. **Extraction Caching** - Extracted data cached to avoid re-extraction on same document
4. **Trust Transparency** - Every extracted value must store source reference (page number, text excerpt)
5. **Response Time** - Extraction should complete within 60 seconds per document (NFR4)
