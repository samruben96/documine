/**
 * Plan Tier Definitions
 * Per AC-3.4.2: Defines plan tiers with seat limits and features
 */

export type PlanTier = 'starter' | 'professional' | 'agency';

export interface PlanInfo {
  name: string;
  seatLimit: number;
  description: string;
  features: string[];
}

export const PLAN_TIERS: Record<PlanTier, PlanInfo> = {
  starter: {
    name: 'Starter',
    seatLimit: 3,
    description: 'For small agencies getting started',
    features: [
      'Up to 3 team members',
      'Basic document Q&A',
      'Standard support',
    ],
  },
  professional: {
    name: 'Professional',
    seatLimit: 10,
    description: 'For growing agencies',
    features: [
      'Up to 10 team members',
      'Advanced document Q&A',
      'Quote comparison',
      'Priority support',
    ],
  },
  agency: {
    name: 'Agency',
    seatLimit: 25,
    description: 'For larger teams',
    features: [
      'Up to 25 team members',
      'Full feature access',
      'Dedicated support',
    ],
  },
} as const;

/**
 * Get plan info by tier
 */
export function getPlanInfo(tier: PlanTier): PlanInfo {
  return PLAN_TIERS[tier];
}

/**
 * Get seat limit for a tier
 */
export function getSeatLimit(tier: PlanTier): number {
  return PLAN_TIERS[tier].seatLimit;
}
