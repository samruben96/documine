# Risks, Assumptions, Open Questions

## Risks

| ID | Risk | Impact | Probability | Mitigation |
|----|------|--------|-------------|------------|
| R1 | OpenAI API rate limits during high usage | Users get rate limit errors | Medium | Rate limiting on our side (20 msg/min), show clear error message, implement backoff |
| R2 | Vector search returns irrelevant chunks | Wrong answers despite high confidence | Medium | Tune chunk size/overlap in Epic 4, test with real insurance PDFs, adjust retrieval count |
| R3 | Confidence thresholds produce false positives | Users trust wrong answers | Medium | Test thresholds with diverse queries, consider user feedback mechanism post-MVP |
| R4 | PDF.js worker loading performance | Slow initial document render | Medium | Lazy load worker, skeleton loading state, consider CDN-hosted worker |
| R5 | Streaming connection dropped on mobile | Incomplete responses | Low | Detect disconnect, show partial response + retry option |
| R6 | OpenAI model changes affect response quality | Inconsistent user experience | Low | Pin to specific model version (gpt-4o-2024-05-13), test before upgrading |
| R7 | Large documents overwhelm context window | GPT-4o context limits exceeded | Low | Limit to top 5 chunks (~2500 tokens), summarize if needed |
| R8 | Bounding box data unavailable from Docling | Highlights can't show exact location | Medium | Fallback to page-level highlight with flash animation |
| R9 | Follow-up context makes prompts too large | Token limits, slow responses | Low | Limit to last 10 messages, summarize older context if needed |

## Assumptions

| ID | Assumption | Rationale |
|----|------------|-----------|
| A1 | Epic 4 document processing produces quality chunks | RAG quality depends on chunking quality |
| A2 | Confidence thresholds (0.85/0.60) work for insurance docs | Industry-standard RAG thresholds, may need tuning |
| A3 | Users understand confidence badges | UX spec validated this pattern, but needs user testing |
| A4 | 5 chunks provide sufficient context for answers | Balance between context and token cost |
| A5 | GPT-4o produces accurate insurance-related responses | Tested in prototyping, but not exhaustively |
| A6 | 10 messages of history is sufficient for follow-ups | Typical conversation length, can adjust |
| A7 | Users primarily use desktop for document analysis | Insurance agents typically work on desktop |
| A8 | 1000 character message limit is sufficient | Typical questions are much shorter |
| A9 | OpenAI API remains available and performant | 99.9% SLA historically |
| A10 | react-pdf handles all insurance PDF formats | Standard PDFs should work, scanned docs via Docling OCR |

## Open Questions

| ID | Question | Owner | Status | Decision |
|----|----------|-------|--------|----------|
| Q1 | Should we cache query embeddings for repeated questions? | Architect | Decided | No - freshness over speed, queries vary |
| Q2 | Should users be able to rate response quality? | PM | Deferred | Post-MVP feature, useful for threshold tuning |
| Q3 | How to handle multi-page answers (answer spans pages)? | Architect | Decided | Show first source, list additional sources |
| Q4 | Should conversation history be shareable between team members? | PM | Decided | No for MVP - conversations are per-user |
| Q5 | What if user asks about multiple documents at once? | PM | Decided | Out of scope - single document Q&A only |
| Q6 | Should we show retrieval scores to users? | UX | Decided | No - confidence badges are user-friendly abstraction |
| Q7 | How to handle very long PDF documents (100+ pages)? | Architect | Open | Test performance, may need pagination or lazy loading |
| Q8 | Should we pre-populate suggested questions based on document type? | PM | Deferred | Use generic suggestions for MVP, personalize later |
