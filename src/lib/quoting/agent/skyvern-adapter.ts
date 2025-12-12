/**
 * Skyvern Agent Adapter
 * Story Q6.2: Skyvern Agent Integration
 *
 * Implements QuoteAgent interface for Skyvern AI browser automation service.
 * Handles:
 * - Task creation and execution via Skyvern REST API
 * - Progress tracking via polling
 * - Result extraction from Skyvern responses
 * - Error handling with categorization
 * - Retry logic with exponential backoff
 *
 * AC-Q6.2-1: Implements QuoteAgent interface
 * AC-Q6.2-2: Initializes with env vars SKYVERN_API_KEY and SKYVERN_URL
 * AC-Q6.2-3: Maps QuoteClientData to Skyvern task requests
 * AC-Q6.2-4: Progress callbacks via polling
 * AC-Q6.2-5: Result extraction to QuoteResultData
 * AC-Q6.2-6: Error categorization to QuoteError codes
 * AC-Q6.2-7: Exponential backoff retry (2s, 4s, 8s, max 3 attempts)
 */

import type {
  QuoteAgent,
  QuoteExecutionParams,
  QuoteAgentResult,
  QuoteResultData,
  QuoteError,
  AgentExecutionStatus,
  ProgressUpdate,
} from '@/types/quoting/agent';
import type { QuoteClientData } from '@/types/quoting';
import { QuoteAgentError, mapSkyvernErrorToQuoteError } from './errors';
import { getCarrier } from '../carriers';

/**
 * Environment variable configuration
 * AC-Q6.2-2: Required env vars for Skyvern client initialization
 */
interface SkyvernConfig {
  apiKey: string;
  baseUrl: string;
}

/**
 * Skyvern API task request structure
 */
interface SkyvernTaskRequest {
  url: string;
  navigation_goal: string;
  data_extraction_goal: string;
  navigation_payload: Record<string, unknown>;
  max_steps_override?: number;
}

/**
 * Skyvern API task response structure
 */
interface SkyvernTaskResponse {
  task_id: string;
  status: SkyvernTaskStatus;
  steps?: SkyvernStep[];
  extracted_data?: Record<string, unknown>;
  screenshots?: string[];
  failure_reason?: string;
  error_code?: string;
}

/**
 * Skyvern task status values
 */
type SkyvernTaskStatus =
  | 'created'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'terminated'
  | 'timed_out';

/**
 * Skyvern step info for progress tracking
 */
interface SkyvernStep {
  step_id: string;
  status: string;
  output?: string;
}

/**
 * Retry configuration
 * AC-Q6.2-7: Exponential backoff (2s, 4s, 8s) with max 3 attempts
 */
const RETRY_CONFIG = {
  maxAttempts: 3,
  backoffMs: [2000, 4000, 8000],
  recoverableCodes: ['TIMEOUT', 'PORTAL_UNAVAILABLE'] as const,
};

/**
 * Polling configuration
 * Poll every 2 seconds for task status updates
 */
const POLLING_INTERVAL_MS = 2000;

/**
 * Validate and load Skyvern configuration from environment
 * AC-Q6.2-2: Throws clear error if env vars are missing
 */
function loadSkyvernConfig(): SkyvernConfig {
  const apiKey = process.env.SKYVERN_API_KEY;
  const baseUrl = process.env.SKYVERN_URL ?? 'https://api.skyvern.com/v1';

  if (!apiKey) {
    throw new Error(
      'SKYVERN_API_KEY environment variable is required. ' +
        'Get your API key from https://app.skyvern.com/settings/api-keys'
    );
  }

  // Validate URL format
  try {
    new URL(baseUrl);
  } catch {
    throw new Error(
      `SKYVERN_URL is invalid: "${baseUrl}". ` +
        'Must be a valid URL (e.g., https://api.skyvern.com/v1)'
    );
  }

  return { apiKey, baseUrl };
}

/**
 * SkyvernAdapter - QuoteAgent implementation for Skyvern AI
 * AC-Q6.2-1: Implements executeQuote() and cancel() methods
 */
export class SkyvernAdapter implements QuoteAgent {
  private config: SkyvernConfig;
  private currentTaskId: string | null = null;
  private aborted = false;

  /**
   * Initialize adapter with Skyvern configuration
   * AC-Q6.2-2: Validates env vars on construction
   */
  constructor() {
    this.config = loadSkyvernConfig();
  }

  /**
   * Execute a quote request via Skyvern
   * AC-Q6.2-1: Main interface method
   * AC-Q6.2-3: Maps client data to Skyvern task
   * AC-Q6.2-4: Calls onProgress during execution
   * AC-Q6.2-5: Extracts results on completion
   * AC-Q6.2-6: Handles errors with categorization
   * AC-Q6.2-7: Retries recoverable errors with backoff
   */
  async executeQuote(params: QuoteExecutionParams): Promise<QuoteAgentResult> {
    this.aborted = false;
    let lastError: QuoteError | null = null;
    const retryHistory: Array<{ attempt: number; error: string; waitMs: number }> =
      [];

    for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
      if (this.aborted) {
        return {
          success: false,
          error: {
            code: 'UNKNOWN',
            message: 'Task was cancelled',
            carrierCode: params.carrierCode,
            recoverable: false,
          },
        };
      }

      try {
        // Report starting status
        params.onProgress({
          status: attempt === 1 ? 'pending' : 'running',
          currentStep: attempt === 1 ? 'Initializing' : `Retry attempt ${attempt}`,
          progressPct: 0,
        });

        // Create and execute task
        const result = await this.executeTaskWithPolling(params);
        return result;
      } catch (error) {
        const quoteError =
          error instanceof QuoteAgentError
            ? error.toQuoteError()
            : mapSkyvernErrorToQuoteError(
                (error as Error).message,
                params.carrierCode
              );

        lastError = quoteError;

        // Check if error is recoverable and we have retries left
        const isRecoverable = RETRY_CONFIG.recoverableCodes.includes(
          quoteError.code as (typeof RETRY_CONFIG.recoverableCodes)[number]
        );

        if (isRecoverable && attempt < RETRY_CONFIG.maxAttempts) {
          const waitMs = RETRY_CONFIG.backoffMs[attempt - 1] ?? 8000;
          retryHistory.push({
            attempt,
            error: quoteError.message,
            waitMs,
          });

          console.log(
            `[SkyvernAdapter] Retry ${attempt}/${RETRY_CONFIG.maxAttempts} for ${params.carrierCode}: ` +
              `waiting ${waitMs}ms before next attempt. Error: ${quoteError.code}`
          );

          await this.delay(waitMs);
          continue;
        }

        // Non-recoverable error or max retries reached
        break;
      }
    }

    // Return final error with retry history
    return {
      success: false,
      error: lastError!,
      retryHistory:
        retryHistory.length > 0
          ? retryHistory.map((r) => `Attempt ${r.attempt}: ${r.error} (waited ${r.waitMs}ms)`).join('; ')
          : undefined,
    };
  }

  /**
   * Cancel the currently running task
   * AC-Q6.2-1: Part of QuoteAgent interface
   */
  async cancel(): Promise<void> {
    this.aborted = true;

    if (this.currentTaskId) {
      try {
        await this.deleteTask(this.currentTaskId);
        console.log(
          `[SkyvernAdapter] Task ${this.currentTaskId} cancelled successfully`
        );
      } catch (error) {
        console.error(
          `[SkyvernAdapter] Error cancelling task ${this.currentTaskId}:`,
          error
        );
      } finally {
        this.currentTaskId = null;
      }
    }
  }

  /**
   * Execute task and poll for completion
   * @private
   */
  private async executeTaskWithPolling(
    params: QuoteExecutionParams
  ): Promise<QuoteAgentResult> {
    // Create task
    const taskRequest = this.mapClientDataToTaskRequest(params);
    const createResponse = await this.createTask(taskRequest);
    this.currentTaskId = createResponse.task_id;

    params.onProgress({
      status: 'running',
      currentStep: 'Task created, starting automation',
      progressPct: 5,
    });

    // Poll for completion
    let taskResponse = createResponse;
    while (!this.isTaskComplete(taskResponse.status)) {
      if (this.aborted) {
        throw new QuoteAgentError('UNKNOWN', 'Task cancelled', params.carrierCode);
      }

      await this.delay(POLLING_INTERVAL_MS);
      taskResponse = await this.getTaskStatus(this.currentTaskId!);

      // Map status and call progress callback
      const progressUpdate = this.mapTaskToProgress(taskResponse, params.carrierCode);
      params.onProgress(progressUpdate);

      // Handle CAPTCHA if detected
      if (taskResponse.status === 'running' && this.detectCaptcha(taskResponse)) {
        const challenge = {
          type: 'image' as const,
          imageUrl: taskResponse.screenshots?.[0] ?? '',
          taskId: this.currentTaskId!,
        };

        // This will pause execution until user solves CAPTCHA
        await params.onCaptchaNeeded(challenge);
      }
    }

    this.currentTaskId = null;

    // Handle completion
    if (taskResponse.status === 'completed') {
      const resultData = this.extractQuoteResult(taskResponse, params.carrierCode);
      return {
        success: true,
        data: resultData,
        screenshots: taskResponse.screenshots,
      };
    }

    // Handle failure
    throw new QuoteAgentError(
      this.mapSkyvernStatusToErrorCode(taskResponse),
      taskResponse.failure_reason ?? 'Task failed without error message',
      params.carrierCode
    );
  }

  /**
   * Map client data to Skyvern task request
   * AC-Q6.2-3: Creates Skyvern-compatible task format
   */
  private mapClientDataToTaskRequest(
    params: QuoteExecutionParams
  ): SkyvernTaskRequest {
    const carrierInfo = getCarrier(params.carrierCode);
    const portalUrl = carrierInfo?.portalUrl ?? `https://${params.carrierCode}.com`;

    return {
      url: portalUrl,
      navigation_goal: this.buildNavigationGoal(params),
      data_extraction_goal:
        'Extract the quote premium amount, coverage details, and deductibles from the quote results page',
      navigation_payload: {
        credentials: {
          username: params.credentials.username,
          password: params.credentials.password,
        },
        client_data: this.sanitizeClientData(params.clientData),
        carrier_code: params.carrierCode,
        session_id: params.sessionId,
      },
      max_steps_override: 50,
    };
  }

  /**
   * Build navigation goal prompt for Skyvern
   */
  private buildNavigationGoal(params: QuoteExecutionParams): string {
    const clientName = [
      params.clientData.personal?.firstName,
      params.clientData.personal?.lastName,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      `Login to the carrier portal using the provided credentials. ` +
      `Navigate to the new quote section and fill out the insurance quote form ` +
      `for client "${clientName || 'the insured'}". ` +
      `Use the client data provided in navigation_payload.client_data to fill all required fields. ` +
      `Complete all form pages until you reach the quote results page showing the premium.`
    );
  }

  /**
   * Sanitize client data to remove sensitive fields from logging
   * @private
   */
  private sanitizeClientData(data: QuoteClientData): QuoteClientData {
    // Return a copy without modifying - credentials are separate
    return { ...data };
  }

  /**
   * Create a new task via Skyvern API
   * POST /v1/tasks
   */
  private async createTask(
    request: SkyvernTaskRequest
  ): Promise<SkyvernTaskResponse> {
    const response = await fetch(`${this.config.baseUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Skyvern API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get task status via Skyvern API
   * GET /v1/tasks/{task_id}
   */
  private async getTaskStatus(taskId: string): Promise<SkyvernTaskResponse> {
    const response = await fetch(`${this.config.baseUrl}/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'x-api-key': this.config.apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Skyvern API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Delete/cancel a task via Skyvern API
   * DELETE /v1/tasks/{task_id}
   */
  private async deleteTask(taskId: string): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        'x-api-key': this.config.apiKey,
      },
    });

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text();
      throw new Error(`Skyvern API error: ${response.status} - ${errorText}`);
    }
  }

  /**
   * Check if task has reached a terminal status
   */
  private isTaskComplete(status: SkyvernTaskStatus): boolean {
    return ['completed', 'failed', 'terminated', 'timed_out'].includes(status);
  }

  /**
   * Map Skyvern task response to progress update
   * AC-Q6.2-4: Progress tracking via onProgress callback
   */
  private mapTaskToProgress(
    task: SkyvernTaskResponse,
    carrierCode: string
  ): ProgressUpdate {
    const statusMap: Record<SkyvernTaskStatus, AgentExecutionStatus> = {
      created: 'pending',
      queued: 'pending',
      running: 'running',
      completed: 'completed',
      failed: 'failed',
      terminated: 'failed',
      timed_out: 'failed',
    };

    const stepCount = task.steps?.length ?? 0;
    const progressPct = Math.min(Math.floor((stepCount / 50) * 100), 95);
    const currentStep =
      task.steps?.[stepCount - 1]?.output ?? `Processing step ${stepCount}`;

    return {
      status: statusMap[task.status] ?? 'running',
      currentStep: currentStep.substring(0, 100), // Truncate long step descriptions
      progressPct: task.status === 'completed' ? 100 : progressPct,
      carrierCode,
    };
  }

  /**
   * Detect if CAPTCHA is present in task response
   */
  private detectCaptcha(task: SkyvernTaskResponse): boolean {
    // Check for CAPTCHA indicators in step outputs
    const lastStep = task.steps?.[task.steps.length - 1];
    if (lastStep?.output?.toLowerCase().includes('captcha')) {
      return true;
    }
    return false;
  }

  /**
   * Extract quote result from Skyvern task completion
   * AC-Q6.2-5: Parse premium, coverages, deductibles
   */
  private extractQuoteResult(
    task: SkyvernTaskResponse,
    carrierCode: string
  ): QuoteResultData {
    const extracted = task.extracted_data ?? {};

    // Parse premium - handle various formats
    const rawPremium =
      extracted.premium ??
      extracted.quote_amount ??
      extracted.total_premium ??
      null;
    const premium = this.parseCurrency(rawPremium);

    // Parse coverages
    const coverages: Record<string, string | number> = {};
    if (extracted.coverages && typeof extracted.coverages === 'object') {
      Object.assign(coverages, extracted.coverages);
    }

    // Parse deductibles
    const deductibles: Record<string, number> = {};
    if (extracted.deductibles && typeof extracted.deductibles === 'object') {
      for (const [key, value] of Object.entries(extracted.deductibles)) {
        const parsed = this.parseCurrency(value);
        if (parsed !== null) {
          deductibles[key] = parsed;
        }
      }
    }

    return {
      carrierCode,
      premiumAnnual: premium,
      premiumMonthly: premium ? Math.round(premium / 12) : null,
      coverages,
      deductibles,
      rawExtractedData: extracted,
      extractedAt: new Date().toISOString(),
    };
  }

  /**
   * Parse currency value from various formats
   * Handles "$1,234.56", "1234.56", "1234", etc.
   */
  private parseCurrency(value: unknown): number | null {
    if (value === null || value === undefined) return null;

    const str = String(value).replace(/[$,\s]/g, '');
    const num = parseFloat(str);

    return isNaN(num) ? null : num;
  }

  /**
   * Map Skyvern task status to QuoteError code
   * AC-Q6.2-6: Error categorization
   */
  private mapSkyvernStatusToErrorCode(
    task: SkyvernTaskResponse
  ): QuoteError['code'] {
    const errorCode = task.error_code?.toLowerCase() ?? '';
    const failureReason = task.failure_reason?.toLowerCase() ?? '';

    // Check for specific error patterns
    if (
      errorCode.includes('auth') ||
      failureReason.includes('login') ||
      failureReason.includes('credential')
    ) {
      return 'CREDENTIALS_INVALID';
    }

    if (errorCode.includes('captcha') || failureReason.includes('captcha')) {
      return 'CAPTCHA_FAILED';
    }

    if (
      errorCode.includes('unavailable') ||
      errorCode.includes('connection') ||
      failureReason.includes('site unavailable')
    ) {
      return 'PORTAL_UNAVAILABLE';
    }

    if (
      errorCode.includes('element') ||
      errorCode.includes('navigation') ||
      failureReason.includes('not found')
    ) {
      return 'FORM_CHANGED';
    }

    if (task.status === 'timed_out' || errorCode.includes('timeout')) {
      return 'TIMEOUT';
    }

    return 'UNKNOWN';
  }

  /**
   * Delay helper for polling and retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
