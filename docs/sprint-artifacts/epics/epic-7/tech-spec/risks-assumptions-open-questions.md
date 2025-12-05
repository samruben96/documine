# Risks, Assumptions, Open Questions

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Extraction accuracy varies by carrier format** | High | Medium | Test with diverse quote samples; allow manual override post-MVP |
| **GPT-4o cost exceeds budget** | Medium | High | Extraction caching, rate limiting, cost monitoring alerts |
| **Large documents exceed context window** | Low | Medium | Truncate to first 100K tokens; summarization fallback |
| **PDF export rendering issues** | Medium | Low | Use well-tested @react-pdf/renderer; test across browsers |
| **Exclusion categorization errors** | Medium | Medium | Conservative "other" category; refinement in post-MVP |

## Assumptions

1. **Document Quality** - Uploaded quotes are readable PDFs with text layer (not scanned images)
2. **Coverage Standardization** - Insurance terminology follows industry conventions (per ISO forms)
3. **Single Policy per Document** - Each quote document contains one policy proposal
4. **English Language** - All documents are in English (i18n out of scope for MVP)
5. **Agency Data Isolation** - RLS policies from Epic 1 continue to function correctly

## Open Questions

| Question | Decision Needed By | Default If Unresolved |
|----------|--------------------|-----------------------|
| Should extraction run at upload time or on-demand? | Story 7.2 start | On-demand (simpler) |
| Maximum documents per comparison: 4 or 6? | Story 7.1 start | 4 (per PRD) |
| Export format: PDF only or also XLSX? | Story 7.6 start | PDF + CSV (XLSX post-MVP) |
| Cache invalidation strategy when document re-processed? | Story 7.2 | extraction_version increment |
| ~~Should comparison history be saved?~~ | ~~Epic 7 complete~~ | ~~Save for 30 days~~ | **RESOLVED: Story 7.7 added** |

## Resolved Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Extraction model | GPT-5.1 | 400K context, CFG support, best structured output; fallback to Claude via OpenRouter (ADR-007) |
| PDF library | @react-pdf/renderer | Well-maintained, React-native compatible |
| Gap severity algorithm | Coverage type-based | GL/Property = high, others = medium |
| Best/worst highlighting | Green ●, Red ○ | Consistent with UX spec color semantics |
