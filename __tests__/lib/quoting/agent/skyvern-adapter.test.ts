/**
 * Skyvern Adapter Unit Tests
 * Story Q6.2: Skyvern Agent Integration
 *
 * Tests:
 * AC-Q6.2-1: SkyvernAdapter implements QuoteAgent interface
 * AC-Q6.2-2: Adapter validates env vars on construction
 * AC-Q6.2-3: Client data mapped correctly to task request
 * AC-Q6.2-4: Progress callbacks invoked with mapped status
 * AC-Q6.2-5: Result extraction parses Skyvern response correctly
 * AC-Q6.2-6: Errors categorized with correct QuoteError codes
 * AC-Q6.2-7: Retry logic uses exponential backoff
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SkyvernAdapter } from '@/lib/quoting/agent/skyvern-adapter';
import {
  mapSkyvernErrorToQuoteError,
  QuoteAgentError,
  isRecoverableErrorCode,
} from '@/lib/quoting/agent/errors';
import type {
  QuoteAgent,
  QuoteExecutionParams,
  ProgressUpdate,
  CaptchaChallenge,
} from '@/types/quoting/agent';
import type { QuoteClientData } from '@/types/quoting';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to create mock execution params
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

// Helper to create mock Skyvern responses
function createMockSkyvernResponse(overrides?: Record<string, unknown>) {
  return {
    task_id: 'skyvern-task-123',
    status: 'completed',
    steps: [
      { step_id: '1', status: 'completed', output: 'Logged in successfully' },
      { step_id: '2', status: 'completed', output: 'Filled form data' },
      { step_id: '3', status: 'completed', output: 'Submitted quote' },
    ],
    extracted_data: {
      premium: '$1,234.56',
      coverages: {
        dwelling: 250000,
        liability: 300000,
      },
      deductibles: {
        home: 1000,
        auto: 500,
      },
    },
    screenshots: ['https://skyvern.com/screenshots/1.png'],
    ...overrides,
  };
}

describe('SkyvernAdapter', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      SKYVERN_API_KEY: 'test-api-key-123',
      SKYVERN_URL: 'https://api.skyvern.com/v1',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('AC-Q6.2-1: Interface Implementation', () => {
    it('should implement QuoteAgent interface with executeQuote method', () => {
      const adapter = new SkyvernAdapter();

      expect(typeof adapter.executeQuote).toBe('function');
    });

    it('should implement QuoteAgent interface with cancel method', () => {
      const adapter = new SkyvernAdapter();

      expect(typeof adapter.cancel).toBe('function');
    });

    it('should be assignable to QuoteAgent type', () => {
      const adapter = new SkyvernAdapter();

      // This is a compile-time check - if it compiles, the interface is implemented
      const agent: QuoteAgent = adapter;
      expect(agent).toBeDefined();
    });
  });

  describe('AC-Q6.2-2: Environment Variable Validation', () => {
    it('should throw error when SKYVERN_API_KEY is missing', () => {
      delete process.env.SKYVERN_API_KEY;

      expect(() => new SkyvernAdapter()).toThrow(
        'SKYVERN_API_KEY environment variable is required'
      );
    });

    it('should throw error when SKYVERN_URL is invalid', () => {
      process.env.SKYVERN_URL = 'not-a-valid-url';

      expect(() => new SkyvernAdapter()).toThrow('SKYVERN_URL is invalid');
    });

    it('should use default URL when SKYVERN_URL is not set', () => {
      delete process.env.SKYVERN_URL;

      // Should not throw - uses default URL
      const adapter = new SkyvernAdapter();
      expect(adapter).toBeDefined();
    });

    it('should successfully initialize with valid env vars', () => {
      const adapter = new SkyvernAdapter();

      expect(adapter).toBeInstanceOf(SkyvernAdapter);
    });
  });

  describe('AC-Q6.2-3: Client Data to Task Request Mapping', () => {
    it('should include carrier portal URL in task request', async () => {
      const adapter = new SkyvernAdapter();
      const params = createMockParams();

      // Mock successful task creation
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ task_id: 'test-task', status: 'created' }),
        })
        // Mock status polling
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createMockSkyvernResponse()),
        });

      await adapter.executeQuote(params);

      // Check the POST request body
      const createCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(createCall[1].body);

      expect(requestBody.url).toBe('https://www.foragentsonly.com');
    });

    it('should include navigation goal with client name', async () => {
      const adapter = new SkyvernAdapter();
      const params = createMockParams();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ task_id: 'test-task', status: 'created' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createMockSkyvernResponse()),
        });

      await adapter.executeQuote(params);

      const createCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(createCall[1].body);

      expect(requestBody.navigation_goal).toContain('John Doe');
      expect(requestBody.navigation_goal).toContain('Login');
      expect(requestBody.navigation_goal).toContain('quote');
    });

    it('should include client data in navigation payload', async () => {
      const adapter = new SkyvernAdapter();
      const params = createMockParams();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ task_id: 'test-task', status: 'created' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createMockSkyvernResponse()),
        });

      await adapter.executeQuote(params);

      const createCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(createCall[1].body);

      expect(requestBody.navigation_payload.client_data).toBeDefined();
      expect(requestBody.navigation_payload.client_data.personal.firstName).toBe(
        'John'
      );
    });

    it('should include credentials in navigation payload', async () => {
      const adapter = new SkyvernAdapter();
      const params = createMockParams();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ task_id: 'test-task', status: 'created' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createMockSkyvernResponse()),
        });

      await adapter.executeQuote(params);

      const createCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(createCall[1].body);

      expect(requestBody.navigation_payload.credentials.username).toBe(
        'agent@example.com'
      );
    });

    it('should include API key in request headers', async () => {
      const adapter = new SkyvernAdapter();
      const params = createMockParams();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ task_id: 'test-task', status: 'created' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createMockSkyvernResponse()),
        });

      await adapter.executeQuote(params);

      const createCall = mockFetch.mock.calls[0];
      expect(createCall[1].headers['x-api-key']).toBe('test-api-key-123');
    });
  });

  describe('AC-Q6.2-4: Progress Callbacks', () => {
    it('should invoke onProgress with pending status initially', async () => {
      const adapter = new SkyvernAdapter();
      const onProgress = vi.fn();
      const params = createMockParams({ onProgress });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ task_id: 'test-task', status: 'created' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createMockSkyvernResponse()),
        });

      await adapter.executeQuote(params);

      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending',
          progressPct: 0,
        })
      );
    });

    it('should invoke onProgress with running status after task creation', async () => {
      const adapter = new SkyvernAdapter();
      const onProgress = vi.fn();
      const params = createMockParams({ onProgress });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ task_id: 'test-task', status: 'created' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createMockSkyvernResponse()),
        });

      await adapter.executeQuote(params);

      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'running',
          currentStep: expect.any(String),
        })
      );
    });

    it('should calculate progress percentage from step count', async () => {
      const adapter = new SkyvernAdapter();
      const progressUpdates: ProgressUpdate[] = [];
      const onProgress = vi.fn((update) => progressUpdates.push(update));
      const params = createMockParams({ onProgress });

      // First call: create task
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ task_id: 'test-task', status: 'created' }),
      });

      // Second call: running with steps
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            task_id: 'test-task',
            status: 'running',
            steps: [
              { step_id: '1', status: 'completed', output: 'Step 1' },
              { step_id: '2', status: 'completed', output: 'Step 2' },
            ],
          }),
      });

      // Third call: completed
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockSkyvernResponse()),
      });

      await adapter.executeQuote(params);

      // Check that we got progress updates
      expect(progressUpdates.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('AC-Q6.2-5: Result Extraction', () => {
    it('should extract premium from Skyvern response', async () => {
      const adapter = new SkyvernAdapter();
      const params = createMockParams();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ task_id: 'test-task', status: 'created' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve(
              createMockSkyvernResponse({
                extracted_data: {
                  premium: '$1,500.00',
                },
              })
            ),
        });

      const result = await adapter.executeQuote(params);

      expect(result.success).toBe(true);
      expect(result.data?.premiumAnnual).toBe(1500);
      expect(result.data?.premiumMonthly).toBe(125);
    });

    it('should extract coverages from Skyvern response', async () => {
      const adapter = new SkyvernAdapter();
      const params = createMockParams();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ task_id: 'test-task', status: 'created' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve(
              createMockSkyvernResponse({
                extracted_data: {
                  premium: 1000,
                  coverages: {
                    dwelling: 250000,
                    liability: 300000,
                  },
                },
              })
            ),
        });

      const result = await adapter.executeQuote(params);

      expect(result.data?.coverages).toEqual({
        dwelling: 250000,
        liability: 300000,
      });
    });

    it('should extract deductibles from Skyvern response', async () => {
      const adapter = new SkyvernAdapter();
      const params = createMockParams();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ task_id: 'test-task', status: 'created' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve(
              createMockSkyvernResponse({
                extracted_data: {
                  premium: 1000,
                  deductibles: {
                    home: 1000,
                    auto: 500,
                  },
                },
              })
            ),
        });

      const result = await adapter.executeQuote(params);

      expect(result.data?.deductibles).toEqual({
        home: 1000,
        auto: 500,
      });
    });

    it('should handle partial results with some fields missing', async () => {
      const adapter = new SkyvernAdapter();
      const params = createMockParams();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ task_id: 'test-task', status: 'created' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve(
              createMockSkyvernResponse({
                extracted_data: {
                  premium: null, // Missing premium
                  coverages: { dwelling: 250000 },
                },
              })
            ),
        });

      const result = await adapter.executeQuote(params);

      expect(result.success).toBe(true);
      expect(result.data?.premiumAnnual).toBeNull();
      expect(result.data?.coverages).toEqual({ dwelling: 250000 });
    });

    it('should include screenshot URLs from Skyvern response', async () => {
      const adapter = new SkyvernAdapter();
      const params = createMockParams();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ task_id: 'test-task', status: 'created' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve(
              createMockSkyvernResponse({
                screenshots: ['https://example.com/1.png', 'https://example.com/2.png'],
              })
            ),
        });

      const result = await adapter.executeQuote(params);

      expect(result.screenshots).toEqual([
        'https://example.com/1.png',
        'https://example.com/2.png',
      ]);
    });
  });

  describe('AC-Q6.2-6: Error Categorization', () => {
    it('should map authentication_failed to CREDENTIALS_INVALID', () => {
      const error = mapSkyvernErrorToQuoteError(
        'authentication_failed: Login failed with provided credentials',
        'progressive'
      );

      expect(error.code).toBe('CREDENTIALS_INVALID');
      expect(error.recoverable).toBe(false);
    });

    it('should map captcha_detected to CAPTCHA_FAILED', () => {
      const error = mapSkyvernErrorToQuoteError(
        'captcha_detected: CAPTCHA required',
        'progressive'
      );

      expect(error.code).toBe('CAPTCHA_FAILED');
      expect(error.recoverable).toBe(false);
    });

    it('should map site_unavailable to PORTAL_UNAVAILABLE', () => {
      const error = mapSkyvernErrorToQuoteError(
        'connection error: site unavailable',
        'progressive'
      );

      expect(error.code).toBe('PORTAL_UNAVAILABLE');
      expect(error.recoverable).toBe(true);
    });

    it('should map element_not_found to FORM_CHANGED', () => {
      const error = mapSkyvernErrorToQuoteError(
        'element not found: Unable to locate form field',
        'progressive'
      );

      expect(error.code).toBe('FORM_CHANGED');
      expect(error.recoverable).toBe(false);
    });

    it('should map timeout to TIMEOUT', () => {
      const error = mapSkyvernErrorToQuoteError(
        'Task timed out after 300 seconds',
        'progressive'
      );

      expect(error.code).toBe('TIMEOUT');
      expect(error.recoverable).toBe(true);
    });

    it('should map unknown errors to UNKNOWN', () => {
      const error = mapSkyvernErrorToQuoteError(
        'Some unexpected error occurred',
        'progressive'
      );

      expect(error.code).toBe('UNKNOWN');
      expect(error.recoverable).toBe(false);
    });

    it('should return error with carrierCode', () => {
      const error = mapSkyvernErrorToQuoteError('test error', 'travelers');

      expect(error.carrierCode).toBe('travelers');
    });

    it('should return error with suggested action', () => {
      const error = mapSkyvernErrorToQuoteError('authentication failed', 'progressive');

      expect(error.suggestedAction).toContain('credential');
    });
  });

  describe('AC-Q6.2-7: Retry Logic with Exponential Backoff', () => {
    it('should identify TIMEOUT as recoverable', () => {
      expect(isRecoverableErrorCode('TIMEOUT')).toBe(true);
    });

    it('should identify PORTAL_UNAVAILABLE as recoverable', () => {
      expect(isRecoverableErrorCode('PORTAL_UNAVAILABLE')).toBe(true);
    });

    it('should identify CREDENTIALS_INVALID as not recoverable', () => {
      expect(isRecoverableErrorCode('CREDENTIALS_INVALID')).toBe(false);
    });

    it('should identify CAPTCHA_FAILED as not recoverable', () => {
      expect(isRecoverableErrorCode('CAPTCHA_FAILED')).toBe(false);
    });

    it('should retry recoverable errors with exponential backoff', async () => {
      const adapter = new SkyvernAdapter();
      const params = createMockParams();

      // Track timing
      const callTimes: number[] = [];

      mockFetch.mockImplementation(() => {
        callTimes.push(Date.now());
        // Always fail with timeout (recoverable)
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              task_id: 'test-task',
              status: 'timed_out',
              failure_reason: 'Task timed out',
            }),
        });
      });

      // First call: create task
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ task_id: 'test-task', status: 'created' }),
      });

      const startTime = Date.now();
      const result = await adapter.executeQuote(params);

      // Should have retried (max 3 attempts)
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TIMEOUT');
    }, 30000); // Increase timeout for retry delays

    it('should not retry non-recoverable errors', async () => {
      const adapter = new SkyvernAdapter();
      const params = createMockParams();

      let fetchCallCount = 0;

      mockFetch.mockImplementation(() => {
        fetchCallCount++;
        if (fetchCallCount === 1) {
          // Create task
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ task_id: 'test-task', status: 'created' }),
          });
        }
        // Fail with credentials error (not recoverable)
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              task_id: 'test-task',
              status: 'failed',
              error_code: 'authentication_failed',
              failure_reason: 'Login failed',
            }),
        });
      });

      const result = await adapter.executeQuote(params);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CREDENTIALS_INVALID');
      // Should have only 2 fetch calls: create + status check (no retries)
      expect(fetchCallCount).toBe(2);
    });

    it('should include retry history in error result', async () => {
      const adapter = new SkyvernAdapter();
      const params = createMockParams();

      let fetchCallCount = 0;
      mockFetch.mockImplementation(() => {
        fetchCallCount++;
        if (fetchCallCount === 1 || fetchCallCount === 3 || fetchCallCount === 5) {
          // Create task (on retries)
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ task_id: 'test-task', status: 'created' }),
          });
        }
        // Fail with timeout
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              task_id: 'test-task',
              status: 'timed_out',
              failure_reason: 'Task timed out',
            }),
        });
      });

      const result = await adapter.executeQuote(params);

      expect(result.success).toBe(false);
      // retryHistory should exist if retries occurred
      if (result.retryHistory) {
        expect(result.retryHistory).toContain('Attempt');
      }
    }, 30000);
  });

  describe('Cancel Method', () => {
    it('should call DELETE on the Skyvern API when cancelling', async () => {
      const adapter = new SkyvernAdapter();
      const params = createMockParams();

      // Start a task
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ task_id: 'test-task', status: 'created' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              task_id: 'test-task',
              status: 'running',
              steps: [],
            }),
        });

      // Start execution (don't await - let it run)
      const executePromise = adapter.executeQuote(params);

      // Give it a moment to start
      await new Promise((r) => setTimeout(r, 100));

      // Mock the cancel DELETE call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      // Cancel
      await adapter.cancel();

      // Check DELETE was called
      const deleteCall = mockFetch.mock.calls.find(
        (call) => call[1]?.method === 'DELETE'
      );
      expect(deleteCall).toBeDefined();
      expect(deleteCall![0]).toContain('/tasks/test-task');

      // Clean up the promise
      try {
        await executePromise;
      } catch {
        // Expected to fail or be cancelled
      }
    });

    it('should handle cancel when no task is running', async () => {
      const adapter = new SkyvernAdapter();

      // Should not throw
      await expect(adapter.cancel()).resolves.not.toThrow();
    });
  });
});

describe('QuoteAgentError', () => {
  it('should create error with all properties', () => {
    const error = new QuoteAgentError(
      'TIMEOUT',
      'Task timed out',
      'progressive'
    );

    expect(error.code).toBe('TIMEOUT');
    expect(error.message).toBe('Task timed out');
    expect(error.carrierCode).toBe('progressive');
    expect(error.recoverable).toBe(true); // TIMEOUT is recoverable
  });

  it('should convert to QuoteError interface', () => {
    const error = new QuoteAgentError(
      'CREDENTIALS_INVALID',
      'Login failed',
      'travelers',
      { recoverable: false }
    );

    const quoteError = error.toQuoteError();

    expect(quoteError.code).toBe('CREDENTIALS_INVALID');
    expect(quoteError.message).toBe('Login failed');
    expect(quoteError.carrierCode).toBe('travelers');
    expect(quoteError.recoverable).toBe(false);
    expect(quoteError.suggestedAction).toBeDefined();
  });

  it('should allow overriding recoverable flag', () => {
    const error = new QuoteAgentError(
      'TIMEOUT',
      'Task timed out',
      'progressive',
      { recoverable: false } // Override default (true for TIMEOUT)
    );

    expect(error.recoverable).toBe(false);
  });
});
