# Risks, Assumptions, Open Questions

## Risks

| ID | Risk | Impact | Probability | Mitigation |
|----|------|--------|-------------|------------|
| R1 | ~~LlamaParse API rate limits or outages~~ (Mitigated by Docling migration) | ~~Processing blocked~~ | ~~Medium~~ | Self-hosted Docling eliminates external API dependency |
| R2 | Large PDFs exceed Edge Function 150s timeout | Failed processing for large docs | Medium | Warn users about large file processing time, split processing if needed |
| R3 | OpenAI API rate limits during batch embeddings | Partial processing failure | Low | Exponential backoff, smaller batch sizes, retry on 429 |
| R4 | Supabase Storage 50MB limit too restrictive | Users can't upload large policies | Low | Accept for MVP, can increase limit in Supabase dashboard |
| R5 | Vector index performance with many documents | Slow similarity search | Low | IVFFlat index handles 100K+ vectors, monitor and tune lists parameter |
| R6 | ~~LlamaParse table extraction quality varies~~ (Mitigated) | ~~Poor extraction~~ | ~~Medium~~ | Docling provides 97.9% table accuracy vs 75% LlamaParse |
| R9 | Docling service resource requirements | Higher infra costs | Low | Start CPU-only, add GPU only if needed for performance |
| R10 | Docling service deployment complexity | Setup challenges | Medium | Docker containerization simplifies environment, Railway/Fly.io options documented |
| R7 | Processing queue starvation for high-volume agencies | Long wait times | Low | Monitor queue depth, consider priority lanes post-MVP |
| R8 | PDF.js worker loading performance | Slow initial document render | Medium | Lazy load worker, show skeleton while loading |

## Assumptions

| ID | Assumption | Rationale |
|----|------------|-----------|
| A1 | All uploaded documents are PDFs | MVP scope - most insurance docs are PDF |
| A2 | 50MB file size limit is sufficient for insurance documents | Typical policies are 1-20MB |
| A3 | ~500 token chunks provide good RAG retrieval | Industry standard, can tune later |
| A4 | LlamaParse handles scanned PDFs via built-in OCR | LlamaParse advertises OCR support |
| A5 | 1-hour signed URL expiry is sufficient for viewing session | Users rarely view for >1 hour continuously |
| A6 | JSONB labels array is sufficient vs normalized table | Simpler for MVP, can normalize later |
| A7 | One processing job per agency is fair | Prevents single agency from monopolizing |
| A8 | 10 documents/hour rate limit is reasonable | Prevents abuse while allowing normal usage |
| A9 | text-embedding-3-small (1536 dim) is sufficient quality | Good balance of quality vs cost/speed |

## Open Questions

| ID | Question | Owner | Status | Decision |
|----|----------|-------|--------|----------|
| Q1 | Should we show document preview thumbnails in list? | Sam | Decided | No for MVP - adds complexity, use file icon |
| Q2 | Should labels have colors? | Sam | Decided | Default slate color for MVP, color picker later |
| Q3 | What happens to in-progress uploads on page close? | Sam | Decided | Lost - warn user before leaving page |
| Q4 | Should we support document versioning? | Sam | Decided | No for MVP - re-upload replaces |
| Q5 | How to handle password-protected PDFs? | Sam | Open | TBD - likely reject with error message |
| Q6 | Should we pre-extract on upload or lazy extract on first query? | Sam | Decided | Pre-extract on upload for consistent UX |
