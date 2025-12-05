/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OnePagerPreview } from '@/components/one-pager/one-pager-preview';
import type { QuoteExtraction } from '@/types/compare';
import type { AgencyBranding } from '@/hooks/use-agency-branding';

/**
 * OnePagerPreview Component Tests
 * Story 9.3: AC-9.3.7 - Live preview of one-pager content
 */

const mockExtraction: QuoteExtraction = {
  carrierName: 'Progressive Insurance',
  policyNumber: 'POL-12345',
  namedInsured: 'Acme Corporation',
  effectiveDate: '2024-01-01',
  expirationDate: '2025-01-01',
  annualPremium: 25000,
  coverages: [
    {
      type: 'general_liability',
      name: 'General Liability',
      limit: 1000000,
      sublimit: null,
      limitType: 'per_occurrence',
      deductible: 5000,
      description: 'General liability coverage',
      sourcePages: [1],
    },
    {
      type: 'property',
      name: 'Property Coverage',
      limit: 500000,
      sublimit: null,
      limitType: 'aggregate',
      deductible: 2500,
      description: 'Property coverage',
      sourcePages: [2],
    },
  ],
  exclusions: [
    {
      name: 'Flood',
      description: 'Flood damage excluded',
      category: 'flood',
      sourcePages: [3],
    },
  ],
  deductibles: [],
  extractedAt: '2024-01-15T10:00:00Z',
  modelUsed: 'gpt-5.1',
};

const mockBranding: AgencyBranding = {
  name: 'Smith Insurance Agency',
  logoUrl: null,
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  phone: '555-123-4567',
  email: 'info@smithinsurance.com',
  address: '123 Main St, Anytown, USA',
  website: 'https://smithinsurance.com',
};

describe('OnePagerPreview', () => {
  describe('Empty State', () => {
    it('AC-9.3.7: shows empty state when no extractions', () => {
      render(
        <OnePagerPreview
          clientName=""
          agentNotes=""
          extractions={[]}
          branding={null}
        />
      );

      expect(
        screen.getByText('Select documents or load a comparison to see the preview.')
      ).toBeInTheDocument();
    });
  });

  describe('Client Information', () => {
    it('AC-9.3.7: displays client name from form', () => {
      render(
        <OnePagerPreview
          clientName="Test Client LLC"
          agentNotes=""
          extractions={[mockExtraction]}
          branding={mockBranding}
        />
      );

      expect(screen.getByText('Test Client LLC')).toBeInTheDocument();
    });

    it('shows fallback when client name not provided', () => {
      render(
        <OnePagerPreview
          clientName=""
          agentNotes=""
          extractions={[mockExtraction]}
          branding={mockBranding}
        />
      );

      expect(screen.getByText('Client Name')).toBeInTheDocument();
    });

    it('shows named insured if different from client name', () => {
      render(
        <OnePagerPreview
          clientName="Different Name Inc"
          agentNotes=""
          extractions={[mockExtraction]}
          branding={mockBranding}
        />
      );

      expect(screen.getByText(/Named Insured: Acme Corporation/)).toBeInTheDocument();
    });
  });

  describe('Quote Overview', () => {
    it('AC-9.3.7: displays carrier name', () => {
      render(
        <OnePagerPreview
          clientName="Test"
          agentNotes=""
          extractions={[mockExtraction]}
          branding={mockBranding}
        />
      );

      expect(screen.getByText('Progressive Insurance')).toBeInTheDocument();
    });

    it('AC-9.3.7: displays formatted premium', () => {
      render(
        <OnePagerPreview
          clientName="Test"
          agentNotes=""
          extractions={[mockExtraction]}
          branding={mockBranding}
        />
      );

      // Story 10.9: Premium now appears in multiple places (overview + breakdown)
      expect(screen.getAllByText('$25,000').length).toBeGreaterThan(0);
    });

    it('AC-9.3.7: displays policy dates', () => {
      render(
        <OnePagerPreview
          clientName="Test"
          agentNotes=""
          extractions={[mockExtraction]}
          branding={mockBranding}
        />
      );

      expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument();
      expect(screen.getByText('Jan 1, 2025')).toBeInTheDocument();
    });
  });

  describe('Coverage Highlights', () => {
    it('AC-9.3.7: displays coverage highlights', () => {
      render(
        <OnePagerPreview
          clientName="Test"
          agentNotes=""
          extractions={[mockExtraction]}
          branding={mockBranding}
        />
      );

      expect(screen.getByText('Coverage Highlights')).toBeInTheDocument();
      expect(screen.getByText('General Liability')).toBeInTheDocument();
      expect(screen.getByText('Property')).toBeInTheDocument();
    });

    it('AC-9.3.7: displays formatted limits', () => {
      render(
        <OnePagerPreview
          clientName="Test"
          agentNotes=""
          extractions={[mockExtraction]}
          branding={mockBranding}
        />
      );

      expect(screen.getByText('$1,000,000')).toBeInTheDocument();
      expect(screen.getByText('$500,000')).toBeInTheDocument();
    });

    it('AC-9.3.7: displays deductibles', () => {
      render(
        <OnePagerPreview
          clientName="Test"
          agentNotes=""
          extractions={[mockExtraction]}
          branding={mockBranding}
        />
      );

      expect(screen.getByText('Ded: $5,000')).toBeInTheDocument();
      expect(screen.getByText('Ded: $2,500')).toBeInTheDocument();
    });
  });

  describe('Exclusions', () => {
    it('AC-9.3.7: displays key exclusions', () => {
      render(
        <OnePagerPreview
          clientName="Test"
          agentNotes=""
          extractions={[mockExtraction]}
          branding={mockBranding}
        />
      );

      expect(screen.getByText('Key Exclusions')).toBeInTheDocument();
      expect(screen.getByText('Flood')).toBeInTheDocument();
    });
  });

  describe('Agent Notes', () => {
    it('AC-9.3.7: displays agent notes when provided', () => {
      render(
        <OnePagerPreview
          clientName="Test"
          agentNotes="This is a great quote for the client. Highly recommended."
          extractions={[mockExtraction]}
          branding={mockBranding}
        />
      );

      expect(screen.getByText('Agent Notes')).toBeInTheDocument();
      expect(
        screen.getByText('This is a great quote for the client. Highly recommended.')
      ).toBeInTheDocument();
    });

    it('does not show notes section when empty', () => {
      render(
        <OnePagerPreview
          clientName="Test"
          agentNotes=""
          extractions={[mockExtraction]}
          branding={mockBranding}
        />
      );

      expect(screen.queryByText('Agent Notes')).not.toBeInTheDocument();
    });
  });

  describe('Agency Branding', () => {
    it('AC-9.3.7: displays agency name in header', () => {
      render(
        <OnePagerPreview
          clientName="Test"
          agentNotes=""
          extractions={[mockExtraction]}
          branding={mockBranding}
        />
      );

      const agencyNameElements = screen.getAllByText('Smith Insurance Agency');
      expect(agencyNameElements.length).toBeGreaterThan(0);
    });

    it('AC-9.3.7: displays contact information in footer', () => {
      render(
        <OnePagerPreview
          clientName="Test"
          agentNotes=""
          extractions={[mockExtraction]}
          branding={mockBranding}
        />
      );

      expect(screen.getByText('555-123-4567')).toBeInTheDocument();
      expect(screen.getByText('info@smithinsurance.com')).toBeInTheDocument();
    });

    it('uses default styling when no branding provided', () => {
      render(
        <OnePagerPreview
          clientName="Test"
          agentNotes=""
          extractions={[mockExtraction]}
          branding={null}
        />
      );

      expect(screen.getAllByText('Insurance Agency').length).toBeGreaterThan(0);
    });

    it('displays logo placeholder when no logo URL', () => {
      render(
        <OnePagerPreview
          clientName="Test"
          agentNotes=""
          extractions={[mockExtraction]}
          branding={mockBranding}
        />
      );

      // Should show first letter of agency name as placeholder
      expect(screen.getByText('S')).toBeInTheDocument();
    });
  });

  describe('Update Indicator', () => {
    it('AC-9.3.7: applies reduced opacity when updating', () => {
      render(
        <OnePagerPreview
          clientName="Test"
          agentNotes=""
          extractions={[mockExtraction]}
          branding={mockBranding}
          isUpdating={true}
        />
      );

      const preview = screen.getByTestId('one-pager-preview');
      expect(preview).toHaveClass('opacity-75');
    });

    it('has full opacity when not updating', () => {
      render(
        <OnePagerPreview
          clientName="Test"
          agentNotes=""
          extractions={[mockExtraction]}
          branding={mockBranding}
          isUpdating={false}
        />
      );

      const preview = screen.getByTestId('one-pager-preview');
      expect(preview).toHaveClass('opacity-100');
    });
  });
});
