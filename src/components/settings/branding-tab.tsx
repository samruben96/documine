'use client';

import { BrandingForm } from './branding-form';

/**
 * Branding Tab Component
 * Story 9.1: AC-9.1.1 - Branding settings page content
 * Used within the Settings page tabs for admin users
 */

interface BrandingTabProps {
  agencyId: string;
}

export function BrandingTab({ agencyId }: BrandingTabProps) {
  return (
    <div className="space-y-6">
      <BrandingForm agencyId={agencyId} />
    </div>
  );
}
