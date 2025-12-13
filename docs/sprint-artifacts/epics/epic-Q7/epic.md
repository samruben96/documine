# Epic Q7: Browser Use Agent Integration

**Status:** Contexted
**FRs Covered:** FR3, FR27
**Tech Spec:** [tech-spec.md](./tech-spec.md)

## Overview

Integrate Browser Use as an alternative AI browser automation agent alongside the existing Skyvern adapter. This enables A/B testing between agents and provides a fallback strategy for different carrier portals. Testing will use RAM Mutual as the first carrier with live credentials.

**Research Basis:** [AI Browser Automation Tools 2025](../../../features/research/ai-browser-automation-tools-2025.md)

## Business Value

- **Higher success rates**: Browser Use achieves 89% on WebVoyager benchmark vs Skyvern's 85.8%
- **Cost reduction**: Open-source with free self-hosting + lower per-task LLM costs
- **Risk mitigation**: Dual-agent architecture prevents single point of failure
- **Model flexibility**: Browser Use supports Claude (our preferred LLM) natively
- **Live validation**: Real testing with RAM Mutual credentials proves production readiness

## Scope

### In Scope

- Local Browser Use setup and development environment
- `BrowserUseAdapter` implementing existing `QuoteAgent` interface
- RAM Mutual carrier configuration (formatter + AI automation config)
- Agent factory for dynamic adapter selection
- A/B testing infrastructure to compare agent performance
- Live testing with RAM Mutual portal

### Out of Scope

- Production deployment infrastructure (separate ops story)
- Additional carriers beyond RAM Mutual (future epics)
- Recipe caching for Browser Use (Epic Q11)
- Full credential vault (Epic Q8) - will use env vars for POC

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Epic Q6: AI Infrastructure | Done | QuoteAgent interface, job queue |
| Browser Use library | External | pip install browser-use |
| RAM Mutual credentials | Available | User has portal access |
| Claude API key | Available | For Browser Use LLM |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              AgentFactory (NEW)                      │
│  - getAgentForCarrier(carrierCode): QuoteAgent      │
│  - getPreferredAgent(carrierCode): 'browser-use' | 'skyvern' │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐   │
│  │ BrowserUseAdapter   │  │ SkyvernAdapter      │   │
│  │ (NEW - Story Q7-2)  │  │ (EXISTING - Q6.2)   │   │
│  │                     │  │                     │   │
│  │ - Python subprocess │  │ - REST API client   │   │
│  │ - Claude/GPT/Gemini │  │ - Computer vision   │   │
│  └─────────────────────┘  └─────────────────────┘   │
├─────────────────────────────────────────────────────┤
│           Job Queue (pgmq) - unchanged               │
├─────────────────────────────────────────────────────┤
│           Carrier Registry                           │
│  + RAM Mutual (NEW - Story Q7-3)                    │
└─────────────────────────────────────────────────────┘
```

## Stories

| Story ID | Title | Priority | Estimate |
|----------|-------|----------|----------|
| Q7-1 | Browser Use Local Setup & POC | Critical | 3 |
| Q7-2 | BrowserUseAdapter Implementation | Critical | 5 |
| Q7-3 | RAM Mutual Carrier Configuration | High | 3 |
| Q7-4 | Agent Factory & Routing System | High | 3 |
| Q7-5 | A/B Testing & Comparison | Medium | 2 |

**Total Estimate:** 16 story points

## Acceptance Criteria (Epic Level)

- [ ] Browser Use runs locally and successfully automates a simple task
- [ ] BrowserUseAdapter implements QuoteAgent interface with full test coverage
- [ ] RAM Mutual carrier is configured with formatter and automation config
- [ ] Agent factory routes carriers to appropriate adapter
- [ ] Live test with RAM Mutual portal succeeds via Browser Use
- [ ] A/B test results documented comparing both agents
- [ ] All existing Q6 tests continue passing

## Technical Notes

### Browser Use Integration Approach

**Python subprocess** (Selected for MVP)
- Spawn Python process per task
- Communicate via stdout/JSON
- Clean separation from Node.js runtime
- Easy to debug and monitor

```typescript
// Simplified BrowserUseAdapter pattern
class BrowserUseAdapter implements QuoteAgent {
  async executeQuote(params: QuoteExecutionParams): Promise<QuoteAgentResult> {
    const pythonScript = path.join(__dirname, 'browser_use_runner.py');
    const result = await this.runPythonScript(pythonScript, {
      url: carrier.portalUrl,
      credentials: params.credentials,
      clientData: params.clientData,
    });
    return this.parseResult(result);
  }
}
```

### Environment Variables

```bash
# Browser Use configuration (add to .env.local)
BROWSER_USE_MODEL=claude-3-5-sonnet  # or gpt-4o, gemini-pro
BROWSER_USE_HEADLESS=false  # true for production
ANTHROPIC_API_KEY=sk-ant-...  # Required for Claude

# RAM Mutual test credentials (temporary - will move to vault)
RAM_MUTUAL_USERNAME=agent@example.com
RAM_MUTUAL_PASSWORD=***
```

### RAM Mutual Portal Info

- **Portal URL:** https://www.rfrm.com/agents (verify with user)
- **Lines of Business:** Auto, Home, Farm
- **Target:** Personal auto quote for testing

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Browser Use POC success | 100% | Simple task completion |
| RAM Mutual quote success | ≥80% | Live portal test |
| Adapter test coverage | ≥90% | Jest coverage |
| Comparison documented | Yes | A/B results in report |

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Python subprocess complexity | Medium | Medium | Clear interface contract |
| RAM Mutual portal blocks automation | Medium | High | Use Skyvern fallback |
| Browser Use API changes | Low | Medium | Pin version, monitor releases |

## Timeline

- **Sprint:** Active
- **Target Completion:** 2-3 days with parallel execution
- **Testing:** RAM Mutual live test after Q7-3 complete

## References

- [Browser Use Documentation](https://browser-use.com/)
- [Browser Use GitHub](https://github.com/browser-use/browser-use)
- [Research Report](../../../features/research/ai-browser-automation-tools-2025.md)
- [QuoteAgent Interface](../../../../src/types/quoting/agent.ts)
- [SkyvernAdapter Reference](../../../../src/lib/quoting/agent/skyvern-adapter.ts)
