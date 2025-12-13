# Story Q7-4: Agent Factory & Routing System

## Story

**As a** developer
**I want** an AgentFactory that routes carriers to the appropriate adapter
**So that** we can use the best agent for each carrier without hardcoding

## Description

Create an AgentFactory that:
1. Maintains configuration of which agent to use per carrier
2. Instantiates the appropriate adapter (BrowserUse or Skyvern)
3. Supports fallback logic when primary agent fails
4. Enables A/B testing by routing percentage of requests

## Acceptance Criteria

### AC-Q7.4-1: Factory Interface
- [ ] `AgentFactory` class created
- [ ] `getAgent(carrierCode): QuoteAgent` returns appropriate adapter
- [ ] `getPreferredAgent(carrierCode): AgentType` returns configured preference
- [ ] Factory is singleton or injected via context

### AC-Q7.4-2: Carrier-Agent Mapping
- [ ] Configuration maps carriers to preferred agents
- [ ] Default agent configurable (fallback for unmapped carriers)
- [ ] Mapping stored in database or config file
- [ ] Runtime configuration updates supported

### AC-Q7.4-3: Fallback Logic
- [ ] When primary agent fails, fallback to secondary
- [ ] Fallback only for recoverable errors (TIMEOUT, PORTAL_UNAVAILABLE)
- [ ] Non-recoverable errors (CREDENTIALS_INVALID) don't trigger fallback
- [ ] Fallback attempts logged for analysis

### AC-Q7.4-4: A/B Testing Support
- [ ] Traffic split percentage configurable per carrier
- [ ] Random routing based on percentage (e.g., 80% Browser Use, 20% Skyvern)
- [ ] A/B assignment logged with job for analysis
- [ ] Can disable A/B testing (100% to one agent)

### AC-Q7.4-5: Test Coverage
- [ ] Unit tests for factory methods
- [ ] Tests for fallback logic
- [ ] Tests for A/B routing distribution
- [ ] ≥90% code coverage

## Technical Notes

### Factory Implementation

```typescript
// src/lib/quoting/agent/agent-factory.ts
export type AgentType = 'browser-use' | 'skyvern';

export interface CarrierAgentConfig {
  carrierCode: string;
  primaryAgent: AgentType;
  fallbackAgent?: AgentType;
  abTestPercentage?: number; // 0-100, percentage to primary
}

export class AgentFactory {
  private configs: Map<string, CarrierAgentConfig> = new Map();
  private defaultAgent: AgentType = 'browser-use';

  constructor() {
    // Load configs from database or env
    this.loadConfigs();
  }

  getAgent(carrierCode: string): QuoteAgent {
    const config = this.configs.get(carrierCode);
    const agentType = this.selectAgent(config);

    switch (agentType) {
      case 'browser-use':
        return new BrowserUseAdapter();
      case 'skyvern':
        return new SkyvernAdapter();
      default:
        throw new Error(`Unknown agent type: ${agentType}`);
    }
  }

  private selectAgent(config?: CarrierAgentConfig): AgentType {
    if (!config) return this.defaultAgent;

    // A/B testing logic
    if (config.abTestPercentage !== undefined) {
      const random = Math.random() * 100;
      if (random < config.abTestPercentage) {
        return config.primaryAgent;
      }
      return config.fallbackAgent ?? this.defaultAgent;
    }

    return config.primaryAgent;
  }

  async executeWithFallback(
    carrierCode: string,
    params: QuoteExecutionParams
  ): Promise<QuoteAgentResult> {
    const config = this.configs.get(carrierCode);
    const primaryAgent = this.getAgent(carrierCode);

    try {
      return await primaryAgent.executeQuote(params);
    } catch (error) {
      // Check if fallback is configured and error is recoverable
      if (config?.fallbackAgent && this.isRecoverableError(error)) {
        const fallbackAgent = this.createAgent(config.fallbackAgent);
        return await fallbackAgent.executeQuote(params);
      }
      throw error;
    }
  }
}
```

### Configuration Schema

```typescript
// Database or config file
const carrierAgentConfigs: CarrierAgentConfig[] = [
  {
    carrierCode: 'ram-mutual',
    primaryAgent: 'browser-use',
    fallbackAgent: 'skyvern',
    abTestPercentage: 100, // 100% Browser Use for now
  },
  {
    carrierCode: 'progressive',
    primaryAgent: 'skyvern', // Existing, proven
    fallbackAgent: 'browser-use',
    abTestPercentage: 80, // 80% Skyvern, 20% Browser Use for testing
  },
  {
    carrierCode: 'travelers',
    primaryAgent: 'skyvern',
    fallbackAgent: 'browser-use',
    abTestPercentage: 80,
  },
];
```

### Logging for A/B Analysis

```typescript
interface AgentSelectionLog {
  jobId: string;
  carrierCode: string;
  selectedAgent: AgentType;
  abTestGroup: 'primary' | 'fallback' | 'fallback-error';
  timestamp: string;
}
```

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/quoting/agent/agent-factory.ts` | Create | Factory implementation |
| `src/lib/quoting/agent/index.ts` | Modify | Export factory |
| `src/types/quoting/agent.ts` | Modify | Add AgentType, configs |
| `__tests__/lib/quoting/agent/agent-factory.test.ts` | Create | Unit tests |

## Dependencies

- Story Q7-2: BrowserUseAdapter (to route to)
- Existing SkyvernAdapter from Q6.2

## Estimation

- **Story Points:** 3
- **Complexity:** Medium
- **Risk:** Low (straightforward factory pattern)

## Definition of Done

- [ ] AgentFactory creates correct adapters
- [ ] Carrier-agent mapping works
- [ ] Fallback logic implemented
- [ ] A/B testing percentage routing works
- [ ] ≥90% test coverage
- [ ] Code review approved
