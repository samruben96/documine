# Story Q7-2: BrowserUseAdapter Implementation

## Story

**As a** developer
**I want** a BrowserUseAdapter that implements the QuoteAgent interface
**So that** Browser Use can be used interchangeably with SkyvernAdapter

## Description

Create `BrowserUseAdapter` class that implements the existing `QuoteAgent` interface from Q6. This adapter will:
1. Spawn Python subprocess to run Browser Use
2. Pass client data and credentials to Python script
3. Parse results back into TypeScript types
4. Handle errors with proper categorization
5. Support progress callbacks via stdout streaming

## Acceptance Criteria

### AC-Q7.2-1: Interface Implementation
- [ ] `BrowserUseAdapter` implements `QuoteAgent` interface
- [ ] `executeQuote(params)` method works correctly
- [ ] `cancel()` method terminates running subprocess
- [ ] Type-safe with full TypeScript types

### AC-Q7.2-2: Python Communication
- [ ] Creates `browser_use_runner.py` script
- [ ] TypeScript spawns Python subprocess
- [ ] JSON communication via stdin/stdout
- [ ] Proper process cleanup on completion/error/cancel

### AC-Q7.2-3: Progress Tracking
- [ ] Python script outputs progress as JSON lines
- [ ] TypeScript parses progress updates
- [ ] `onProgress` callback invoked with updates
- [ ] Progress includes step description and percentage

### AC-Q7.2-4: Result Extraction
- [ ] Quote results extracted via Browser Use
- [ ] Results mapped to `QuoteResultData` type
- [ ] Premium, coverages, deductibles parsed
- [ ] Screenshots captured and returned

### AC-Q7.2-5: Error Handling
- [ ] Python errors caught and categorized
- [ ] Maps to `QuoteError` codes (CREDENTIALS_INVALID, TIMEOUT, etc.)
- [ ] Recoverable errors marked appropriately
- [ ] Subprocess crashes handled gracefully

### AC-Q7.2-6: Test Coverage
- [ ] Unit tests for adapter methods
- [ ] Mock Python subprocess for testing
- [ ] Test all error scenarios
- [ ] Test progress callback invocations
- [ ] ≥90% code coverage

## Technical Notes

### Adapter Structure

```typescript
// src/lib/quoting/agent/browser-use-adapter.ts
export class BrowserUseAdapter implements QuoteAgent {
  private process: ChildProcess | null = null;

  async executeQuote(params: QuoteExecutionParams): Promise<QuoteAgentResult> {
    const scriptPath = path.join(__dirname, 'browser_use_runner.py');

    const input = {
      portalUrl: getCarrier(params.carrierCode)?.portalUrl,
      credentials: params.credentials,
      clientData: params.clientData,
      carrierCode: params.carrierCode,
    };

    return new Promise((resolve, reject) => {
      this.process = spawn('python', [scriptPath], {
        env: { ...process.env },
      });

      this.process.stdin.write(JSON.stringify(input) + '\n');
      this.process.stdin.end();

      // Handle stdout for progress and results
      // Handle stderr for errors
      // Parse final result
    });
  }

  async cancel(): Promise<void> {
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
    }
  }
}
```

### Python Runner Script

```python
# src/lib/quoting/agent/browser_use_runner.py
import sys
import json
import asyncio
from browser_use import Agent
from langchain_anthropic import ChatAnthropic

def emit_progress(step: str, pct: int):
    print(json.dumps({"type": "progress", "step": step, "pct": pct}), flush=True)

def emit_result(success: bool, data: dict = None, error: dict = None):
    print(json.dumps({"type": "result", "success": success, "data": data, "error": error}), flush=True)

async def run_quote(input_data: dict):
    emit_progress("Initializing Browser Use", 5)

    llm = ChatAnthropic(model="claude-3-5-sonnet-20241022")

    task = f"""
    Navigate to {input_data['portalUrl']}
    Login with username: {input_data['credentials']['username']}
    and password: {input_data['credentials']['password']}

    Fill out insurance quote form with:
    {json.dumps(input_data['clientData'], indent=2)}

    Extract the quote premium and coverage details.
    """

    agent = Agent(task=task, llm=llm, headless=False)

    emit_progress("Running automation", 20)
    result = await agent.run()

    emit_progress("Extracting results", 90)
    # Parse result and emit
    emit_result(True, {"raw": str(result)})

if __name__ == "__main__":
    input_data = json.loads(sys.stdin.read())
    asyncio.run(run_quote(input_data))
```

### Error Mapping

| Python Error | QuoteError Code |
|--------------|-----------------|
| Login failed | CREDENTIALS_INVALID |
| Element not found | FORM_CHANGED |
| Timeout | TIMEOUT |
| Connection error | PORTAL_UNAVAILABLE |
| CAPTCHA detected | CAPTCHA_FAILED |

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/quoting/agent/browser-use-adapter.ts` | Create | TypeScript adapter |
| `src/lib/quoting/agent/browser_use_runner.py` | Create | Python runner script |
| `src/lib/quoting/agent/index.ts` | Modify | Export BrowserUseAdapter |
| `__tests__/lib/quoting/agent/browser-use-adapter.test.ts` | Create | Unit tests |

## Dependencies

- Story Q7-1: Browser Use Setup & POC (completed)
- QuoteAgent interface from Q6.2

## Estimation

- **Story Points:** 5
- **Complexity:** Medium-High
- **Risk:** Medium (subprocess communication)

## Definition of Done

- [ ] BrowserUseAdapter implements QuoteAgent
- [ ] Python runner script created
- [ ] Progress streaming works
- [ ] All error scenarios handled
- [ ] ≥90% test coverage
- [ ] Code review approved
