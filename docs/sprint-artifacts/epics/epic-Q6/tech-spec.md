# Epic Technical Specification: AI Infrastructure Foundation

Date: 2025-12-12
Author: Sam
Epic ID: Q6
Status: Draft

---

## Overview

Epic Q6 establishes the foundational AI infrastructure required for Phase 4's AI-Powered Quoting feature. This epic creates the database schema for job tracking, integrates with Skyvern AI agent service for browser automation, sets up Browserbase for managed browser sessions, and implements a reliable job queue using Supabase's pgmq extension.

This infrastructure enables the "Get Quotes" button to trigger AI agents that automatically fill carrier portal forms, transforming the manual process of portal hopping into a single-click automation experience. Q6 is the technical foundation upon which all subsequent Phase 4 epics depend.

## Objectives and Scope

### In Scope

- **Database Schema:** Create tables for `quote_jobs`, `quote_job_carriers`, and `carrier_recipes` with proper RLS policies and indexes
- **Skyvern Integration:** Implement adapter connecting to Skyvern AI agent API for browser automation tasks
- **Browserbase Integration:** Configure managed browser session acquisition, isolation, and cleanup
- **Job Queue (pgmq):** Enable pgmq extension and implement reliable job queue for quote execution orchestration
- **Core Types:** Define TypeScript interfaces for agents, jobs, recipes, and execution parameters

### Out of Scope

- Credential management (Epic Q7)
- Quote execution UI and triggers (Epic Q8)
- Real-time progress display (Epic Q9)
- Recipe caching logic (Epic Q10)
- Error handling and CAPTCHA solving (Epic Q11)
- Carrier registry and management (Epic Q12)

## System Architecture Alignment

This epic aligns with the Phase 4 Architecture document's "System Architecture" section:

**Database Layer:** Extends existing Supabase PostgreSQL with new tables following established RLS patterns from Phase 3 (`quote_sessions`, `quote_results`). Uses JSONB for flexible schema evolution in job results and recipe storage.

**AI Agent Layer:** Implements the Agent Factory pattern described in architecture, with Skyvern as primary agent. The `QuoteAgent` interface standardizes agent interactions regardless of implementation.

**Browser Infrastructure:** Browserbase provides managed browser sessions with session isolation per user, aligning with security architecture requirements for no cross-contamination.

**Job Orchestration:** pgmq provides at-least-once delivery semantics and priority queuing, integrating with Supabase's existing infrastructure rather than introducing external dependencies.

**Key Architecture Components Created:**
- `src/lib/quoting/orchestrator/` - Job queue and status management
- `src/lib/quoting/agent/` - Skyvern adapter and browser manager
- `src/types/quoting/` - TypeScript type definitions

## Detailed Design

### Services and Modules

| Module | Location | Responsibility | Dependencies |
|--------|----------|----------------|--------------|
| **Job Queue Service** | `src/lib/quoting/orchestrator/job-queue.ts` | Enqueue/dequeue quote jobs via pgmq, handle retries and dead letter queue | Supabase pgmq extension |
| **Status Manager** | `src/lib/quoting/orchestrator/status-manager.ts` | Update job/carrier status, trigger Realtime broadcasts | Supabase client |
| **Skyvern Adapter** | `src/lib/quoting/agent/skyvern-adapter.ts` | Connect to Skyvern API, execute automation tasks, map responses | Skyvern SDK, Browser Manager |
| **Browser Manager** | `src/lib/quoting/agent/browser-manager.ts` | Acquire/release Browserbase sessions, handle session pooling and cleanup | Browserbase API |
| **Agent Factory** | `src/lib/quoting/agent/index.ts` | Create appropriate agent (recipe replay vs AI) based on context | Recipe Service, Skyvern Adapter |
| **Type Definitions** | `src/types/quoting/` | TypeScript interfaces for jobs, agents, recipes, execution | None |

### Data Models and Contracts

#### Quote Jobs Table

```sql
create table quote_jobs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references quote_sessions(id) on delete cascade,
  agency_id uuid not null references agencies(id),

  -- Job configuration
  carriers jsonb not null default '[]',  -- Array of carrier codes
  priority int default 5,                 -- 1 (highest) to 10 (lowest)

  -- Job status
  status text not null default 'pending',
  -- Values: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'partial'

  -- Progress tracking
  carriers_completed int default 0,
  carriers_total int default 0,

  -- Results
  results jsonb not null default '{}',
  errors jsonb not null default '[]',

  -- Timestamps
  queued_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_quote_jobs_session on quote_jobs(session_id);
create index idx_quote_jobs_status on quote_jobs(status);
create index idx_quote_jobs_agency on quote_jobs(agency_id);
```

#### Quote Job Carriers Table

```sql
create table quote_job_carriers (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references quote_jobs(id) on delete cascade,
  carrier_code text not null,

  -- Execution status
  status text not null default 'pending',
  -- Values: 'pending' | 'running' | 'captcha_needed' | 'completed' | 'failed'

  -- Progress details
  current_step text,
  progress_pct int default 0,
  screenshot_url text,

  -- Results
  result jsonb,
  error_message text,

  -- Recipe tracking
  recipe_id uuid references carrier_recipes(id),
  used_recipe boolean default false,

  -- Timestamps
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_quote_job_carriers_job on quote_job_carriers(job_id);
create index idx_quote_job_carriers_status on quote_job_carriers(status);
```

#### Carrier Recipes Table

```sql
create table carrier_recipes (
  id uuid primary key default gen_random_uuid(),
  carrier_code text not null,
  quote_type text not null,  -- 'home' | 'auto' | 'bundle'

  -- Recipe data
  recipe_version int not null default 1,
  steps jsonb not null,           -- Array of action steps
  field_mappings jsonb not null,  -- Client data → form field mappings

  -- Metadata
  success_count int default 0,
  failure_count int default 0,
  last_success_at timestamptz,
  last_failure_at timestamptz,

  -- Status
  status text not null default 'active',
  -- Values: 'active' | 'needs_validation' | 'deprecated'

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(carrier_code, quote_type)
);

-- Index
create index idx_carrier_recipes_lookup on carrier_recipes(carrier_code, quote_type, status);
```

#### RLS Policies

```sql
-- Enable RLS
alter table quote_jobs enable row level security;
alter table quote_job_carriers enable row level security;
alter table carrier_recipes enable row level security;

-- Quote jobs scoped to agency
create policy "Quote jobs scoped to agency" on quote_jobs
  for all using (agency_id = (select agency_id from users where id = auth.uid()));

-- Job carriers via parent job
create policy "Job carriers via job" on quote_job_carriers
  for all using (job_id in (
    select id from quote_jobs where agency_id = (
      select agency_id from users where id = auth.uid()
    )
  ));

-- Recipes readable by all authenticated users (shared resource)
create policy "Recipes readable by authenticated" on carrier_recipes
  for select using (auth.role() = 'authenticated');

-- Recipes writable by service role only (system managed)
create policy "Recipes writable by service" on carrier_recipes
  for insert using (auth.role() = 'service_role');
create policy "Recipes updatable by service" on carrier_recipes
  for update using (auth.role() = 'service_role');
```

#### TypeScript Interfaces

```typescript
// src/types/quoting/agent.ts
export interface QuoteAgent {
  executeQuote(params: QuoteExecutionParams): Promise<QuoteResult>;
  cancel(): Promise<void>;
}

export interface QuoteExecutionParams {
  sessionId: string;
  carrierCode: string;
  clientData: QuoteClientData;
  credentials: DecryptedCredentials;
  recipe?: CarrierRecipe;
  onProgress: (status: CarrierStatus) => void;
  onCaptchaNeeded: (captcha: CaptchaChallenge) => Promise<string>;
}

export interface QuoteResult {
  success: boolean;
  data?: QuoteResultData;
  error?: QuoteError;
  screenshots?: string[];
}

// src/types/quoting/execution.ts
export interface QuoteJob {
  id: string;
  sessionId: string;
  agencyId: string;
  carriers: string[];
  priority: number;
  status: JobStatus;
  carriersCompleted: number;
  carriersTotal: number;
  results: Record<string, QuoteResultData>;
  errors: QuoteError[];
  queuedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export type JobStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'partial';

export interface CarrierJobStatus {
  carrierCode: string;
  status: CarrierStatus;
  currentStep?: string;
  progressPct: number;
  screenshotUrl?: string;
  result?: QuoteResultData;
  errorMessage?: string;
}

export type CarrierStatus = 'pending' | 'running' | 'captcha_needed' | 'completed' | 'failed';

// src/types/quoting/recipe.ts
export interface CarrierRecipe {
  id: string;
  carrierCode: string;
  quoteType: 'home' | 'auto' | 'bundle';
  recipeVersion: number;
  steps: RecipeStep[];
  fieldMappings: FieldMapping[];
  status: RecipeStatus;
  successCount: number;
  failureCount: number;
}

export interface RecipeStep {
  action: 'click' | 'type' | 'select' | 'wait' | 'screenshot';
  selector: string;
  value?: string;
  fieldPath?: string;  // Path in client data to get value
  waitMs?: number;
}

export interface FieldMapping {
  clientDataPath: string;  // e.g., 'clientInfo.firstName'
  formSelector: string;    // CSS selector for form field
  transform?: 'uppercase' | 'lowercase' | 'date' | 'phone' | 'ssn';
}

export type RecipeStatus = 'active' | 'needs_validation' | 'deprecated';
```

### APIs and Interfaces

#### Internal Service APIs

**Job Queue Service**

```typescript
// src/lib/quoting/orchestrator/job-queue.ts
export class JobQueueService {
  // Enqueue a new quote job
  async enqueue(job: CreateJobParams): Promise<string>;

  // Dequeue next job for processing
  async dequeue(): Promise<QueuedJob | null>;

  // Mark job as complete/failed
  async complete(jobId: string, result: JobResult): Promise<void>;
  async fail(jobId: string, error: QuoteError): Promise<void>;

  // Get queue depth metrics
  async getQueueDepth(): Promise<number>;
}
```

**Browser Manager**

```typescript
// src/lib/quoting/agent/browser-manager.ts
export class BrowserManager {
  // Acquire a new browser session
  async getSession(options?: SessionOptions): Promise<BrowserSession>;

  // Release session back to pool
  async releaseSession(session: BrowserSession): Promise<void>;

  // Force close and cleanup session
  async destroySession(session: BrowserSession): Promise<void>;

  // Check session health
  async isSessionHealthy(session: BrowserSession): Promise<boolean>;
}

export interface BrowserSession {
  id: string;
  wsEndpoint: string;
  createdAt: Date;
  expiresAt: Date;
}
```

**Skyvern Adapter**

```typescript
// src/lib/quoting/agent/skyvern-adapter.ts
export class SkyvernAdapter implements QuoteAgent {
  constructor(private browserManager: BrowserManager);

  async executeQuote(params: QuoteExecutionParams): Promise<QuoteResult>;
  async cancel(): Promise<void>;

  // Internal methods
  private mapClientDataToPrompt(data: QuoteClientData): string;
  private extractQuoteResult(response: SkyvernResponse): QuoteResultData;
}
```

#### Environment Variables (New)

```bash
# Skyvern Configuration
SKYVERN_API_KEY=sk_...
SKYVERN_URL=https://api.skyvern.com

# Browserbase Configuration
BROWSERBASE_API_KEY=bb_...
BROWSERBASE_PROJECT_ID=proj_...

# pgmq Configuration (uses existing Supabase connection)
# No additional env vars needed - uses SUPABASE_SERVICE_ROLE_KEY
```

### Workflows and Sequencing

#### Job Creation Flow

```
User Triggers "Get Quotes"
         │
         ▼
┌─────────────────────────┐
│ 1. Create quote_jobs    │
│    record with carriers │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 2. For each carrier:    │
│    - Create job_carrier │
│    - Enqueue to pgmq    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 3. Return job_id        │
│    to frontend          │
└─────────────────────────┘
```

#### Job Processing Flow

```
Queue Processor (Background)
         │
         ▼
┌─────────────────────────┐
│ 1. Dequeue job from     │
│    pgmq                 │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 2. Acquire browser      │
│    session              │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 3. Create agent         │
│    (Skyvern)            │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 4. Execute quote:       │
│    - Login to portal    │
│    - Fill forms         │
│    - Extract results    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 5. Update status via    │
│    StatusManager        │
│    (triggers Realtime)  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 6. Release browser      │
│    session              │
└─────────────────────────┘
```

#### Status Update Flow

```
Agent Progress Callback
         │
         ▼
┌─────────────────────────┐
│ StatusManager.update()  │
│ - Update DB record      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Supabase Realtime       │
│ broadcasts change       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Frontend receives       │
│ real-time update        │
└─────────────────────────┘
```

## Non-Functional Requirements

### Performance

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| Job enqueue latency | < 500ms | User should see immediate feedback after clicking "Get Quotes" |
| Browser session acquisition | < 5 seconds | Browserbase session spin-up time |
| Skyvern API response | < 2 seconds per step | Individual automation steps should be responsive |
| Status update propagation | < 1 second | Real-time feel requires low-latency Realtime updates |
| Concurrent browser sessions | 5+ per user | Support parallel carrier execution |
| pgmq throughput | 100+ jobs/minute | Handle burst traffic during peak usage |

**Source:** PRD Section "Performance Targets" - Quote initiation < 2 seconds, Progress update latency < 1 second

### Security

| Requirement | Implementation |
|-------------|----------------|
| **Browser session isolation** | Each quote execution gets isolated Browserbase session; no session sharing between users or jobs |
| **Session data cleanup** | Browser data (cookies, localStorage) cleared after each execution via Browserbase API |
| **API key protection** | SKYVERN_API_KEY and BROWSERBASE_API_KEY stored in environment variables, never exposed to client |
| **RLS enforcement** | All database tables use Row Level Security scoped to agency_id |
| **Service role separation** | Job queue processing uses service role; client queries use anon key with RLS |
| **No credential handling** | This epic does NOT handle credentials - deferred to Epic Q7 with Vault integration |

**Source:** Architecture Section "Security Architecture" - Session isolation, per-user browser sessions, no cross-contamination

### Reliability/Availability

| Requirement | Target | Strategy |
|-------------|--------|----------|
| Job delivery guarantee | At-least-once | pgmq provides message persistence and redelivery on failure |
| Failed job handling | Auto-retry 2x | Jobs retried with exponential backoff before moving to dead letter queue |
| Browser session recovery | Auto-reconnect | BrowserManager detects unhealthy sessions and requests new ones |
| Stale job cleanup | 30 min timeout | Jobs running > 30 minutes automatically marked as failed |
| Queue durability | 99.99% | pgmq backed by Supabase PostgreSQL with managed backups |

**Dead Letter Queue:** Jobs that fail 3 times are moved to `quote_jobs_dlq` table for manual review and debugging.

### Observability

| Signal | Implementation | Purpose |
|--------|----------------|---------|
| **Job lifecycle logging** | Structured JSON logs at job creation, start, completion, failure | Debug job execution issues |
| **Browser session metrics** | Log session acquisition time, health checks, cleanup events | Monitor Browserbase performance |
| **Skyvern API latency** | Log request/response times for each Skyvern call | Identify AI bottlenecks |
| **Queue depth metric** | Periodic logging of pgmq queue depth | Capacity planning and alerting |
| **Error categorization** | Structured error codes in logs (BROWSER_TIMEOUT, SKYVERN_ERROR, etc.) | Error pattern analysis |

**Logging Format:**
```typescript
interface QuoteJobLog {
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  jobId?: string;
  sessionId?: string;
  carrierCode?: string;
  step?: string;
  durationMs?: number;
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
}
```

## Dependencies and Integrations

### External Services (New)

| Service | Purpose | Version/Tier | Cost Estimate |
|---------|---------|--------------|---------------|
| **Skyvern** | AI browser automation agent | Latest API | $0.10-0.30 per task |
| **Browserbase** | Managed browser infrastructure | Startup tier | $20-99/mo for MVP |

### NPM Packages (New)

| Package | Purpose | Version |
|---------|---------|---------|
| `skyvern-sdk` | Skyvern API client (if available) | Latest |
| `playwright` | Browser automation fallback | ^1.40.0 |
| `@browserbasehq/sdk` | Browserbase API client | Latest |

### Existing Dependencies (Leveraged)

| Dependency | Current Version | Usage in Q6 |
|------------|-----------------|-------------|
| `@supabase/supabase-js` | ^2.84.0 | Database, Realtime, pgmq |
| `@supabase/ssr` | ^0.7.0 | Server-side Supabase client |
| `zod` | ^4.1.13 | Runtime validation for job payloads |

### Supabase Extensions (New)

| Extension | Purpose | Enable Command |
|-----------|---------|----------------|
| `pgmq` | Message queue for job processing | `create extension if not exists pgmq;` |

### Internal Dependencies

| Component | Location | Dependency Type |
|-----------|----------|-----------------|
| `quote_sessions` table | Phase 3 | Foreign key reference |
| `agencies` table | Core | Foreign key reference |
| `users` table | Core | RLS policy reference |
| Supabase Realtime | Existing | Status broadcast channel |

### Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                     docuMINE Application                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Phase 3 (Existing)          Phase 4 Epic Q6 (New)             │
│  ┌─────────────────┐         ┌─────────────────┐               │
│  │ quote_sessions  │◄────────│ quote_jobs      │               │
│  │ (client data)   │         │ (job tracking)  │               │
│  └─────────────────┘         └────────┬────────┘               │
│                                       │                         │
│                              ┌────────▼────────┐               │
│                              │ Job Queue       │               │
│                              │ (pgmq)          │               │
│                              └────────┬────────┘               │
│                                       │                         │
└───────────────────────────────────────┼─────────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
           ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
           │  Skyvern    │     │ Browserbase │     │  Supabase   │
           │  (AI Agent) │     │ (Browsers)  │     │  Realtime   │
           └─────────────┘     └─────────────┘     └─────────────┘
```

### Environment Configuration

```bash
# .env.local additions for Phase 4

# Skyvern AI Agent
SKYVERN_API_KEY=sk_live_...
SKYVERN_URL=https://api.skyvern.com/v1

# Browserbase Managed Browsers
BROWSERBASE_API_KEY=bb_live_...
BROWSERBASE_PROJECT_ID=proj_...

# Optional: Self-hosted Skyvern (future)
# SKYVERN_SELF_HOSTED_URL=http://localhost:8000
```

## Acceptance Criteria (Authoritative)

### Story Q6.1: Database Schema for AI Quoting

1. **AC-Q6.1.1:** Migration creates `quote_jobs` table with all specified columns (id, session_id, agency_id, carriers, priority, status, carriers_completed, carriers_total, results, errors, timestamps)
2. **AC-Q6.1.2:** Migration creates `quote_job_carriers` table with all specified columns (id, job_id, carrier_code, status, current_step, progress_pct, screenshot_url, result, error_message, recipe tracking, timestamps)
3. **AC-Q6.1.3:** Migration creates `carrier_recipes` table with unique constraint on (carrier_code, quote_type)
4. **AC-Q6.1.4:** RLS policies enforce agency-scoped access for quote_jobs and quote_job_carriers
5. **AC-Q6.1.5:** RLS policies allow read-only access to carrier_recipes for authenticated users
6. **AC-Q6.1.6:** Indexes created on session_id, status, job_id, and carrier lookup columns
7. **AC-Q6.1.7:** Foreign key constraints properly cascade on delete

### Story Q6.2: Skyvern Agent Integration

1. **AC-Q6.2.1:** SkyvernAdapter class implements QuoteAgent interface with executeQuote() and cancel() methods
2. **AC-Q6.2.2:** Adapter initializes Skyvern client with API key from environment variable
3. **AC-Q6.2.3:** Adapter creates task execution requests with mapped client data
4. **AC-Q6.2.4:** Adapter receives and processes progress callbacks from Skyvern
5. **AC-Q6.2.5:** Adapter handles task completion and extracts structured quote results
6. **AC-Q6.2.6:** Adapter handles task failure with proper error categorization
7. **AC-Q6.2.7:** Retry logic implements exponential backoff (2s, 4s, 8s)

### Story Q6.3: Browserbase Integration

1. **AC-Q6.3.1:** BrowserManager can request new browser session from Browserbase API
2. **AC-Q6.3.2:** Browser sessions are isolated per user (no shared sessions)
3. **AC-Q6.3.3:** Session data is cleared after each execution
4. **AC-Q6.3.4:** BrowserManager can release sessions back to pool
5. **AC-Q6.3.5:** BrowserManager detects unhealthy sessions and requests replacements
6. **AC-Q6.3.6:** Session acquisition completes within 5 seconds
7. **AC-Q6.3.7:** Sessions timeout after 10 minutes maximum

### Story Q6.4: Job Queue with pgmq

1. **AC-Q6.4.1:** pgmq extension enabled via migration
2. **AC-Q6.4.2:** JobQueueService can enqueue jobs with priority ordering
3. **AC-Q6.4.3:** JobQueueService can dequeue jobs in priority order
4. **AC-Q6.4.4:** Jobs provide at-least-once delivery guarantee
5. **AC-Q6.4.5:** Failed jobs retry up to 2 times before dead letter queue
6. **AC-Q6.4.6:** Queue supports 5+ concurrent job processing
7. **AC-Q6.4.7:** Queue depth metrics are logged for monitoring

## Traceability Mapping

| AC ID | Spec Section | Component(s) | Test Approach |
|-------|--------------|--------------|---------------|
| AC-Q6.1.1 | Data Models - Quote Jobs Table | Migration file, Supabase | Migration test: verify table structure |
| AC-Q6.1.2 | Data Models - Quote Job Carriers Table | Migration file, Supabase | Migration test: verify table structure |
| AC-Q6.1.3 | Data Models - Carrier Recipes Table | Migration file, Supabase | Migration test: verify unique constraint |
| AC-Q6.1.4 | Data Models - RLS Policies | Migration file, Supabase | Integration test: verify agency isolation |
| AC-Q6.1.5 | Data Models - RLS Policies | Migration file, Supabase | Integration test: verify read access |
| AC-Q6.1.6 | Data Models - Indexes | Migration file, Supabase | Migration test: verify indexes created |
| AC-Q6.1.7 | Data Models - Quote Jobs Table | Migration file, Supabase | Integration test: verify cascade delete |
| AC-Q6.2.1 | APIs - Skyvern Adapter | `skyvern-adapter.ts` | Unit test: interface compliance |
| AC-Q6.2.2 | APIs - Skyvern Adapter | `skyvern-adapter.ts` | Unit test: initialization |
| AC-Q6.2.3 | APIs - Skyvern Adapter | `skyvern-adapter.ts` | Unit test: client data mapping |
| AC-Q6.2.4 | APIs - Skyvern Adapter | `skyvern-adapter.ts` | Unit test: mock progress callbacks |
| AC-Q6.2.5 | APIs - Skyvern Adapter | `skyvern-adapter.ts` | Unit test: result extraction |
| AC-Q6.2.6 | APIs - Skyvern Adapter | `skyvern-adapter.ts` | Unit test: error handling |
| AC-Q6.2.7 | NFR - Reliability | `skyvern-adapter.ts` | Unit test: retry with backoff |
| AC-Q6.3.1 | APIs - Browser Manager | `browser-manager.ts` | Integration test: Browserbase API |
| AC-Q6.3.2 | NFR - Security | `browser-manager.ts` | Integration test: session isolation |
| AC-Q6.3.3 | NFR - Security | `browser-manager.ts` | Integration test: data cleanup |
| AC-Q6.3.4 | APIs - Browser Manager | `browser-manager.ts` | Unit test: session release |
| AC-Q6.3.5 | NFR - Reliability | `browser-manager.ts` | Unit test: health check logic |
| AC-Q6.3.6 | NFR - Performance | `browser-manager.ts` | Performance test: acquisition time |
| AC-Q6.3.7 | NFR - Reliability | `browser-manager.ts` | Unit test: timeout handling |
| AC-Q6.4.1 | Dependencies - Supabase Extensions | Migration file | Migration test: extension enabled |
| AC-Q6.4.2 | APIs - Job Queue Service | `job-queue.ts` | Unit test: enqueue with priority |
| AC-Q6.4.3 | APIs - Job Queue Service | `job-queue.ts` | Unit test: dequeue ordering |
| AC-Q6.4.4 | NFR - Reliability | `job-queue.ts` | Integration test: message persistence |
| AC-Q6.4.5 | NFR - Reliability | `job-queue.ts` | Unit test: retry and DLQ logic |
| AC-Q6.4.6 | NFR - Performance | `job-queue.ts` | Load test: concurrent processing |
| AC-Q6.4.7 | NFR - Observability | `job-queue.ts` | Unit test: metrics logging |

## Risks, Assumptions, Open Questions

### Risks

| ID | Risk | Impact | Likelihood | Mitigation |
|----|------|--------|------------|------------|
| R1 | **Skyvern API availability** - Service outages could block all AI automation | High | Low | Implement circuit breaker pattern; queue jobs for retry; future Claude Computer Use fallback |
| R2 | **Browserbase session limits** - Startup tier may hit concurrent session limits | Medium | Medium | Monitor usage; implement session pooling; plan upgrade path to Scale tier |
| R3 | **pgmq extension compatibility** - Extension may have version conflicts with Supabase | High | Low | Test in staging first; have fallback to simple polling pattern if needed |
| R4 | **Cost overruns** - AI + browser costs could exceed budget during testing | Medium | Medium | Implement usage tracking from day 1; set spend alerts; use recipe caching early |
| R5 | **Skyvern SDK availability** - Official SDK may not exist or be poorly documented | Low | Medium | Prepare to use direct REST API integration as fallback |

### Assumptions

| ID | Assumption | Validation Approach |
|----|------------|---------------------|
| A1 | Skyvern API provides progress callbacks for step-by-step updates | Review Skyvern API docs; test in sandbox |
| A2 | Browserbase sessions can be passed to Skyvern for execution | Test integration in development |
| A3 | pgmq extension is available on Supabase Pro plan | Verify with Supabase support/docs |
| A4 | Supabase Realtime can handle status update frequency (1 update/second/carrier) | Load test Realtime subscriptions |
| A5 | Phase 3 `quote_sessions` table schema is stable and won't change | Coordinate with Phase 3 completion |

### Open Questions

| ID | Question | Owner | Due Date | Resolution |
|----|----------|-------|----------|------------|
| Q1 | Does Skyvern support custom browser endpoints (Browserbase), or does it manage browsers internally? | Dev | Before Q6.2 | Research Skyvern docs |
| Q2 | What is the pgmq message size limit? Will job payloads fit? | Dev | Before Q6.4 | Test with realistic payloads |
| Q3 | Should we implement session pooling in MVP, or is on-demand session creation sufficient? | Dev | During Q6.3 | Benchmark session acquisition time |
| Q4 | How do we handle Skyvern rate limits if they exist? | Dev | Before Q6.2 | Review Skyvern pricing/limits |

## Test Strategy Summary

### Test Levels

| Level | Scope | Tools | Coverage Target |
|-------|-------|-------|-----------------|
| **Unit Tests** | Service classes, adapters, utilities | Vitest, mocks | 80% code coverage |
| **Integration Tests** | Database operations, RLS policies, Realtime | Vitest, Supabase test project | All CRUD operations |
| **E2E Tests** | Full job lifecycle (mock external APIs) | Playwright | Critical paths |
| **Manual Testing** | Real Skyvern + Browserbase integration | Dev environment | Happy path validation |

### Test Categories

**1. Database Schema Tests (Q6.1)**
- Verify all tables created with correct columns and types
- Test RLS policies with different user contexts
- Verify foreign key cascades work correctly
- Test unique constraints and indexes

**2. Skyvern Adapter Tests (Q6.2)**
- Mock Skyvern API responses for all scenarios
- Test client data mapping to prompts
- Test result extraction from responses
- Test error handling and retry logic
- Test cancellation flow

**3. Browser Manager Tests (Q6.3)**
- Mock Browserbase API for session management
- Test session acquisition timeout handling
- Test session health check logic
- Test cleanup on error scenarios

**4. Job Queue Tests (Q6.4)**
- Test enqueue/dequeue operations
- Test priority ordering
- Test at-least-once delivery (simulate failures)
- Test dead letter queue logic
- Test concurrent processing

### Test Data

```typescript
// Test fixtures for job creation
export const testQuoteJob = {
  sessionId: 'test-session-123',
  agencyId: 'test-agency-456',
  carriers: ['progressive', 'travelers'],
  priority: 5,
};

// Mock Skyvern response
export const mockSkyvernSuccess = {
  taskId: 'task-789',
  status: 'completed',
  result: {
    premium: 1847.00,
    coverages: { dwelling: 300000, liability: 100000 },
  },
};
```

### CI/CD Integration

- Unit tests run on every PR
- Integration tests run on merge to main
- E2E tests run nightly (due to external API costs)
- Manual testing required before Epic Q6 sign-off
