/**
 * Quote Agent Types
 * Story Q6.2: Skyvern Agent Integration
 *
 * Type definitions for AI-powered quote automation agents.
 * These types define the contract between orchestrators and agent adapters.
 *
 * AC-Q6.2-1: QuoteAgent interface definition
 * AC-Q6.2-3: QuoteExecutionParams for task requests
 * AC-Q6.2-4: ProgressUpdate for status callbacks
 * AC-Q6.2-5: QuoteResultData for extracted results
 * AC-Q6.2-6: QuoteError for error categorization
 */

import type { QuoteClientData } from '@/types/quoting';

/**
 * QuoteAgent interface
 * AC-Q6.2-1: Contract for all agent adapters (Skyvern, Claude Computer Use, etc.)
 *
 * Adapters must implement:
 * - executeQuote(): Execute automation and return results
 * - cancel(): Abort a running task
 */
export interface QuoteAgent {
  /**
   * Execute a quote request via AI automation
   * @param params - Execution parameters including client data and callbacks
   * @returns Promise resolving to success/failure with data or error
   */
  executeQuote(params: QuoteExecutionParams): Promise<QuoteAgentResult>;

  /**
   * Cancel the currently running task
   * Should be safe to call even if no task is running
   */
  cancel(): Promise<void>;
}

/**
 * Parameters for quote execution
 * AC-Q6.2-3: All data needed for task execution
 */
export interface QuoteExecutionParams {
  /** Quote session ID for tracking */
  sessionId: string;

  /** Carrier code (e.g., 'progressive', 'travelers') */
  carrierCode: string;

  /** Client data from quote session */
  clientData: QuoteClientData;

  /** Decrypted portal credentials */
  credentials: DecryptedCredentials;

  /** Optional recipe for cached navigation steps */
  recipe?: CarrierRecipe;

  /**
   * Progress callback invoked during execution
   * AC-Q6.2-4: Called with status updates as task progresses
   */
  onProgress: (update: ProgressUpdate) => void;

  /**
   * CAPTCHA callback when human intervention needed
   * Should return solved CAPTCHA value or throw to abort
   */
  onCaptchaNeeded: (challenge: CaptchaChallenge) => Promise<string>;
}

/**
 * Decrypted credentials for carrier portal access
 * NOTE: Never log these values
 */
export interface DecryptedCredentials {
  /** Portal username/email */
  username: string;

  /** Portal password */
  password: string;

  /** Optional MFA code if available */
  mfaCode?: string;
}

/**
 * Carrier recipe for cached navigation
 * Used by RecipeAdapter (Q6.4) for fast replay
 */
export interface CarrierRecipe {
  /** Recipe ID from database */
  id: string;

  /** Carrier this recipe applies to */
  carrierCode: string;

  /** Navigation steps to replay */
  steps: RecipeStep[];

  /** When recipe was last validated */
  validatedAt: string;

  /** Success rate of this recipe */
  successRate: number;
}

/**
 * Single step in a recipe
 */
export interface RecipeStep {
  /** Step sequence number */
  index: number;

  /** Action type */
  action: 'click' | 'type' | 'select' | 'wait' | 'navigate';

  /** Element selector */
  selector?: string;

  /** Value to type or select */
  value?: string;

  /** Data field to use for dynamic value */
  dataField?: string;
}

/**
 * Progress update sent via onProgress callback
 * AC-Q6.2-4: Status tracking during execution
 */
export interface ProgressUpdate {
  /** Current execution status */
  status: AgentExecutionStatus;

  /** Human-readable description of current step */
  currentStep: string;

  /** Progress percentage (0-100) */
  progressPct: number;

  /** Carrier code for this update (for multi-carrier jobs) */
  carrierCode?: string;
}

/**
 * Agent execution status values
 * Different from CarrierStatus in carriers/types.ts (which is for UI workflow tracking)
 * AC-Q6.2-4: Status values for AI execution lifecycle
 */
export type AgentExecutionStatus =
  | 'pending' // Task created, waiting to start
  | 'running' // Actively executing
  | 'captcha_needed' // Waiting for human CAPTCHA solve
  | 'completed' // Successfully finished
  | 'failed'; // Terminated with error

/**
 * CAPTCHA challenge requiring human intervention
 */
export interface CaptchaChallenge {
  /** Type of CAPTCHA */
  type: 'image' | 'recaptcha' | 'hcaptcha' | 'audio';

  /** URL to CAPTCHA image if applicable */
  imageUrl?: string;

  /** Site key for reCAPTCHA/hCaptcha */
  siteKey?: string;

  /** Task ID for submitting solution */
  taskId: string;
}

/**
 * Result of quote execution
 * AC-Q6.2-5: Success with data OR failure with error
 */
export interface QuoteAgentResult {
  /** Whether execution succeeded */
  success: boolean;

  /** Extracted quote data (present on success) */
  data?: QuoteResultData;

  /** Error details (present on failure) */
  error?: QuoteError;

  /** Screenshot URLs from execution */
  screenshots?: string[];

  /** Retry history if retries occurred */
  retryHistory?: string;
}

/**
 * Extracted quote result data
 * AC-Q6.2-5: Structured data from carrier quote
 */
export interface QuoteResultData {
  /** Carrier this result is from */
  carrierCode: string;

  /** Annual premium in dollars */
  premiumAnnual: number | null;

  /** Monthly premium in dollars (calculated if annual available) */
  premiumMonthly: number | null;

  /** Coverage details (varies by carrier) */
  coverages: Record<string, string | number>;

  /** Deductibles (varies by carrier) */
  deductibles: Record<string, number>;

  /** Raw extracted data for debugging */
  rawExtractedData?: Record<string, unknown>;

  /** When data was extracted */
  extractedAt: string;
}

/**
 * Quote error with categorization
 * AC-Q6.2-6: Error codes for consistent handling across adapters
 * AC-Q6.2-7: recoverable flag for retry logic
 */
export interface QuoteError {
  /**
   * Error code for categorization
   * - CREDENTIALS_INVALID: Login failed
   * - CAPTCHA_FAILED: CAPTCHA not solved
   * - PORTAL_UNAVAILABLE: Site down or unreachable
   * - FORM_CHANGED: Portal UI changed, recipe invalid
   * - TIMEOUT: Task exceeded time limit
   * - UNKNOWN: Unexpected error
   */
  code:
    | 'CREDENTIALS_INVALID'
    | 'CAPTCHA_FAILED'
    | 'PORTAL_UNAVAILABLE'
    | 'FORM_CHANGED'
    | 'TIMEOUT'
    | 'UNKNOWN';

  /** Human-readable error message */
  message: string;

  /** Carrier where error occurred */
  carrierCode: string;

  /**
   * Whether error is recoverable via retry
   * AC-Q6.2-7: Only TIMEOUT and PORTAL_UNAVAILABLE are recoverable
   */
  recoverable: boolean;

  /** Suggested user action */
  suggestedAction?: string;
}

/**
 * Skyvern-specific request type
 * Used internally by SkyvernAdapter
 */
export interface SkyvernTaskRequest {
  url: string;
  navigation_goal: string;
  data_extraction_goal: string;
  navigation_payload: Record<string, unknown>;
  max_steps_override?: number;
}

/**
 * Skyvern-specific response type
 * Used internally by SkyvernAdapter
 */
export interface SkyvernTaskResponse {
  task_id: string;
  status: string;
  steps?: Array<{
    step_id: string;
    status: string;
    output?: string;
  }>;
  extracted_data?: Record<string, unknown>;
  screenshots?: string[];
  failure_reason?: string;
  error_code?: string;
}
