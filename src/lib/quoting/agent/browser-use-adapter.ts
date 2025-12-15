/**
 * Browser Use Agent Adapter
 * Story Q7.2: BrowserUseAdapter Implementation
 *
 * Implements QuoteAgent interface for Browser Use Python AI library.
 * Communicates via subprocess with JSON over stdin/stdout.
 *
 * AC-Q7.2.1: Implements QuoteAgent interface with executeQuote() and cancel()
 * AC-Q7.2.2: Spawns Python subprocess with correct arguments
 * AC-Q7.2.3: Sends JSON input via stdin
 * AC-Q7.2.4: Parses progress updates from stdout JSON lines
 * AC-Q7.2.5: Returns QuoteResult with agentType='browser-use'
 * AC-Q7.2.6: cancel() terminates subprocess with SIGTERM
 * AC-Q7.2.7: Error mapping to QuoteError codes
 * AC-Q7.2.8: 5-minute timeout
 */

import { spawn, type ChildProcess } from 'child_process';
import { join } from 'path';
import type {
  QuoteAgent,
  QuoteExecutionParams,
  QuoteAgentResult,
  QuoteResultData,
  QuoteError,
  ProgressUpdate,
  AgentExecutionStatus,
} from '@/types/quoting/agent';
import { getCarrier } from '../carriers';

/**
 * Configuration options for BrowserUseAdapter
 * AC-Q7.2.3: Constructor options for customization
 */
export interface BrowserUseAdapterOptions {
  /** Path to Python executable (default: 'python3') */
  pythonPath?: string;
  /** Path to browser_use_runner.py script (default: auto-detect) */
  scriptPath?: string;
  /** Timeout in milliseconds (default: 300000 = 5 minutes) */
  timeoutMs?: number;
  /** Run browser in headless mode (default: true) */
  headless?: boolean;
}

/**
 * Progress update from Python subprocess
 * AC-Q7.2.4: JSON line structure for progress
 */
interface PythonProgressOutput {
  type: 'progress';
  step: string;
  progress: number;
  timestamp?: string;
}

/**
 * Result output from Python subprocess
 * AC-Q7.2.5: JSON line structure for final result
 */
interface PythonResultOutput {
  type: 'result';
  success: boolean;
  data?: {
    carrierCode: string;
    premiumAnnual: number | null;
    premiumMonthly: number | null;
    coverages: Record<string, string | number>;
    deductibles: Record<string, number>;
    rawExtractedData?: Record<string, unknown>;
    extractedAt: string;
  };
  error?: string;
  timestamp?: string;
}

/**
 * Combined output type from Python subprocess
 */
type PythonOutput = PythonProgressOutput | PythonResultOutput;

/**
 * Input data sent to Python subprocess via stdin
 * AC-Q7.2.3: JSON structure with credentials and clientData
 */
interface PythonInput {
  credentials: {
    username: string;
    password: string;
    mfaCode?: string;
  };
  clientData: QuoteExecutionParams['clientData'];
  sessionId: string;
  carrierCode: string;
}

/**
 * Default timeout: 5 minutes
 * AC-Q7.2.8: Hard timeout for stuck processes
 */
const DEFAULT_TIMEOUT_MS = 300000;

/**
 * BrowserUseAdapter - QuoteAgent implementation for Browser Use
 * AC-Q7.2.1: Implements executeQuote() and cancel() methods
 */
export class BrowserUseAdapter implements QuoteAgent {
  private options: Required<BrowserUseAdapterOptions>;
  private currentProcess: ChildProcess | null = null;
  private timeoutHandle: NodeJS.Timeout | null = null;

  /**
   * Create a new BrowserUseAdapter
   * AC-Q7.2.3: Constructor with configuration options
   */
  constructor(options: BrowserUseAdapterOptions = {}) {
    this.options = {
      pythonPath: options.pythonPath ?? 'python3',
      scriptPath:
        options.scriptPath ??
        join(process.cwd(), 'src/lib/quoting/agent/browser_use_runner.py'),
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      headless: options.headless ?? true,
    };
  }

  /**
   * Execute a quote request via Browser Use Python subprocess
   * AC-Q7.2.1: Main interface method
   * AC-Q7.2.2: Spawns subprocess with correct arguments
   * AC-Q7.2.3: Sends JSON via stdin
   * AC-Q7.2.4: Progress callbacks via stdout parsing
   * AC-Q7.2.5: Returns QuoteAgentResult
   */
  async executeQuote(params: QuoteExecutionParams): Promise<QuoteAgentResult> {
    const startTime = Date.now();

    // Get carrier info for portal URL
    const carrierInfo = getCarrier(params.carrierCode);
    const portalUrl =
      carrierInfo?.portalUrl ?? `https://agents.${params.carrierCode}.com`;

    return new Promise<QuoteAgentResult>((resolve) => {
      // Build subprocess arguments
      // AC-Q7.2.2: --carrier and --portal-url arguments
      const args = [
        this.options.scriptPath,
        '--carrier',
        params.carrierCode,
        '--portal-url',
        portalUrl,
      ];

      // Add headless/visible flag
      if (!this.options.headless) {
        args.push('--visible');
      }

      // Spawn Python subprocess
      // AC-Q7.2.2: spawn with python3 and arguments
      const pythonProcess = spawn(this.options.pythonPath, args, {
        env: {
          ...process.env,
          // Pass through ANTHROPIC_API_KEY
          ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.currentProcess = pythonProcess;

      // Set up timeout handler
      // AC-Q7.2.8: 5-minute timeout
      this.timeoutHandle = setTimeout(() => {
        this.handleTimeout(params.carrierCode, resolve);
      }, this.options.timeoutMs);

      // Prepare input data
      // AC-Q7.2.3: JSON input with credentials and clientData
      const input: PythonInput = {
        credentials: {
          username: params.credentials.username,
          password: params.credentials.password,
          mfaCode: params.credentials.mfaCode,
        },
        clientData: params.clientData,
        sessionId: params.sessionId,
        carrierCode: params.carrierCode,
      };

      // Send input via stdin
      // AC-Q7.2.3: Write JSON and end stream
      pythonProcess.stdin?.write(JSON.stringify(input));
      pythonProcess.stdin?.end();

      // Track the final result
      let finalResult: QuoteAgentResult | null = null;
      let stdoutBuffer = '';
      let stderrBuffer = '';

      // Parse stdout line by line
      // AC-Q7.2.4: Parse progress and result JSON lines
      pythonProcess.stdout?.on('data', (data: Buffer) => {
        stdoutBuffer += data.toString();

        // Process complete lines
        const lines = stdoutBuffer.split('\n');
        stdoutBuffer = lines.pop() ?? ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const output = JSON.parse(line) as PythonOutput;
            this.handlePythonOutput(
              output,
              params,
              startTime,
              (result) => {
                finalResult = result;
              }
            );
          } catch {
            // Non-JSON output - log for debugging
            // AC-Q7.2.5: Log non-JSON output
            console.log(`[BrowserUseAdapter] stdout: ${line}`);
          }
        }
      });

      // Capture stderr for debugging
      pythonProcess.stderr?.on('data', (data: Buffer) => {
        stderrBuffer += data.toString();
        // Log stderr lines for debugging
        const lines = stderrBuffer.split('\n');
        stderrBuffer = lines.pop() ?? '';
        for (const line of lines) {
          if (line.trim()) {
            console.error(`[BrowserUseAdapter] stderr: ${line}`);
          }
        }
      });

      // Handle process close
      // AC-Q7.2.4: Resolve/reject based on exit code
      pythonProcess.on('close', (code) => {
        this.clearTimeout();
        this.currentProcess = null;

        // If we already have a result from stdout, use it
        if (finalResult) {
          // Add execution time
          // AC-Q7.2.5: Calculate executionTimeMs
          const executionTimeMs = Date.now() - startTime;
          if (finalResult.data) {
            (finalResult.data as QuoteResultData & { executionTimeMs?: number }).executionTimeMs = executionTimeMs;
            // AC-Q7.2.5: agentType='browser-use'
            (finalResult.data as QuoteResultData & { agentType?: string }).agentType = 'browser-use';
          }
          resolve(finalResult);
          return;
        }

        // No result from stdout - process failed without proper output
        // AC-Q7.2.5: Reject with error on non-zero exit
        if (code !== 0) {
          const error = this.mapError(
            stderrBuffer || `Process exited with code ${code}`,
            params.carrierCode
          );
          resolve({
            success: false,
            error,
          });
          return;
        }

        // Successful exit but no result - unexpected
        resolve({
          success: false,
          error: {
            code: 'UNKNOWN',
            message: 'Process completed but no result was returned',
            carrierCode: params.carrierCode,
            recoverable: false,
          },
        });
      });

      // Handle process error (e.g., spawn failure)
      pythonProcess.on('error', (err) => {
        this.clearTimeout();
        this.currentProcess = null;

        resolve({
          success: false,
          error: this.mapError(err.message, params.carrierCode),
        });
      });
    });
  }

  /**
   * Cancel the currently running subprocess
   * AC-Q7.2.6: SIGTERM and clear process reference
   */
  async cancel(): Promise<void> {
    this.clearTimeout();

    if (this.currentProcess) {
      // AC-Q7.2.6: Send SIGTERM
      this.currentProcess.kill('SIGTERM');
      // AC-Q7.2.6: Clear process reference
      this.currentProcess = null;
      console.log('[BrowserUseAdapter] Process cancelled');
    }
  }

  /**
   * Handle Python output (progress or result)
   * AC-Q7.2.4: Route progress to callback, capture result
   */
  private handlePythonOutput(
    output: PythonOutput,
    params: QuoteExecutionParams,
    startTime: number,
    setResult: (result: QuoteAgentResult) => void
  ): void {
    if (output.type === 'progress') {
      // AC-Q7.2.4: Progress update to onProgress callback
      const progressUpdate: ProgressUpdate = {
        status: 'running' as AgentExecutionStatus,
        currentStep: output.step,
        progressPct: output.progress,
        carrierCode: params.carrierCode,
      };
      params.onProgress(progressUpdate);
    } else if (output.type === 'result') {
      // AC-Q7.2.5: Final result
      if (output.success && output.data) {
        const executionTimeMs = Date.now() - startTime;
        const resultData: QuoteResultData & { agentType: string; executionTimeMs: number } = {
          carrierCode: output.data.carrierCode,
          premiumAnnual: output.data.premiumAnnual,
          premiumMonthly: output.data.premiumMonthly,
          coverages: output.data.coverages,
          deductibles: output.data.deductibles,
          rawExtractedData: output.data.rawExtractedData,
          extractedAt: output.data.extractedAt,
          // AC-Q7.2.5: agentType='browser-use'
          agentType: 'browser-use',
          executionTimeMs,
        };

        setResult({
          success: true,
          data: resultData,
        });

        // Final progress update
        params.onProgress({
          status: 'completed',
          currentStep: 'Quote extraction complete',
          progressPct: 100,
          carrierCode: params.carrierCode,
        });
      } else {
        // Failure result
        const error = this.mapError(
          output.error ?? 'Unknown error',
          params.carrierCode
        );
        setResult({
          success: false,
          error,
        });

        params.onProgress({
          status: 'failed',
          currentStep: error.message,
          progressPct: 0,
          carrierCode: params.carrierCode,
        });
      }
    }
  }

  /**
   * Handle timeout by killing process
   * AC-Q7.2.8: 5-minute timeout with SIGTERM
   */
  private handleTimeout(
    carrierCode: string,
    resolve: (result: QuoteAgentResult) => void
  ): void {
    console.log('[BrowserUseAdapter] Timeout - killing process');

    // AC-Q7.2.8: Kill process on timeout
    if (this.currentProcess) {
      this.currentProcess.kill('SIGTERM');
      // AC-Q7.2.8: Clear process reference
      this.currentProcess = null;
    }

    // AC-Q7.2.8: Reject with TIMEOUT error
    resolve({
      success: false,
      error: {
        code: 'TIMEOUT',
        message: 'Quote execution timed out after 5 minutes',
        carrierCode,
        recoverable: true,
        suggestedAction: 'Please try again. The carrier portal may be slow.',
      },
    });
  }

  /**
   * Clear the timeout handler
   * AC-Q7.2.8: Clear timeout on normal completion
   */
  private clearTimeout(): void {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }
  }

  /**
   * Map Python error message to QuoteError
   * AC-Q7.2.7: Error categorization with regex patterns
   */
  private mapError(errorMessage: string, carrierCode: string): QuoteError {
    const errorLower = errorMessage.toLowerCase();

    // AC-Q7.2.7: Login/credentials -> CREDENTIALS_INVALID (non-recoverable)
    if (
      errorLower.includes('login failed') ||
      errorLower.includes('credential') ||
      errorLower.includes('authentication') ||
      errorLower.includes('password') ||
      errorLower.includes('unauthorized')
    ) {
      return {
        code: 'CREDENTIALS_INVALID',
        message: 'Login to carrier portal failed. Please verify credentials.',
        carrierCode,
        recoverable: false,
        suggestedAction: 'Check your carrier portal username and password.',
      };
    }

    // AC-Q7.2.7: Captcha/challenge -> CAPTCHA_FAILED (non-recoverable)
    if (
      errorLower.includes('captcha') ||
      errorLower.includes('challenge') ||
      errorLower.includes('recaptcha') ||
      errorLower.includes('hcaptcha')
    ) {
      return {
        code: 'CAPTCHA_FAILED',
        message: 'CAPTCHA verification was required.',
        carrierCode,
        recoverable: false,
        suggestedAction: 'Please try again and complete the CAPTCHA when prompted.',
      };
    }

    // AC-Q7.2.7: Element not found/selector -> FORM_CHANGED (recoverable)
    if (
      errorLower.includes('element not found') ||
      errorLower.includes('selector') ||
      errorLower.includes('form changed') ||
      errorLower.includes('navigation failed')
    ) {
      return {
        code: 'FORM_CHANGED',
        message: 'Carrier portal form has changed.',
        carrierCode,
        recoverable: true,
        suggestedAction: 'The portal may have been updated. Please try again.',
      };
    }

    // AC-Q7.2.7: Timeout -> TIMEOUT (recoverable)
    if (
      errorLower.includes('timeout') ||
      errorLower.includes('timed out')
    ) {
      return {
        code: 'TIMEOUT',
        message: 'Request timed out.',
        carrierCode,
        recoverable: true,
        suggestedAction: 'Please try again.',
      };
    }

    // AC-Q7.2.7: Connection/network -> PORTAL_UNAVAILABLE (recoverable)
    if (
      errorLower.includes('connection') ||
      errorLower.includes('network') ||
      errorLower.includes('unavailable') ||
      errorLower.includes('503') ||
      errorLower.includes('502')
    ) {
      return {
        code: 'PORTAL_UNAVAILABLE',
        message: 'Carrier portal is temporarily unavailable.',
        carrierCode,
        recoverable: true,
        suggestedAction: 'Please try again later.',
      };
    }

    // AC-Q7.2.7: Default to UNKNOWN (non-recoverable)
    return {
      code: 'UNKNOWN',
      message: errorMessage || 'An unexpected error occurred.',
      carrierCode,
      recoverable: false,
      suggestedAction: 'Please try again or contact support.',
    };
  }
}
