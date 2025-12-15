/**
 * Stagehand Adapter for Quote Automation
 * Epic Q8: Stagehand POC & Recipe Foundation
 * Story Q8-1: Stagehand Setup & Integration
 *
 * This adapter implements the QuoteAgent interface using Stagehand
 * for recipe-based automation. Key features:
 * - TypeScript-native (no Python subprocess)
 * - Native caching support for "discover once, replay fast" pattern
 * - Uses LOCAL mode by default (no Browserbase cloud required)
 *
 * @see https://docs.stagehand.dev/v3/references/stagehand
 */

import { Stagehand } from '@browserbasehq/stagehand';
import { z } from 'zod';
import type {
  QuoteAgent,
  QuoteExecutionParams,
  QuoteAgentResult,
  ProgressUpdate,
} from '@/types/quoting/agent';
import { QuoteAgentError, mapErrorToQuoteError } from './errors';

/**
 * Available models for Stagehand v3
 * @see https://docs.stagehand.dev/v3/references/stagehand
 */
export type StagehandModel =
  | 'claude-3-5-sonnet-latest'
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-7-sonnet-latest'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gemini-2.0-flash'
  | 'gemini-1.5-pro';

/**
 * Configuration for StagehandAdapter
 */
export interface StagehandAdapterConfig {
  /** Environment: LOCAL for local browser, BROWSERBASE for cloud */
  env?: 'LOCAL' | 'BROWSERBASE';

  /** LLM model to use (defaults to claude-3-5-sonnet-latest) */
  model?: StagehandModel;

  /** Enable verbose logging (0-2) */
  verbose?: 0 | 1 | 2;

  /** Run browser headless (default: false for dev, true for prod) */
  headless?: boolean;

  /** Enable self-healing on errors */
  selfHeal?: boolean;

  /** Directory for caching actions (for recipe replay) */
  cacheDir?: string;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<StagehandAdapterConfig> = {
  env: 'LOCAL',
  model: 'claude-3-5-sonnet-latest',
  verbose: 1,
  headless: process.env.NODE_ENV === 'production',
  selfHeal: true,
  cacheDir: '.stagehand-cache',
};

/**
 * StagehandAdapter implements QuoteAgent using Stagehand for browser automation.
 *
 * This is the primary adapter for recipe-based quote automation.
 * Uses AI to discover form navigation on first run, then replays fast.
 *
 * AC-Q8.1-4: Implements QuoteAgent interface (skeleton)
 */
export class StagehandAdapter implements QuoteAgent {
  private config: Required<StagehandAdapterConfig>;
  private stagehand: Stagehand | null = null;
  private cancelled = false;

  constructor(config: StagehandAdapterConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute a quote request using Stagehand
   *
   * @param params - Execution parameters including client data and callbacks
   * @returns Promise resolving to success/failure with data or error
   */
  async executeQuote(params: QuoteExecutionParams): Promise<QuoteAgentResult> {
    const { sessionId, carrierCode, onProgress } = params;
    this.cancelled = false;

    try {
      // Report initial progress
      onProgress({
        status: 'running',
        currentStep: 'Initializing Stagehand browser...',
        progressPct: 5,
        carrierCode,
      });

      // Initialize Stagehand
      await this.initStagehand();

      if (this.cancelled) {
        return this.createCancelledResult(carrierCode);
      }

      onProgress({
        status: 'running',
        currentStep: 'Browser initialized, starting automation...',
        progressPct: 10,
        carrierCode,
      });

      // TODO Q8-2+: Implement actual quote flow
      // - Login to carrier portal
      // - Fill form with client data
      // - Extract quote results

      // For now, return placeholder - full implementation in Q8-5
      return {
        success: false,
        error: {
          code: 'UNKNOWN',
          message:
            'StagehandAdapter executeQuote not yet implemented. See Q8-2 through Q8-5.',
          carrierCode,
          recoverable: false,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const quoteError = mapErrorToQuoteError(errorMessage, carrierCode);
      return {
        success: false,
        error: quoteError,
      };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Cancel the currently running task
   * Safe to call even if no task is running
   */
  async cancel(): Promise<void> {
    this.cancelled = true;
    await this.cleanup();
  }

  /**
   * Initialize Stagehand instance
   * AC-Q8.1-2: Local mode works without Browserbase cloud
   */
  private async initStagehand(): Promise<void> {
    if (this.stagehand) {
      return; // Already initialized
    }

    const stagehandConfig: ConstructorParameters<typeof Stagehand>[0] = {
      env: this.config.env,
      verbose: this.config.verbose,
      model: this.config.model,
      selfHeal: this.config.selfHeal,
      cacheDir: this.config.cacheDir, // Key for recipe-based automation
      localBrowserLaunchOptions:
        this.config.env === 'LOCAL'
          ? {
              headless: this.config.headless,
            }
          : undefined,
    };

    this.stagehand = new Stagehand(stagehandConfig);
    await this.stagehand.init();
  }

  /**
   * Cleanup Stagehand instance
   */
  private async cleanup(): Promise<void> {
    if (this.stagehand) {
      try {
        await this.stagehand.close();
      } catch {
        // Ignore cleanup errors
      }
      this.stagehand = null;
    }
  }

  /**
   * Create a cancelled result
   */
  private createCancelledResult(carrierCode: string): QuoteAgentResult {
    return {
      success: false,
      error: {
        code: 'UNKNOWN',
        message: 'Task was cancelled',
        carrierCode,
        recoverable: false,
      },
    };
  }

  // ==========================================================================
  // POC Methods - Demonstrate Stagehand primitives (AC-Q8.1-3)
  // ==========================================================================

  /**
   * Get the active page from Stagehand context
   * @throws Error if no page is available
   */
  private getActivePage() {
    if (!this.stagehand) throw new Error('Stagehand not initialized');
    const page = this.stagehand.context.activePage();
    if (!page) throw new Error('No active page');
    return page;
  }

  /**
   * POC: Navigate to a URL
   * @param url - URL to navigate to
   */
  async navigateTo(url: string): Promise<void> {
    await this.initStagehand();
    const page = this.getActivePage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  /**
   * POC: Perform an action using natural language
   * AC-Q8.1-3: Test act() primitive
   *
   * @param action - Natural language action description
   * @returns Whether the action was performed
   */
  async act(action: string): Promise<{ success: boolean; message: string }> {
    await this.initStagehand();
    if (!this.stagehand) throw new Error('Stagehand not initialized');

    const result = await this.stagehand.act(action);
    return {
      success: result.success,
      message: result.message || '',
    };
  }

  /**
   * POC: Extract data from the page
   * AC-Q8.1-3: Test extract() primitive
   *
   * @param instruction - What to extract
   * @param schema - Zod schema for extracted data
   * @returns Extracted data matching schema
   */
  async extract<T extends z.ZodTypeAny>(
    instruction: string,
    schema: T
  ): Promise<z.infer<T>> {
    await this.initStagehand();
    if (!this.stagehand) throw new Error('Stagehand not initialized');

    const result = await this.stagehand.extract(instruction, schema);
    return result;
  }

  /**
   * POC: Observe available interactions on page
   * AC-Q8.1-3: Test observe() primitive
   *
   * @param instruction - What to observe/find
   * @returns Array of observed elements/actions
   */
  async observe(
    instruction: string
  ): Promise<Array<{ selector: string; description: string }>> {
    await this.initStagehand();
    if (!this.stagehand) throw new Error('Stagehand not initialized');

    const result = await this.stagehand.observe(instruction);

    // Map to our format - Stagehand returns Action objects
    return result.map((item) => ({
      selector: item.selector || '',
      description: item.description || '',
    }));
  }

  /**
   * Get current page URL
   */
  async getCurrentUrl(): Promise<string> {
    const page = this.getActivePage();
    return page.url();
  }

  /**
   * Take a screenshot
   * @param path - File path to save screenshot
   */
  async screenshot(path: string): Promise<void> {
    const page = this.getActivePage();
    await page.screenshot({ path });
  }

  /**
   * Close the browser
   */
  async close(): Promise<void> {
    await this.cleanup();
  }
}

/**
 * Create a StagehandAdapter with default configuration
 */
export function createStagehandAdapter(
  config?: StagehandAdapterConfig
): StagehandAdapter {
  return new StagehandAdapter(config);
}
