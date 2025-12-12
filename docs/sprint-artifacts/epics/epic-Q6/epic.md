# Epic Q6: AI Infrastructure Foundation

**Status:** Contexted
**Phase:** 4 (AI-Powered Quoting)
**FRs Covered:** FR3 (partial), FR6 (partial)
**Stories:** 4
**Depends On:** Phase 3 completion (quote_sessions table)

---

## Overview

Epic Q6 establishes the foundational AI infrastructure required for Phase 4's AI-Powered Quoting feature. This epic creates the technical backbone that enables AI agents to automatically fill carrier portal forms - the core "magic" of Phase 4.

The infrastructure includes database schema for job tracking, integration with Skyvern AI agent service, Browserbase managed browser sessions, and a reliable pgmq-based job queue. All subsequent Phase 4 epics (Q7-Q13) depend on this foundation.

## Objectives

1. **Database Foundation** - Create tables for tracking quote jobs, per-carrier execution status, and recipe caching with proper RLS security
2. **AI Agent Integration** - Connect to Skyvern API for browser automation with progress callbacks and result extraction
3. **Browser Infrastructure** - Enable managed browser sessions via Browserbase with isolation and cleanup
4. **Job Orchestration** - Implement reliable job queue using Supabase pgmq for at-least-once delivery
5. **Type System** - Define TypeScript interfaces for consistent agent, job, and recipe handling

## Stories

| Story | Title | Description |
|-------|-------|-------------|
| Q6.1 | Database Schema for AI Quoting | Create quote_jobs, quote_job_carriers, and carrier_recipes tables with RLS policies and indexes |
| Q6.2 | Skyvern Agent Integration | Implement SkyvernAdapter class connecting to Skyvern API for browser automation tasks |
| Q6.3 | Browserbase Integration | Configure BrowserManager for managed browser session acquisition, isolation, and cleanup |
| Q6.4 | Job Queue with pgmq | Enable pgmq extension and implement JobQueueService for reliable job processing |

## Acceptance Summary

- Migration creates all 3 tables with correct columns, constraints, and indexes
- RLS policies enforce agency-scoped access for jobs, read-only for recipes
- SkyvernAdapter implements QuoteAgent interface with progress callbacks
- BrowserManager provides isolated sessions with <5s acquisition time
- pgmq queue supports priority ordering and at-least-once delivery
- All services include structured logging for observability

## Dependencies

### Prerequisites
| Dependency | Type | Status |
|------------|------|--------|
| Phase 3 Q1-Q4 | Internal | Complete - provides quote sessions and client data |
| Skyvern | External | Requires API key: SKYVERN_API_KEY |
| Browserbase | External | Requires API key: BROWSERBASE_API_KEY |
| pgmq | Extension | Enable in Supabase |

### Enables
- Epic Q7: Credential Management (uses job infrastructure)
- Epic Q8: Quote Execution Engine (uses all Q6 components)
- Epic Q9: Real-Time Progress (uses StatusManager)
- Epic Q10: Recipe Caching (uses carrier_recipes table)

## Related Documents

- [Tech Spec](./tech-spec.md) - Detailed technical specification
- [Phase 4 PRD](../../../features/quoting/phase-4-prd.md) - Product requirements
- [Phase 4 Architecture](../../../features/quoting/phase-4-architecture.md) - System architecture
- [Phase 4 Epics](../../../features/quoting/phase-4-epics.md) - Full epic breakdown
