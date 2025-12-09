/**
 * Personalized Greeting Generation
 * Story 18.1: Onboarding Flow & Guided Start
 *
 * Generates personalized greetings for AI Buddy based on user preferences.
 *
 * AC-18.1.6: Personalized greeting includes name and LOB reference
 * AC-18.1.7: LOB-specific suggestions relevant to selected lines of business
 */

import type { UserPreferences } from '@/types/ai-buddy';

/**
 * LOB-specific suggestion templates
 * AC-18.1.7: Suggestions relevant to selected lines of business
 */
const LOB_SUGGESTIONS: Record<string, string[]> = {
  'Personal Auto': [
    'Explain coverage limits and deductibles',
    'Compare auto policy endorsements',
    'Draft a renewal reminder email for auto policies',
  ],
  'Homeowners': [
    'Explain dwelling vs personal property coverage',
    'Review common homeowners exclusions',
    'Draft a coverage checklist for new homeowners',
  ],
  'Commercial Auto': [
    'Explain hired and non-owned auto coverage',
    'Review fleet coverage requirements',
    'Compare commercial auto liability limits',
  ],
  'Commercial Property': [
    'Review business interruption coverage',
    'Explain coinsurance requirements',
    'Draft a commercial property coverage checklist',
  ],
  'General Liability': [
    'Explain occurrence vs claims-made policies',
    'Review CGL exclusions',
    'Compare per-occurrence and aggregate limits',
  ],
  'Workers Compensation': [
    'Explain experience modification rates',
    'Review classification codes',
    'Compare workers comp coverage across states',
  ],
  'Professional Liability': [
    'Explain E&O coverage triggers',
    'Review professional liability exclusions',
    'Compare claims-made vs occurrence policies',
  ],
  'Umbrella/Excess': [
    'Explain underlying coverage requirements',
    'Review drop-down coverage provisions',
    'Compare umbrella vs excess liability',
  ],
  'Life Insurance': [
    'Explain term vs whole life benefits',
    'Review beneficiary designation requirements',
    'Compare policy conversion options',
  ],
  'Health Insurance': [
    'Explain network coverage differences',
    'Review prescription drug tiers',
    'Compare HSA-eligible plan options',
  ],
};

/**
 * Generic suggestions when no LOB is specified
 */
const GENERIC_SUGGESTIONS: string[] = [
  'Help me understand a policy document',
  'Explain common insurance terms',
  'Draft a client communication',
  'Compare coverage options',
];

/**
 * Get suggestions based on selected line of business
 *
 * @param lob - The line of business to get suggestions for
 * @returns Array of suggestion strings
 */
export function getSuggestionsForLOB(lob: string): string[] {
  return LOB_SUGGESTIONS[lob] || GENERIC_SUGGESTIONS;
}

/**
 * Generate a personalized greeting for the user
 *
 * AC-18.1.6: Greeting includes name and LOB reference
 *
 * @param preferences - User preferences from onboarding
 * @returns Greeting message with personalization
 */
export function generatePersonalizedGreeting(
  preferences: UserPreferences | null | undefined
): PersonalizedGreeting {
  // Default generic greeting
  if (!preferences) {
    return {
      message: "Hi there! I'm AI Buddy, your insurance knowledge assistant. How can I help you today?",
      suggestions: GENERIC_SUGGESTIONS,
    };
  }

  // Check if user completed onboarding
  if (!preferences.onboardingCompleted) {
    return {
      message: "Hi there! I'm AI Buddy, your insurance knowledge assistant. How can I help you today?",
      suggestions: GENERIC_SUGGESTIONS,
    };
  }

  // Build personalized greeting
  const parts: string[] = [];

  // Name-based greeting
  if (preferences.displayName) {
    parts.push(`Hi ${preferences.displayName}!`);
  } else {
    parts.push('Hi there!');
  }

  // Role-based context
  if (preferences.role) {
    const roleContext = getRoleContext(preferences.role);
    if (roleContext) {
      parts.push(roleContext);
    }
  }

  // LOB-based context
  if (preferences.linesOfBusiness && preferences.linesOfBusiness.length > 0) {
    const primaryLob = preferences.linesOfBusiness[0];
    parts.push(`I see you work primarily with ${primaryLob}.`);
  }

  // Call to action
  parts.push("I'm here to help with insurance questions, policy analysis, and client communications. What can I help you with today?");

  // Get suggestions based on first LOB, or generic
  const primaryLob = preferences.linesOfBusiness?.[0];
  const suggestions = primaryLob
    ? getSuggestionsForLOB(primaryLob)
    : GENERIC_SUGGESTIONS;

  return {
    message: parts.join(' '),
    suggestions,
  };
}

/**
 * Get role-specific context phrase
 */
function getRoleContext(role: UserPreferences['role']): string | null {
  switch (role) {
    case 'producer':
      return "As a producer, I can help with quote comparisons and client presentations.";
    case 'csr':
      return "I can help you answer client questions and explain policy details.";
    case 'manager':
      return "I can assist with team support and policy guidance.";
    default:
      return null;
  }
}

/**
 * Greeting result with message and suggestions
 */
export interface PersonalizedGreeting {
  /** The greeting message */
  message: string;
  /** Suggested prompts to show the user */
  suggestions: string[];
}

/**
 * Get initial AI message based on preferences
 * Used when initializing a new conversation
 */
export function getInitialAIMessage(preferences: UserPreferences | null | undefined): string {
  const greeting = generatePersonalizedGreeting(preferences);

  // Format with suggestions
  let message = greeting.message;

  if (greeting.suggestions.length > 0) {
    message += '\n\nHere are some things I can help with:\n';
    greeting.suggestions.forEach((suggestion, index) => {
      message += `${index + 1}. ${suggestion}\n`;
    });
  }

  return message;
}
