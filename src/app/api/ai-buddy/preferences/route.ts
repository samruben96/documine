/**
 * AI Buddy User Preferences API Route
 * Story 14.2: API Route Structure
 *
 * GET /api/ai-buddy/preferences - Get user preferences
 * PATCH /api/ai-buddy/preferences - Update user preferences
 * Stub implementation - actual preferences in Epic 18.
 */

import { notImplementedResponse } from '@/lib/ai-buddy';

/**
 * GET /api/ai-buddy/preferences
 * Get user's AI Buddy preferences
 *
 * Response:
 * {
 *   data: {
 *     preferences: UserPreferences;
 *   }
 * }
 */
export async function GET(): Promise<Response> {
  return notImplementedResponse();
}

/**
 * PATCH /api/ai-buddy/preferences
 * Update user's AI Buddy preferences (partial update)
 *
 * Request body (any fields):
 * {
 *   displayName?: string;
 *   role?: 'producer' | 'csr' | 'manager' | 'other';
 *   linesOfBusiness?: string[];
 *   favoriteCarriers?: string[];
 *   communicationStyle?: 'professional' | 'casual';
 *   agencyName?: string;
 *   licensedStates?: string[];
 *   onboardingCompleted?: boolean;
 * }
 *
 * Response:
 * {
 *   data: {
 *     preferences: UserPreferences;
 *   }
 * }
 */
export async function PATCH(): Promise<Response> {
  return notImplementedResponse();
}
