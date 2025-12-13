# Epic Technical Specification: Browser Use Agent Integration

Date: 2025-12-12
Author: Sam
Epic ID: Q7
Status: Draft

---

## Overview

Epic Q7 integrates Browser Use as a primary AI browser automation agent alongside the existing Skyvern implementation, enabling a dual-agent architecture with A/B testing capability. This epic addresses the research finding that Browser Use achieves 89% accuracy on WebVoyager benchmarks compared to Skyvern's 64.4%, while maintaining Skyvern as a fallback option for carrier-specific scenarios or recoverable errors.

The dual-agent architecture provides:
- **Higher Success Rates:** Leverage Browser Use's superior benchmark performance for most carriers
- **Resilience:** Automatic fallback to Skyvern on recoverable errors
- **Data-Driven Optimization:** A/B testing infrastructure to empirically determine best agent per carrier
- **Cost Efficiency:** Browser Use's lower per-task LLM costs reduce operating expenses

This epic builds on Q6's Skyvern integration and job queue infrastructure, adding the Browser Use adapter and Agent Factory routing system that enables intelligent agent selection.

## Objectives and Scope

### In-Scope

- **Q7.1:** Browser Use local installation, configuration, and proof-of-concept validation
- **Q7.2:** TypeScript adapter implementing `QuoteAgent` interface with Python subprocess communication
- **Q7.3:** RAM Mutual carrier configuration as Browser Use test carrier
- **Q7.4:** Agent Factory with A/B testing splits and carrier-specific routing
- **Q7.5:** Systematic A/B comparison and data-driven agent recommendations

### Out-of-Scope

- CAPTCHA solving service integration (covered in Q12)
- Recipe caching for Browser Use (covered in Q11)
- Additional carrier configurations beyond RAM Mutual (covered in Q13)
- Production deployment infrastructure changes (uses existing Vercel + Supabase)
- Credential management UI changes (covered in Q8)

## System Architecture Alignment

### Architecture Components Referenced

| Component | Location | Purpose in Q7 |
|-----------|----------|---------------|
| `QuoteAgent` interface | `src/lib/quoting/agent/types.ts` | Contract for interchangeable agents |
| `SkyvernAdapter` | `src/lib/quoting/agent/skyvern-adapter.ts` | Existing agent (becomes secondary) |
| `AgentFactory` | `src/lib/quoting/agent/index.ts` | New routing logic (Q7.4) |
| Job Queue | `src/lib/quoting/orchestrator/job-queue.ts` | Unchanged, calls AgentFactory |
| Carrier Registry | `src/lib/quoting/carriers/registry.ts` | Add RAM Mutual + agent preferences |

### Architecture Constraints

1. **Python Subprocess:** Browser Use is Python-only; adapter communicates via JSON over stdin/stdout
2. **Session Isolation:** Each quote execution gets isolated browser instance (Browserbase or local Playwright)
3. **Interface Parity:** BrowserUseAdapter must implement exact same `QuoteAgent` interface as SkyvernAdapter
4. **Stateless Design:** Adapters don't maintain state between executions; orchestrator handles state

### Integration Pattern

```
┌─────────────────────────────────────────────┐
│              Quote Orchestrator              │
│                                             │
│  1. Receive job from pgmq                   │
│  2. Call AgentFactory.getAgentForCarrier()  │
│  3. Execute via selected adapter            │
│  4. Handle fallback on recoverable error    │
│  5. Update status via StatusManager         │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│              Agent Factory                   │
│  ┌─────────────────┐  ┌─────────────────┐   │
│  │ BrowserUse      │  │ Skyvern         │   │
│  │ Adapter (NEW)   │  │ Adapter (Q6)    │   │
│  │ Primary (89%)   │  │ Fallback (64%)  │   │
│  └────────┬────────┘  └────────┬────────┘   │
│           │ A/B Test           │            │
│           └────────┬───────────┘            │
└────────────────────┼────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │   Browser Instance     │
        │   (Local Playwright)   │
        └────────────────────────┘
```

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs | Owner |
|--------|---------------|--------|---------|-------|
| `BrowserUseAdapter` | Execute quotes via Browser Use Python subprocess | `QuoteExecutionParams` | `QuoteResult` | Q7.2 |
| `browser-use-runner.py` | Python script executing Browser Use agent | JSON (credentials, clientData) | JSON lines (progress, result) | Q7.2 |
| `AgentFactory` | Route to appropriate agent based on carrier config | `carrierCode`, `AgentOptions` | `QuoteAgent` instance | Q7.4 |
| `CarrierRegistry` (extended) | Store carrier configs including agent preference | - | `CarrierConfig` | Q7.3 |
| `ABTestLogger` | Log agent assignments for analysis | `jobId`, `carrierCode`, `agentType` | - | Q7.5 |

### Data Models and Contracts

#### AgentConfig Type

```typescript
// src/lib/quoting/agent/types.ts

export interface AgentConfig {
  primaryAgent: 'browser-use' | 'skyvern';
  fallbackAgent?: 'browser-use' | 'skyvern' | null;
  abTestSplit?: number;  // 0-100, percentage routed to non-primary
}

export interface CarrierAgentConfig extends AgentConfig {
  carrierCode: string;
  enabled: boolean;
  lastUpdated: string;
}
```

#### QuoteAgent Interface (existing from Q6)

```typescript
// src/lib/quoting/agent/types.ts

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
  data?: {
    premium: number;
    monthlyPremium?: number;
    coverages: Record<string, string>;
    deductibles: Record<string, number>;
    quoteReference?: string;
  };
  error?: QuoteError;
  agentType: 'browser-use' | 'skyvern';
  executionTimeMs: number;
}
```

#### QuoteError Type

```typescript
export type QuoteErrorCode =
  | 'CREDENTIALS_INVALID'
  | 'CAPTCHA_FAILED'
  | 'FORM_CHANGED'
  | 'TIMEOUT'
  | 'PORTAL_UNAVAILABLE'
  | 'UNKNOWN';

export interface QuoteError {
  code: QuoteErrorCode;
  message: string;
  recoverable: boolean;
  suggestedAction?: string;
}
```

#### Python-TypeScript Communication Protocol

```typescript
// JSON line format for progress updates
interface ProgressUpdate {
  type: 'progress';
  step: string;
  progress: number;  // 0-100
  screenshot?: string;  // Base64 or URL
}

// JSON line format for final result
interface ResultUpdate {
  type: 'result';
  success: boolean;
  data?: QuoteResultData;
  error?: string;
}
```

#### Database: quote_job_carriers Extension

```sql
-- Add agent tracking to existing table (from Q6)
ALTER TABLE quote_job_carriers
ADD COLUMN agent_type text DEFAULT 'skyvern',
ADD COLUMN ab_test_group text;

-- Values: 'browser-use' | 'skyvern'
-- ab_test_group: 'control' | 'treatment' | null
```

### APIs and Interfaces

#### BrowserUseAdapter Class

```typescript
// src/lib/quoting/agent/browser-use-adapter.ts

import { spawn, ChildProcess } from 'child_process';
import { QuoteAgent, QuoteExecutionParams, QuoteResult, QuoteError } from './types';

export class BrowserUseAdapter implements QuoteAgent {
  private process: ChildProcess | null = null;
  private readonly pythonPath: string;
  private readonly scriptPath: string;

  constructor(private options: AgentOptions) {
    this.pythonPath = process.env.PYTHON_PATH || 'python3';
    this.scriptPath = path.join(__dirname, 'browser-use-runner.py');
  }

  async executeQuote(params: QuoteExecutionParams): Promise<QuoteResult> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      this.process = spawn(this.pythonPath, [
        this.scriptPath,
        '--carrier', params.carrierCode,
        '--portal-url', CARRIERS[params.carrierCode].portalUrl,
      ], {
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        },
      });

      // Send input data via stdin
      this.process.stdin.write(JSON.stringify({
        credentials: params.credentials,
        clientData: params.clientData,
      }));
      this.process.stdin.end();

      let result: QuoteResult | null = null;

      // Handle stdout (progress + result)
      this.process.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const update = JSON.parse(line);
            if (update.type === 'progress') {
              params.onProgress({
                currentStep: update.step,
                progressPct: update.progress,
                screenshot: update.screenshot,
              });
            } else if (update.type === 'result') {
              result = {
                success: update.success,
                data: update.data,
                error: update.error ? this.mapError(update.error) : undefined,
                agentType: 'browser-use',
                executionTimeMs: Date.now() - startTime,
              };
            }
          } catch (e) {
            // Non-JSON output, log for debugging
            console.debug('[BrowserUse stdout]', line);
          }
        }
      });

      // Handle stderr
      this.process.stderr.on('data', (data) => {
        console.error('[BrowserUse stderr]', data.toString());
      });

      // Handle process exit
      this.process.on('close', (code) => {
        if (code === 0 && result) {
          resolve(result);
        } else {
          reject({
            code: 'UNKNOWN',
            message: result?.error?.message || `Process exited with code ${code}`,
            recoverable: true,
          });
        }
        this.process = null;
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        if (this.process) {
          this.process.kill('SIGTERM');
          reject({
            code: 'TIMEOUT',
            message: 'Execution timed out after 5 minutes',
            recoverable: true,
          });
        }
      }, 5 * 60 * 1000);
    });
  }

  async cancel(): Promise<void> {
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
    }
  }

  private mapError(errorMessage: string): QuoteError {
    const errorPatterns: Array<[RegExp, QuoteErrorCode, boolean]> = [
      [/login failed|invalid credentials|authentication/i, 'CREDENTIALS_INVALID', false],
      [/captcha|challenge/i, 'CAPTCHA_FAILED', false],
      [/element not found|selector|form changed/i, 'FORM_CHANGED', true],
      [/timeout|timed out/i, 'TIMEOUT', true],
      [/connection|network|unavailable/i, 'PORTAL_UNAVAILABLE', true],
    ];

    for (const [pattern, code, recoverable] of errorPatterns) {
      if (pattern.test(errorMessage)) {
        return { code, message: errorMessage, recoverable };
      }
    }

    return { code: 'UNKNOWN', message: errorMessage, recoverable: false };
  }
}
```

#### AgentFactory Class

```typescript
// src/lib/quoting/agent/index.ts

import { BrowserUseAdapter } from './browser-use-adapter';
import { SkyvernAdapter } from './skyvern-adapter';
import { QuoteAgent, AgentConfig, QuoteExecutionParams, QuoteResult } from './types';
import { getCarrierConfig } from '../carriers/registry';

export class AgentFactory {
  private static defaultConfig: AgentConfig = {
    primaryAgent: 'browser-use',
    fallbackAgent: 'skyvern',
    abTestSplit: 0,  // 100% to primary by default
  };

  static async getAgentForCarrier(
    carrierCode: string,
    options: AgentOptions
  ): Promise<{ agent: QuoteAgent; agentType: string; abTestGroup: string | null }> {
    const config = getCarrierConfig(carrierCode)?.agentConfig || this.defaultConfig;

    let agentType = config.primaryAgent;
    let abTestGroup: string | null = null;

    // A/B testing: route percentage to non-primary
    if (config.abTestSplit && config.abTestSplit > 0) {
      const random = Math.random() * 100;
      if (random < config.abTestSplit) {
        agentType = config.primaryAgent === 'browser-use' ? 'skyvern' : 'browser-use';
        abTestGroup = 'treatment';
      } else {
        abTestGroup = 'control';
      }
    }

    const agent = agentType === 'browser-use'
      ? new BrowserUseAdapter(options)
      : new SkyvernAdapter(options);

    return { agent, agentType, abTestGroup };
  }

  static async executeWithFallback(
    carrierCode: string,
    params: QuoteExecutionParams,
    options: AgentOptions
  ): Promise<QuoteResult> {
    const config = getCarrierConfig(carrierCode)?.agentConfig || this.defaultConfig;
    const { agent, agentType, abTestGroup } = await this.getAgentForCarrier(carrierCode, options);

    // Log agent assignment
    await this.logAgentAssignment(params.sessionId, carrierCode, agentType, abTestGroup);

    try {
      return await agent.executeQuote(params);
    } catch (error) {
      const quoteError = error as QuoteError;

      // Only fallback on recoverable errors
      if (quoteError.recoverable && config.fallbackAgent) {
        console.log(`[AgentFactory] Primary agent failed, falling back to ${config.fallbackAgent}`);

        const fallbackAgent = config.fallbackAgent === 'browser-use'
          ? new BrowserUseAdapter(options)
          : new SkyvernAdapter(options);

        // Update progress to show fallback
        params.onProgress({
          currentStep: `Switching to ${config.fallbackAgent}...`,
          progressPct: 10,
        });

        return await fallbackAgent.executeQuote(params);
      }

      throw error;
    }
  }

  private static async logAgentAssignment(
    sessionId: string,
    carrierCode: string,
    agentType: string,
    abTestGroup: string | null
  ): Promise<void> {
    // Update quote_job_carriers with agent info
    // This is called by orchestrator after job creation
  }
}
```

### Workflows and Sequencing

#### Quote Execution Flow with Dual-Agent

```
1. User clicks "Get Quotes" with carriers selected
   │
2. Orchestrator creates quote_job record
   │
3. For each carrier:
   │
   ├─▶ 3a. AgentFactory.getAgentForCarrier(carrierCode)
   │       - Check carrier config for agent preference
   │       - Apply A/B test split if configured
   │       - Return appropriate adapter + log assignment
   │
   ├─▶ 3b. Execute via selected adapter
   │       - BrowserUseAdapter spawns Python subprocess
   │       - SkyvernAdapter calls REST API
   │       - Both emit progress updates via onProgress callback
   │
   ├─▶ 3c. On error, check if recoverable
   │       - CREDENTIALS_INVALID, CAPTCHA_FAILED → No fallback
   │       - FORM_CHANGED, TIMEOUT, PORTAL_UNAVAILABLE → Try fallback
   │
   └─▶ 3d. Record result with agent_type for analysis

4. Aggregate results, update job status
```

#### Browser Use Python Execution Flow

```python
# browser-use-runner.py execution flow

1. Parse command line args (--carrier, --portal-url)
2. Read JSON input from stdin (credentials, clientData)
3. Initialize Browser Use Agent with Claude
4. Execute quote workflow:
   a. Navigate to portal URL
   b. Login with credentials
   c. Navigate to quote entry
   d. Fill form fields with client data
   e. Submit and wait for results
   f. Extract quote data
5. Emit progress updates (JSON lines to stdout)
6. Emit final result (JSON line to stdout)
7. Exit with code 0 (success) or 1 (failure)
```

## Non-Functional Requirements

### Performance

| Metric | Target | Rationale |
|--------|--------|-----------|
| Quote execution time (Browser Use) | 2-5 min | AI learning mode, comparable to Skyvern |
| Quote execution time (cached recipe) | 1-2 min | Future optimization (Q11) |
| Progress update latency | < 1 second | Real-time feel via JSON line streaming |
| Python subprocess startup | < 2 seconds | One-time cost per execution |
| Agent Factory routing decision | < 10ms | In-memory config lookup |

### Security

| Requirement | Implementation |
|-------------|----------------|
| Credential handling | Credentials passed via stdin, never logged, cleared after use |
| Process isolation | Each execution spawns new subprocess, no shared state |
| API key protection | ANTHROPIC_API_KEY passed via environment, not command line |
| Audit logging | Agent type and A/B group logged per execution for analysis |

### Reliability/Availability

| Requirement | Target | Strategy |
|-------------|--------|----------|
| Browser Use success rate | 85%+ | Based on 89% WebVoyager benchmark |
| Fallback trigger rate | < 15% | Only on recoverable errors |
| Process timeout handling | 100% | 5-minute hard timeout with graceful cleanup |
| Error categorization accuracy | 90%+ | Pattern-based error mapping |

### Observability

| Signal | Implementation |
|--------|----------------|
| Execution logs | Structured JSON logs with sessionId, carrierCode, agentType |
| Progress tracking | Real-time updates to quote_job_carriers table |
| Error classification | QuoteError with code, message, recoverable flag |
| A/B test metrics | agent_type and ab_test_group columns for analysis |
| Python subprocess logs | stderr captured and logged at debug level |

## Dependencies and Integrations

### External Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| `browser-use` | latest (pip) | Python AI browser automation |
| `playwright` | latest (pip) | Browser automation runtime |
| `langchain-anthropic` | latest (pip) | Claude integration for Browser Use |
| Python | 3.11+ | Runtime for Browser Use |

### Internal Dependencies

| Component | Epic | Status |
|-----------|------|--------|
| `QuoteAgent` interface | Q6.2 | Done |
| `SkyvernAdapter` | Q6.2 | Done |
| Job Queue (pgmq) | Q6.4 | Done |
| Carrier Registry | Q4 | Done |
| Quote Orchestrator | Q6 | Done |

### Integration Points

| Integration | Approach |
|-------------|----------|
| Existing orchestrator | AgentFactory called instead of direct SkyvernAdapter |
| Progress updates | Same StatusManager pattern, onProgress callback |
| Error handling | Same QuoteError structure, recoverable flag for fallback |
| Carrier config | Extended registry with agentConfig field |

## Acceptance Criteria (Authoritative)

### Q7.1: Browser Use Local Setup & POC

| AC# | Criteria | Testable |
|-----|----------|----------|
| AC1.1 | `pip install browser-use playwright` completes without errors | ✓ |
| AC1.2 | `playwright install` installs required browser binaries | ✓ |
| AC1.3 | Simple POC script navigates to website and extracts data | ✓ |
| AC1.4 | ANTHROPIC_API_KEY integration works with Claude | ✓ |
| AC1.5 | Setup documentation created at `docs/features/quoting/browser-use-setup.md` | ✓ |

### Q7.2: BrowserUseAdapter Implementation

| AC# | Criteria | Testable |
|-----|----------|----------|
| AC2.1 | BrowserUseAdapter implements QuoteAgent interface | ✓ Unit test |
| AC2.2 | Python subprocess spawned with correct arguments | ✓ Unit test |
| AC2.3 | JSON input sent via stdin with credentials and clientData | ✓ Unit test |
| AC2.4 | Progress updates parsed from stdout JSON lines | ✓ Unit test |
| AC2.5 | Final result parsed and returned as QuoteResult | ✓ Unit test |
| AC2.6 | cancel() terminates subprocess with SIGTERM | ✓ Unit test |
| AC2.7 | Error mapping converts Python errors to QuoteError codes | ✓ Unit test |
| AC2.8 | 5-minute timeout terminates stuck processes | ✓ Integration test |
| AC2.9 | Unit test coverage ≥ 90% | ✓ Coverage report |

### Q7.3: RAM Mutual Carrier Configuration

| AC# | Criteria | Testable |
|-----|----------|----------|
| AC3.1 | RAM Mutual added to carrier registry with code 'ram-mutual' | ✓ |
| AC3.2 | Portal URL configured for RAM Mutual agent portal | ✓ |
| AC3.3 | Agent preference set to 'browser-use' | ✓ |
| AC3.4 | Clipboard formatter exists for manual workflow | ✓ |
| AC3.5 | Live portal test: login succeeds with test credentials | ✓ Manual |
| AC3.6 | Live portal test: form navigation works | ✓ Manual |
| AC3.7 | Live portal test: quote result extracted | ✓ Manual |

### Q7.4: Agent Factory & Routing System

| AC# | Criteria | Testable |
|-----|----------|----------|
| AC4.1 | AgentFactory.getAgentForCarrier returns correct adapter type | ✓ Unit test |
| AC4.2 | A/B test split routes percentage to secondary agent | ✓ Unit test |
| AC4.3 | Carrier-specific config overrides default | ✓ Unit test |
| AC4.4 | Fallback triggered only on recoverable errors | ✓ Unit test |
| AC4.5 | Non-recoverable errors (CREDENTIALS_INVALID) skip fallback | ✓ Unit test |
| AC4.6 | Agent assignment logged to quote_job_carriers | ✓ Integration test |
| AC4.7 | A/B group logged for analysis | ✓ Integration test |

### Q7.5: A/B Testing & Comparison

| AC# | Criteria | Testable |
|-----|----------|----------|
| AC5.1 | Minimum 5 test runs per agent on same test data | ✓ Manual |
| AC5.2 | Success rate calculated per agent | ✓ Query |
| AC5.3 | Average completion time tracked per agent | ✓ Query |
| AC5.4 | Error distribution documented by type | ✓ Report |
| AC5.5 | Comparison report created at `docs/features/quoting/ab-test-results.md` | ✓ |
| AC5.6 | Carrier config updated with recommended agent | ✓ |

## Traceability Mapping

| AC | Spec Section | Component(s) | Test Approach |
|----|--------------|--------------|---------------|
| AC1.1-1.5 | Setup POC | Python environment | Manual verification + docs |
| AC2.1-2.9 | BrowserUseAdapter | `browser-use-adapter.ts`, `browser-use-runner.py` | Unit tests (Vitest) |
| AC3.1-3.7 | CarrierRegistry | `carriers/registry.ts` | Unit + Manual portal test |
| AC4.1-4.7 | AgentFactory | `agent/index.ts` | Unit + Integration tests |
| AC5.1-5.6 | A/B Testing | Data analysis | Manual comparison + report |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Browser Use performs worse than benchmark in production | Medium | High | Keep Skyvern as fallback, A/B test before full rollout |
| Python subprocess adds latency/complexity | Low | Medium | Profile startup time, consider persistent process pool |
| RAM Mutual portal blocks automation | Medium | Medium | Implement residential proxy rotation |
| Claude API costs exceed budget | Low | Medium | Monitor costs, consider caching/local models |

### Assumptions

| Assumption | Validation |
|------------|------------|
| Browser Use 89% benchmark applies to insurance portals | Validate via POC (Q7.1) |
| Python 3.11+ available in deployment environment | Verify Vercel/production setup |
| Subprocess communication via JSON lines is reliable | Test with large payloads |
| Skyvern adapter remains stable as fallback | Existing Q6 tests provide coverage |

### Open Questions

| Question | Owner | Due |
|----------|-------|-----|
| Should we use persistent Python process pool vs. subprocess per execution? | Dev | Q7.2 |
| What residential proxy service for carrier portals? | Sam | Q7.3 |
| How to handle Browser Use's browser instance management vs. Browserbase? | Dev | Q7.1 |

## Test Strategy Summary

### Test Levels

| Level | Scope | Framework | Coverage Target |
|-------|-------|-----------|-----------------|
| Unit | Adapters, Factory, Error mapping | Vitest | 90%+ |
| Integration | Subprocess communication, DB logging | Vitest + Supabase | 80%+ |
| E2E | Full quote flow with real portal | Playwright | Critical paths |
| Manual | Live portal validation | - | RAM Mutual carrier |

### Test Files

| File | Purpose |
|------|---------|
| `__tests__/lib/quoting/agent/browser-use-adapter.test.ts` | BrowserUseAdapter unit tests |
| `__tests__/lib/quoting/agent/agent-factory.test.ts` | AgentFactory routing/fallback tests |
| `__tests__/lib/quoting/agent/error-mapping.test.ts` | Error categorization tests |
| `__tests__/e2e/quoting/browser-use-execution.spec.ts` | E2E quote execution |

### Critical Test Scenarios

1. **Happy Path:** Browser Use successfully completes quote, returns result
2. **Fallback Path:** Browser Use fails with TIMEOUT, Skyvern succeeds
3. **No Fallback:** Browser Use fails with CREDENTIALS_INVALID, error returned
4. **A/B Split:** 50/50 split routes ~50% to each agent
5. **Timeout:** Stuck subprocess killed after 5 minutes
6. **Cancellation:** cancel() terminates running subprocess

