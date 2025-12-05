# Summary

**Epic Breakdown Complete!**

| Epic | Stories | FRs Covered | Status |
|------|---------|-------------|--------|
| Epic 1: Foundation & Infrastructure | 6 stories | FR31, FR33, FR34 | ✅ Done |
| Epic 2: User Authentication & Onboarding | 6 stories | FR1-4, FR27 | ✅ Done |
| Epic 3: Agency & Team Management | 6 stories | FR5-7, FR28-30 | ✅ Done |
| Epic 4: Document Upload & Management | 8 stories | FR8-12, FR27, FR33 | ✅ Done |
| Epic 5: Document Q&A with Trust Transparency | 14 stories | FR13-19, FR32, FR34 | ✅ Done |
| Epic 6: Epic 5 Cleanup & Stabilization + UI Polish | 8 stories | (Quality/Polish) | 🔄 Current |
| Epic 7: Quote Comparison | 6 stories | FR20-26 | ⏳ Backlog |
| **Total** | **54 stories** | **34 FRs (100%)** | |

**Future Epics (Prioritized Post-MVP Roadmap):**

| Priority | Epic | Stories | Reason |
|----------|------|---------|--------|
| F1 | Tech Debt & Optimizations | 6 stories | Address accumulated debt before adding features |
| F2 | User Dashboard & Document Intelligence | 5 stories | Document categorization + AI tagging |
| F3 | Document Viewer Enhancements | 3 stories | Requires PDF.js text layer work |
| F4 | Email Infrastructure | 4 stories | Resend requires custom domain |
| F5 | Billing Infrastructure | 5 stories | Manual tier assignment for MVP |
| F6 | Document Processing Reliability | 3 stories | ~1-2% PDF failures can wait |
| F7 | Mobile Optimization | 3 stories | Mobile not priority for MVP |
| F8 | Multi-Agent Workflows | TBD | Complex agentic pipelines using @openai/agents SDK |

**Epic F1: Tech Debt & Optimizations** (Updated 2025-12-03 via Party Mode)
- **F1.1: Test Coverage & Quality Gates** - Coverage gaps, integration tests, CI pipeline improvements
- **F1.2: Performance Optimization** - DB query optimization, API response caching, profiling
- **F1.3: Security & Dependency Updates** - Dependency updates, RLS policy audit, type safety review
- **F1.4: Error Handling & Observability** - Error boundaries, structured logging, basic monitoring/alerting
- **F1.5: Accessibility Audit** - WCAG 2.1 compliance, keyboard navigation, screen reader support
- **F1.6: AI Accuracy Review** - Response quality tuning, extraction accuracy, confidence thresholds

**Epic F2: User Dashboard & Document Intelligence** (Added 2025-12-03)
- Dashboard page showing all user documents
- Document categorization (general vs quote)
- AI-powered tagging and short blurbs
- Filter general docs from /compare quotes page
- Tag management UI

**Epic F8: Multi-Agent Workflows** (Added 2025-12-03)
- Evaluate [OpenAI Agents SDK](https://openai.github.io/openai-agents-js/) for complex workflows
- Multi-agent coordination with handoffs between specialized agents
- Guardrails for input validation and safety
- Built-in tracing and debugging for agent pipelines
- Potential use cases:
  - Quote extraction → comparison → reporting pipeline
  - Multi-document analysis with specialized agents per coverage type
  - Interactive quote negotiation workflows
- **Prerequisite:** Currently using `zodResponseFormat` for single-extraction (Story 7.2)

**Note:** Epic 5 significantly expanded during implementation:
- Stories 5.1-5.7: Core chat functionality (original scope)
- Stories 5.8-5.10: RAG optimization (added based on research 2025-12-01)
- Story 5.8.1: Large document processing reliability (bug fix 2025-12-02)
- Story 5.11: Streaming & AI personality fixes (bug fix 2025-12-01)
- Story 5.12: Processing progress visualization (enhancement 2025-12-02)
- Stories 5.13-5.14: Docling robustness and Realtime polish (completed 2025-12-02)

**Epic 5 Final Story Count:** 14 stories (all completed)

**Epic 6 Added (2025-12-02):** Based on Epic 5 Full Retrospective:
- Story 6.1: Fix Conversation Loading (406 Error) - DONE
- Story 6.2: Fix Confidence Score Calculation - DONE
- Story 6.3: Fix Source Citation Navigation - DONE
- Story 6.4: Fix Mobile Tab State Preservation - DEFERRED to Epic F4

**Epic 6 Expanded (2025-12-02):** Based on Party Mode UI exploration:
- Story 6.5: Remove Stale UI Text & Fix Page Title (P0, XS)
- Story 6.6: Connection Status & Realtime Indicator (P1, S)
- Story 6.7: Document List UX Polish (P1, M) - Combined 6.7, 6.8, 6.9
- Story 6.8: Design System Refresh (P1, M) - User feedback: "too grey"

**Epic 6 Final Story Count:** 7 stories (6.4 deferred to F4, 6.7-6.9 combined)

**UI Research:** `docs/research-ui-best-practices-2025-12-02.md`

**Context Incorporated:**
- ✅ PRD requirements - All 34 FRs mapped to stories
- ✅ UX Design patterns - Trustworthy Slate theme, split view layout, streaming responses, confidence badges
- ✅ Architecture decisions - Supabase stack, pgvector, Docling, streaming SSE, RLS policies

**Implementation Sequence:**
1. Epic 1 → Foundation (must be first) ✅
2. Epic 2 → Authentication (users can access) ✅
3. Epic 4 → Document Management (users can upload) ✅
4. Epic 5 → Document Q&A (core value - users can chat) ✅
5. Epic 3 → Agency Management (team features) ✅
6. Epic 6 → Cleanup & Stabilization (polish before next feature) 🔄
7. Epic 7 → Quote Comparison (second pillar) ⏳

**Current Phase: Epic 6 - Cleanup & Stabilization**

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._

_This document was generated through the BMad Method epic decomposition workflow._
