/**
 * Browser Use Adapter Unit Tests
 * Story Q7.2: BrowserUseAdapter Implementation
 *
 * Tests:
 * AC-Q7.2.1: BrowserUseAdapter implements QuoteAgent interface
 * AC-Q7.2.2: Python subprocess spawned with correct arguments
 * AC-Q7.2.3: JSON input sent via stdin
 * AC-Q7.2.4: Progress updates parsed from stdout JSON lines
 * AC-Q7.2.5: Final result has agentType='browser-use'
 * AC-Q7.2.6: cancel() terminates subprocess with SIGTERM
 * AC-Q7.2.7: Error mapping to QuoteError codes
 * AC-Q7.2.8: 5-minute timeout terminates stuck processes
 * AC-Q7.2.9: ≥90% coverage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';
import { BrowserUseAdapter } from '@/lib/quoting/agent/browser-use-adapter';
import type {
  QuoteAgent,
  QuoteExecutionParams,
  ProgressUpdate,
} from '@/types/quoting/agent';
import type { QuoteClientData } from '@/types/quoting';

// Mock child_process
vi.mock('child_process', () => ({
  spawn: vi.fn(),
}));

// Get the mocked spawn function
import { spawn } from 'child_process';
const mockSpawn = vi.mocked(spawn);

// Mock carrier lookup
vi.mock('@/lib/quoting/carriers', () => ({
  getCarrier: vi.fn((code: string) => {
    if (code === 'progressive') {
      return { portalUrl: 'https://www.foragentsonly.com', code: 'progressive' };
    }
    if (code === 'travelers') {
      return { portalUrl: 'https://agents.travelers.com', code: 'travelers' };
    }
    return null;
  }),
}));

/**
 * Create a mock child process with EventEmitter patterns
 */
function createMockProcess() {
  const stdin = {
    write: vi.fn(),
    end: vi.fn(),
  };

  const stdout = new EventEmitter();
  const stderr = new EventEmitter();
  const processEvents = new EventEmitter();

  const mockProcess = {
    stdin,
    stdout,
    stderr,
    on: processEvents.on.bind(processEvents),
    emit: processEvents.emit.bind(processEvents),
    kill: vi.fn(),
    pid: 12345,
  };

  return {
    mockProcess,
    stdin,
    stdout,
    stderr,
    processEvents,
  };
}

/**
 * Helper to create mock execution params
 */
function createMockParams(
  overrides?: Partial<QuoteExecutionParams>
): QuoteExecutionParams {
  const mockClientData: QuoteClientData = {
    personal: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-123-4567',
      mailingAddress: {
        street: '123 Main St',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
      },
    },
    property: {
      address: {
        street: '123 Main St',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
      },
      yearBuilt: 2005,
      squareFootage: 2000,
    },
  };

  return {
    sessionId: 'test-session-123',
    carrierCode: 'progressive',
    clientData: mockClientData,
    credentials: {
      username: 'agent@example.com',
      password: 'secret123',
    },
    onProgress: vi.fn(),
    onCaptchaNeeded: vi.fn().mockResolvedValue('solved-captcha'),
    ...overrides,
  };
}

describe('BrowserUseAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Set required env vars
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.ANTHROPIC_API_KEY;
  });

  describe('AC-Q7.2.1: Interface Implementation', () => {
    it('should implement QuoteAgent interface with executeQuote method', () => {
      const adapter = new BrowserUseAdapter();

      expect(typeof adapter.executeQuote).toBe('function');
    });

    it('should implement QuoteAgent interface with cancel method', () => {
      const adapter = new BrowserUseAdapter();

      expect(typeof adapter.cancel).toBe('function');
    });

    it('should be assignable to QuoteAgent type', () => {
      const adapter = new BrowserUseAdapter();

      // Compile-time check - if it compiles, the interface is implemented
      const agent: QuoteAgent = adapter;
      expect(agent).toBeDefined();
    });

    it('should accept optional configuration options', () => {
      const adapter = new BrowserUseAdapter({
        pythonPath: '/usr/bin/python3',
        scriptPath: '/custom/path/runner.py',
        timeoutMs: 60000,
        headless: false,
      });

      expect(adapter).toBeDefined();
    });
  });

  describe('AC-Q7.2.2: Python Subprocess Spawning', () => {
    it('should spawn python3 process with script path', async () => {
      const { mockProcess, stdout, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const adapter = new BrowserUseAdapter();
      const params = createMockParams();

      // Start execution
      const executePromise = adapter.executeQuote(params);

      // Emit successful result
      stdout.emit(
        'data',
        JSON.stringify({
          type: 'result',
          success: true,
          data: {
            carrierCode: 'progressive',
            premiumAnnual: 1000,
            premiumMonthly: 83.33,
            coverages: {},
            deductibles: {},
            extractedAt: new Date().toISOString(),
          },
        }) + '\n'
      );

      // Close process successfully
      processEvents.emit('close', 0);

      await executePromise;

      // Verify spawn was called with correct arguments
      expect(mockSpawn).toHaveBeenCalledWith(
        'python3',
        expect.arrayContaining([
          expect.stringContaining('browser_use_runner.py'),
          '--carrier',
          'progressive',
          '--portal-url',
          'https://www.foragentsonly.com',
        ]),
        expect.objectContaining({
          env: expect.objectContaining({
            ANTHROPIC_API_KEY: 'test-api-key',
          }),
          stdio: ['pipe', 'pipe', 'pipe'],
        })
      );
    });

    it('should pass --carrier argument', async () => {
      const { mockProcess, stdout, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const adapter = new BrowserUseAdapter();
      const params = createMockParams({ carrierCode: 'travelers' });

      const executePromise = adapter.executeQuote(params);

      // Emit result and close
      stdout.emit(
        'data',
        JSON.stringify({ type: 'result', success: true, data: {} }) + '\n'
      );
      processEvents.emit('close', 0);

      await executePromise;

      const spawnArgs = mockSpawn.mock.calls[0][1] as string[];
      const carrierIndex = spawnArgs.indexOf('--carrier');
      expect(carrierIndex).toBeGreaterThan(-1);
      expect(spawnArgs[carrierIndex + 1]).toBe('travelers');
    });

    it('should pass --portal-url argument', async () => {
      const { mockProcess, stdout, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const adapter = new BrowserUseAdapter();
      const params = createMockParams({ carrierCode: 'progressive' });

      const executePromise = adapter.executeQuote(params);

      stdout.emit(
        'data',
        JSON.stringify({ type: 'result', success: true, data: {} }) + '\n'
      );
      processEvents.emit('close', 0);

      await executePromise;

      const spawnArgs = mockSpawn.mock.calls[0][1] as string[];
      const urlIndex = spawnArgs.indexOf('--portal-url');
      expect(urlIndex).toBeGreaterThan(-1);
      expect(spawnArgs[urlIndex + 1]).toBe('https://www.foragentsonly.com');
    });

    it('should pass --visible flag when headless is false', async () => {
      const { mockProcess, stdout, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const adapter = new BrowserUseAdapter({ headless: false });
      const params = createMockParams();

      const executePromise = adapter.executeQuote(params);

      stdout.emit(
        'data',
        JSON.stringify({ type: 'result', success: true, data: {} }) + '\n'
      );
      processEvents.emit('close', 0);

      await executePromise;

      const spawnArgs = mockSpawn.mock.calls[0][1] as string[];
      expect(spawnArgs).toContain('--visible');
    });

    it('should pass ANTHROPIC_API_KEY in environment', async () => {
      const { mockProcess, stdout, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const adapter = new BrowserUseAdapter();
      const params = createMockParams();

      const executePromise = adapter.executeQuote(params);

      stdout.emit(
        'data',
        JSON.stringify({ type: 'result', success: true, data: {} }) + '\n'
      );
      processEvents.emit('close', 0);

      await executePromise;

      const spawnOptions = mockSpawn.mock.calls[0][2] as { env: Record<string, string> };
      expect(spawnOptions.env.ANTHROPIC_API_KEY).toBe('test-api-key');
    });
  });

  describe('AC-Q7.2.3: JSON Input via stdin', () => {
    it('should write JSON to stdin with credentials', async () => {
      const { mockProcess, stdin, stdout, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const adapter = new BrowserUseAdapter();
      const params = createMockParams();

      const executePromise = adapter.executeQuote(params);

      stdout.emit(
        'data',
        JSON.stringify({ type: 'result', success: true, data: {} }) + '\n'
      );
      processEvents.emit('close', 0);

      await executePromise;

      // Verify stdin.write was called
      expect(stdin.write).toHaveBeenCalled();
      const stdinData = JSON.parse(stdin.write.mock.calls[0][0]);
      expect(stdinData.credentials.username).toBe('agent@example.com');
      expect(stdinData.credentials.password).toBe('secret123');
    });

    it('should write JSON to stdin with clientData', async () => {
      const { mockProcess, stdin, stdout, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const adapter = new BrowserUseAdapter();
      const params = createMockParams();

      const executePromise = adapter.executeQuote(params);

      stdout.emit(
        'data',
        JSON.stringify({ type: 'result', success: true, data: {} }) + '\n'
      );
      processEvents.emit('close', 0);

      await executePromise;

      const stdinData = JSON.parse(stdin.write.mock.calls[0][0]);
      expect(stdinData.clientData).toBeDefined();
      expect(stdinData.clientData.personal.firstName).toBe('John');
      expect(stdinData.clientData.personal.lastName).toBe('Doe');
    });

    it('should include sessionId and carrierCode in stdin', async () => {
      const { mockProcess, stdin, stdout, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const adapter = new BrowserUseAdapter();
      const params = createMockParams();

      const executePromise = adapter.executeQuote(params);

      stdout.emit(
        'data',
        JSON.stringify({ type: 'result', success: true, data: {} }) + '\n'
      );
      processEvents.emit('close', 0);

      await executePromise;

      const stdinData = JSON.parse(stdin.write.mock.calls[0][0]);
      expect(stdinData.sessionId).toBe('test-session-123');
      expect(stdinData.carrierCode).toBe('progressive');
    });

    it('should call stdin.end() after writing', async () => {
      const { mockProcess, stdin, stdout, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const adapter = new BrowserUseAdapter();
      const params = createMockParams();

      const executePromise = adapter.executeQuote(params);

      stdout.emit(
        'data',
        JSON.stringify({ type: 'result', success: true, data: {} }) + '\n'
      );
      processEvents.emit('close', 0);

      await executePromise;

      expect(stdin.end).toHaveBeenCalled();
    });
  });

  describe('AC-Q7.2.4: Progress Updates from stdout', () => {
    it('should parse progress JSON lines and call onProgress', async () => {
      const { mockProcess, stdout, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const onProgress = vi.fn();
      const adapter = new BrowserUseAdapter();
      const params = createMockParams({ onProgress });

      const executePromise = adapter.executeQuote(params);

      // Emit progress update
      stdout.emit(
        'data',
        JSON.stringify({
          type: 'progress',
          step: 'Logging into portal',
          progress: 25,
        }) + '\n'
      );

      // Emit result
      stdout.emit(
        'data',
        JSON.stringify({ type: 'result', success: true, data: {} }) + '\n'
      );
      processEvents.emit('close', 0);

      await executePromise;

      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'running',
          currentStep: 'Logging into portal',
          progressPct: 25,
          carrierCode: 'progressive',
        })
      );
    });

    it('should handle multiple progress updates', async () => {
      const { mockProcess, stdout, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const progressUpdates: ProgressUpdate[] = [];
      const onProgress = vi.fn((update) => progressUpdates.push(update));
      const adapter = new BrowserUseAdapter();
      const params = createMockParams({ onProgress });

      const executePromise = adapter.executeQuote(params);

      // Emit multiple progress updates
      stdout.emit(
        'data',
        JSON.stringify({ type: 'progress', step: 'Step 1', progress: 10 }) + '\n' +
        JSON.stringify({ type: 'progress', step: 'Step 2', progress: 30 }) + '\n' +
        JSON.stringify({ type: 'progress', step: 'Step 3', progress: 60 }) + '\n'
      );

      // Emit result
      stdout.emit(
        'data',
        JSON.stringify({ type: 'result', success: true, data: {} }) + '\n'
      );
      processEvents.emit('close', 0);

      await executePromise;

      // Should have received multiple progress updates
      expect(progressUpdates.length).toBeGreaterThanOrEqual(3);
      expect(progressUpdates[0].currentStep).toBe('Step 1');
      expect(progressUpdates[1].currentStep).toBe('Step 2');
      expect(progressUpdates[2].currentStep).toBe('Step 3');
    });

    it('should handle partial line buffering', async () => {
      const { mockProcess, stdout, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const onProgress = vi.fn();
      const adapter = new BrowserUseAdapter();
      const params = createMockParams({ onProgress });

      const executePromise = adapter.executeQuote(params);

      // Emit data in chunks (partial JSON line)
      const jsonLine = JSON.stringify({ type: 'progress', step: 'Buffered', progress: 50 });
      stdout.emit('data', jsonLine.substring(0, 20));
      stdout.emit('data', jsonLine.substring(20) + '\n');

      // Emit result
      stdout.emit(
        'data',
        JSON.stringify({ type: 'result', success: true, data: {} }) + '\n'
      );
      processEvents.emit('close', 0);

      await executePromise;

      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          currentStep: 'Buffered',
        })
      );
    });

    it('should log non-JSON output for debugging', async () => {
      const { mockProcess, stdout, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const adapter = new BrowserUseAdapter();
      const params = createMockParams();

      const executePromise = adapter.executeQuote(params);

      // Emit non-JSON output
      stdout.emit('data', 'Some debug output from Python\n');

      // Emit result
      stdout.emit(
        'data',
        JSON.stringify({ type: 'result', success: true, data: {} }) + '\n'
      );
      processEvents.emit('close', 0);

      await executePromise;

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[BrowserUseAdapter] stdout: Some debug output from Python')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('AC-Q7.2.5: Result with agentType="browser-use"', () => {
    it('should return QuoteAgentResult with success on successful execution', async () => {
      const { mockProcess, stdout, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const adapter = new BrowserUseAdapter();
      const params = createMockParams();

      const executePromise = adapter.executeQuote(params);

      stdout.emit(
        'data',
        JSON.stringify({
          type: 'result',
          success: true,
          data: {
            carrierCode: 'progressive',
            premiumAnnual: 1500,
            premiumMonthly: 125,
            coverages: { dwelling: 250000 },
            deductibles: { home: 1000 },
            extractedAt: '2024-01-01T00:00:00Z',
          },
        }) + '\n'
      );
      processEvents.emit('close', 0);

      const result = await executePromise;

      expect(result.success).toBe(true);
      expect(result.data?.premiumAnnual).toBe(1500);
      expect(result.data?.premiumMonthly).toBe(125);
    });

    it('should include agentType="browser-use" in result data', async () => {
      const { mockProcess, stdout, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const adapter = new BrowserUseAdapter();
      const params = createMockParams();

      const executePromise = adapter.executeQuote(params);

      stdout.emit(
        'data',
        JSON.stringify({
          type: 'result',
          success: true,
          data: {
            carrierCode: 'progressive',
            premiumAnnual: 1000,
            premiumMonthly: null,
            coverages: {},
            deductibles: {},
            extractedAt: new Date().toISOString(),
          },
        }) + '\n'
      );
      processEvents.emit('close', 0);

      const result = await executePromise;

      expect((result.data as Record<string, unknown>).agentType).toBe('browser-use');
    });

    it('should calculate executionTimeMs from start to completion', async () => {
      const { mockProcess, stdout, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const adapter = new BrowserUseAdapter();
      const params = createMockParams();

      const executePromise = adapter.executeQuote(params);

      // Advance time by 5 seconds
      vi.advanceTimersByTime(5000);

      stdout.emit(
        'data',
        JSON.stringify({
          type: 'result',
          success: true,
          data: {
            carrierCode: 'progressive',
            premiumAnnual: 1000,
            premiumMonthly: null,
            coverages: {},
            deductibles: {},
            extractedAt: new Date().toISOString(),
          },
        }) + '\n'
      );
      processEvents.emit('close', 0);

      const result = await executePromise;

      expect((result.data as Record<string, unknown>).executionTimeMs).toBeGreaterThanOrEqual(5000);
    });

    it('should resolve promise on exit code 0', async () => {
      const { mockProcess, stdout, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const adapter = new BrowserUseAdapter();
      const params = createMockParams();

      const executePromise = adapter.executeQuote(params);

      stdout.emit(
        'data',
        JSON.stringify({ type: 'result', success: true, data: {} }) + '\n'
      );
      processEvents.emit('close', 0);

      const result = await executePromise;

      expect(result.success).toBe(true);
    });

    it('should return error result on non-zero exit code', async () => {
      const { mockProcess, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const adapter = new BrowserUseAdapter();
      const params = createMockParams();

      const executePromise = adapter.executeQuote(params);

      processEvents.emit('close', 1);

      const result = await executePromise;

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('AC-Q7.2.6: Cancellation with SIGTERM', () => {
    it('should terminate subprocess with SIGTERM when cancel() is called', async () => {
      const { mockProcess, stdout, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const adapter = new BrowserUseAdapter();
      const params = createMockParams();

      // Start execution but don't await
      const executePromise = adapter.executeQuote(params);

      // Call cancel
      await adapter.cancel();

      // Verify SIGTERM was sent
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');

      // Clean up
      processEvents.emit('close', 0);
      await executePromise;
    });

    it('should clear process reference after cancel', async () => {
      const { mockProcess, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const adapter = new BrowserUseAdapter();
      const params = createMockParams();

      const executePromise = adapter.executeQuote(params);

      await adapter.cancel();

      // Calling cancel again should not throw (process reference is null)
      await expect(adapter.cancel()).resolves.not.toThrow();

      // Verify kill was only called once
      expect(mockProcess.kill).toHaveBeenCalledTimes(1);

      processEvents.emit('close', 0);
      await executePromise;
    });

    it('should handle cancel when no process is running', async () => {
      const adapter = new BrowserUseAdapter();

      // Should not throw
      await expect(adapter.cancel()).resolves.not.toThrow();
    });
  });

  describe('AC-Q7.2.7: Error Mapping', () => {
    it('should map login/credentials errors to CREDENTIALS_INVALID', async () => {
      const { mockProcess, stdout, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const adapter = new BrowserUseAdapter();
      const params = createMockParams();

      const executePromise = adapter.executeQuote(params);

      stdout.emit(
        'data',
        JSON.stringify({
          type: 'result',
          success: false,
          error: 'login failed: Invalid credentials',
        }) + '\n'
      );
      processEvents.emit('close', 0);

      const result = await executePromise;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CREDENTIALS_INVALID');
      expect(result.error?.recoverable).toBe(false);
    });

    it('should map captcha/challenge errors to CAPTCHA_FAILED', async () => {
      const { mockProcess, stdout, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const adapter = new BrowserUseAdapter();
      const params = createMockParams();

      const executePromise = adapter.executeQuote(params);

      stdout.emit(
        'data',
        JSON.stringify({
          type: 'result',
          success: false,
          error: 'captcha detected: reCAPTCHA required',
        }) + '\n'
      );
      processEvents.emit('close', 0);

      const result = await executePromise;

      expect(result.error?.code).toBe('CAPTCHA_FAILED');
      expect(result.error?.recoverable).toBe(false);
    });

    it('should map element not found errors to FORM_CHANGED', async () => {
      const { mockProcess, stdout, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const adapter = new BrowserUseAdapter();
      const params = createMockParams();

      const executePromise = adapter.executeQuote(params);

      stdout.emit(
        'data',
        JSON.stringify({
          type: 'result',
          success: false,
          error: 'element not found: Could not locate submit button',
        }) + '\n'
      );
      processEvents.emit('close', 0);

      const result = await executePromise;

      expect(result.error?.code).toBe('FORM_CHANGED');
      expect(result.error?.recoverable).toBe(true);
    });

    it('should map timeout errors to TIMEOUT', async () => {
      const { mockProcess, stdout, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const adapter = new BrowserUseAdapter();
      const params = createMockParams();

      const executePromise = adapter.executeQuote(params);

      stdout.emit(
        'data',
        JSON.stringify({
          type: 'result',
          success: false,
          error: 'timeout: Page load timed out',
        }) + '\n'
      );
      processEvents.emit('close', 0);

      const result = await executePromise;

      expect(result.error?.code).toBe('TIMEOUT');
      expect(result.error?.recoverable).toBe(true);
    });

    it('should map connection errors to PORTAL_UNAVAILABLE', async () => {
      const { mockProcess, stdout, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const adapter = new BrowserUseAdapter();
      const params = createMockParams();

      const executePromise = adapter.executeQuote(params);

      stdout.emit(
        'data',
        JSON.stringify({
          type: 'result',
          success: false,
          error: 'connection failed: Network error',
        }) + '\n'
      );
      processEvents.emit('close', 0);

      const result = await executePromise;

      expect(result.error?.code).toBe('PORTAL_UNAVAILABLE');
      expect(result.error?.recoverable).toBe(true);
    });

    it('should map unknown errors to UNKNOWN', async () => {
      const { mockProcess, stdout, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const adapter = new BrowserUseAdapter();
      const params = createMockParams();

      const executePromise = adapter.executeQuote(params);

      stdout.emit(
        'data',
        JSON.stringify({
          type: 'result',
          success: false,
          error: 'Some unexpected error occurred',
        }) + '\n'
      );
      processEvents.emit('close', 0);

      const result = await executePromise;

      expect(result.error?.code).toBe('UNKNOWN');
      expect(result.error?.recoverable).toBe(false);
    });

    it('should include carrierCode in error', async () => {
      const { mockProcess, stdout, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const adapter = new BrowserUseAdapter();
      const params = createMockParams({ carrierCode: 'travelers' });

      const executePromise = adapter.executeQuote(params);

      stdout.emit(
        'data',
        JSON.stringify({
          type: 'result',
          success: false,
          error: 'Test error',
        }) + '\n'
      );
      processEvents.emit('close', 0);

      const result = await executePromise;

      expect(result.error?.carrierCode).toBe('travelers');
    });
  });

  describe('AC-Q7.2.8: 5-Minute Timeout', () => {
    it('should terminate process after 5 minutes (300000ms)', async () => {
      const { mockProcess, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const adapter = new BrowserUseAdapter();
      const params = createMockParams();

      const executePromise = adapter.executeQuote(params);

      // Advance time by 5 minutes
      vi.advanceTimersByTime(300000);

      // Process should be killed and promise should resolve
      processEvents.emit('close', 0);

      const result = await executePromise;

      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TIMEOUT');
    });

    it('should return TIMEOUT error code on timeout', async () => {
      const { mockProcess, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const adapter = new BrowserUseAdapter();
      const params = createMockParams();

      const executePromise = adapter.executeQuote(params);

      // Advance time past timeout
      vi.advanceTimersByTime(300001);

      processEvents.emit('close', 0);

      const result = await executePromise;

      expect(result.error?.code).toBe('TIMEOUT');
      expect(result.error?.recoverable).toBe(true);
    });

    it('should clear timeout on successful completion', async () => {
      const { mockProcess, stdout, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const adapter = new BrowserUseAdapter();
      const params = createMockParams();

      const executePromise = adapter.executeQuote(params);

      // Emit result before timeout
      stdout.emit(
        'data',
        JSON.stringify({ type: 'result', success: true, data: {} }) + '\n'
      );
      processEvents.emit('close', 0);

      await executePromise;

      // Advance past timeout - should not affect anything
      vi.advanceTimersByTime(400000);

      // Process should not have been killed (only close event cleanup)
      expect(mockProcess.kill).not.toHaveBeenCalled();
    });

    it('should clear process reference on timeout', async () => {
      const { mockProcess, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const adapter = new BrowserUseAdapter();
      const params = createMockParams();

      const executePromise = adapter.executeQuote(params);

      // Advance time past timeout
      vi.advanceTimersByTime(300001);

      processEvents.emit('close', 0);

      await executePromise;

      // Calling cancel should not try to kill process again
      await adapter.cancel();
      expect(mockProcess.kill).toHaveBeenCalledTimes(1);
    });

    it('should use custom timeout when specified', async () => {
      const { mockProcess, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      // Use short timeout
      const adapter = new BrowserUseAdapter({ timeoutMs: 60000 });
      const params = createMockParams();

      const executePromise = adapter.executeQuote(params);

      // Advance time by 60 seconds
      vi.advanceTimersByTime(60000);

      processEvents.emit('close', 0);

      const result = await executePromise;

      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
      expect(result.error?.code).toBe('TIMEOUT');
    });
  });

  describe('Process Error Handling', () => {
    it('should handle spawn error', async () => {
      const { mockProcess, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const adapter = new BrowserUseAdapter();
      const params = createMockParams();

      const executePromise = adapter.executeQuote(params);

      // Emit spawn error
      processEvents.emit('error', new Error('ENOENT: python3 not found'));

      const result = await executePromise;

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle process exit with no result', async () => {
      const { mockProcess, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const adapter = new BrowserUseAdapter();
      const params = createMockParams();

      const executePromise = adapter.executeQuote(params);

      // Close without any output
      processEvents.emit('close', 0);

      const result = await executePromise;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN');
    });

    it('should capture stderr for error details', async () => {
      const { mockProcess, stderr, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const adapter = new BrowserUseAdapter();
      const params = createMockParams();

      const executePromise = adapter.executeQuote(params);

      // Emit stderr
      stderr.emit('data', 'Python error traceback\n');
      processEvents.emit('close', 1);

      await executePromise;

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('stderr')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Progress Status Mapping', () => {
    it('should map progress to completed on success result', async () => {
      const { mockProcess, stdout, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const progressUpdates: ProgressUpdate[] = [];
      const onProgress = vi.fn((update) => progressUpdates.push(update));
      const adapter = new BrowserUseAdapter();
      const params = createMockParams({ onProgress });

      const executePromise = adapter.executeQuote(params);

      stdout.emit(
        'data',
        JSON.stringify({
          type: 'result',
          success: true,
          data: { carrierCode: 'progressive', premiumAnnual: 1000 },
        }) + '\n'
      );
      processEvents.emit('close', 0);

      await executePromise;

      const lastUpdate = progressUpdates[progressUpdates.length - 1];
      expect(lastUpdate.status).toBe('completed');
      expect(lastUpdate.progressPct).toBe(100);
    });

    it('should map progress to failed on error result', async () => {
      const { mockProcess, stdout, processEvents } = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess as ReturnType<typeof spawn>);

      const progressUpdates: ProgressUpdate[] = [];
      const onProgress = vi.fn((update) => progressUpdates.push(update));
      const adapter = new BrowserUseAdapter();
      const params = createMockParams({ onProgress });

      const executePromise = adapter.executeQuote(params);

      stdout.emit(
        'data',
        JSON.stringify({
          type: 'result',
          success: false,
          error: 'Some error',
        }) + '\n'
      );
      processEvents.emit('close', 0);

      await executePromise;

      const lastUpdate = progressUpdates[progressUpdates.length - 1];
      expect(lastUpdate.status).toBe('failed');
    });
  });
});
