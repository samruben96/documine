/**
 * Quote Agent Module
 * Epic Q6: AI Infrastructure Foundation
 * Story Q6.2: Skyvern Agent Integration
 * Story Q7.2: Browser Use Agent Integration
 *
 * This module provides adapters for AI-powered browser automation agents
 * that execute quote requests on carrier portals.
 *
 * Architecture:
 * - QuoteAgent interface defines the contract for all agent adapters
 * - SkyvernAdapter implements QuoteAgent for Skyvern AI agent API
 * - BrowserUseAdapter implements QuoteAgent via Python subprocess
 * - AgentFactory (Q7.4) will select appropriate adapter based on carrier config
 */

export { SkyvernAdapter } from './skyvern-adapter';
export { BrowserUseAdapter, type BrowserUseAdapterOptions } from './browser-use-adapter';
export { QuoteAgentError, mapSkyvernErrorToQuoteError } from './errors';
export type {
  QuoteAgent,
  QuoteExecutionParams,
  QuoteAgentResult,
  QuoteResultData,
  QuoteError,
  AgentExecutionStatus,
  ProgressUpdate,
  CaptchaChallenge,
  DecryptedCredentials,
} from '@/types/quoting/agent';
