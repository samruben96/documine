/**
 * Quote Agent Module
 * Epic Q8: Stagehand POC & Recipe Foundation
 *
 * This module provides the QuoteAgent interface and error handling utilities
 * for AI-powered browser automation agents that execute quote requests on
 * carrier portals.
 *
 * Architecture:
 * - QuoteAgent interface defines the contract for all agent adapters
 * - StagehandAdapter (Q8-1) will implement QuoteAgent for recipe-based automation
 * - Error utilities provide standardized error handling across adapters
 */

export { QuoteAgentError, mapErrorToQuoteError } from './errors';
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
