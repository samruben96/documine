/**
 * CarrierActionRow Component Tests
 * Story Q4.2: Carriers Tab UI & Actions
 *
 * Tests AC-Q4.2-2 through AC-Q4.2-8
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CarrierActionRow, type CarrierActionRowProps } from '@/components/quoting/carrier-action-row';
import type { CarrierInfo, CarrierStatus } from '@/lib/quoting/carriers/types';
import type { QuoteClientData } from '@/types/quoting';

// Mock the clipboard hook
vi.mock('@/hooks/quoting/use-clipboard-copy', () => ({
  useClipboardCopy: vi.fn(() => ({
    copyToClipboard: vi.fn().mockResolvedValue(true),
    copiedCarrier: null,
    error: null,
    isLoading: false,
    resetError: vi.fn(),
  })),
}));

// Mock carrier registry
vi.mock('@/lib/quoting/carriers', () => ({
  getCarrier: vi.fn((code: string) => mockCarrier),
  getSupportedCarriers: vi.fn(() => [mockCarrier]),
  getCarriersForQuoteType: vi.fn(() => [mockCarrier]),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: vi.fn(({ src, alt, className, onError }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={onError}
      data-testid="carrier-logo"
    />
  )),
}));

const mockCarrier: CarrierInfo = {
  code: 'progressive',
  name: 'Progressive',
  portalUrl: 'https://www.foragentsonly.com',
  logoPath: '/carriers/progressive.svg',
  formatter: {
    formatForClipboard: vi.fn().mockReturnValue('Formatted data'),
    generatePreview: vi.fn().mockReturnValue({ sections: [], rawText: '' }),
    validateRequiredFields: vi.fn().mockReturnValue({ isValid: true, missingFields: [], warnings: [] }),
  },
  linesOfBusiness: ['home', 'auto', 'bundle'],
};

const testClientData: QuoteClientData = {
  personal: {
    firstName: 'John',
    lastName: 'Doe',
  },
};

describe('CarrierActionRow', () => {
  const defaultProps: CarrierActionRowProps = {
    carrier: mockCarrier,
    status: 'not_started',
    onCopy: vi.fn(),
    clientData: testClientData,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering (AC-Q4.2-2)', () => {
    it('renders carrier logo', () => {
      render(<CarrierActionRow {...defaultProps} />);

      const logo = screen.getByTestId('carrier-logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/carriers/progressive.svg');
      expect(logo).toHaveAttribute('alt', 'Progressive logo');
    });

    it('renders carrier name', () => {
      render(<CarrierActionRow {...defaultProps} />);

      expect(screen.getByText('Progressive')).toBeInTheDocument();
    });

    it('renders status badge', () => {
      render(<CarrierActionRow {...defaultProps} />);

      expect(screen.getByTestId('status-badge-progressive')).toBeInTheDocument();
    });

    it('has correct data-testid', () => {
      render(<CarrierActionRow {...defaultProps} />);

      expect(screen.getByTestId('carrier-row-progressive')).toBeInTheDocument();
    });

    it('has data-carrier attribute', () => {
      render(<CarrierActionRow {...defaultProps} />);

      const row = screen.getByTestId('carrier-row-progressive');
      expect(row).toHaveAttribute('data-carrier', 'progressive');
    });

    it('has data-status attribute', () => {
      render(<CarrierActionRow {...defaultProps} />);

      const row = screen.getByTestId('carrier-row-progressive');
      expect(row).toHaveAttribute('data-status', 'not_started');
    });
  });

  describe('Copy Data button (AC-Q4.2-3)', () => {
    it('renders Copy Data button', () => {
      render(<CarrierActionRow {...defaultProps} />);

      expect(screen.getByTestId('copy-button-progressive')).toBeInTheDocument();
    });

    it('copy button is disabled when disabled prop is true', () => {
      render(<CarrierActionRow {...defaultProps} disabled />);

      const copyButton = screen.getByTestId('copy-button-progressive');
      expect(copyButton).toBeDisabled();
    });
  });

  describe('Open Portal button (AC-Q4.2-4, AC-Q4.2-5)', () => {
    it('renders Open Portal button as link', () => {
      render(<CarrierActionRow {...defaultProps} />);

      const portalLink = screen.getByTestId('portal-link-progressive');
      expect(portalLink).toBeInTheDocument();
    });

    it('portal link has correct href', () => {
      render(<CarrierActionRow {...defaultProps} />);

      const portalLink = screen.getByTestId('portal-link-progressive');
      expect(portalLink).toHaveAttribute('href', 'https://www.foragentsonly.com');
    });

    it('portal link opens in new tab', () => {
      render(<CarrierActionRow {...defaultProps} />);

      const portalLink = screen.getByTestId('portal-link-progressive');
      expect(portalLink).toHaveAttribute('target', '_blank');
    });

    it('portal link has noopener noreferrer for security', () => {
      render(<CarrierActionRow {...defaultProps} />);

      const portalLink = screen.getByTestId('portal-link-progressive');
      expect(portalLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('portal link has accessible label', () => {
      render(<CarrierActionRow {...defaultProps} />);

      const portalLink = screen.getByTestId('portal-link-progressive');
      expect(portalLink).toHaveAttribute('aria-label', 'Open Progressive portal in new tab');
    });
  });

  describe('status badge - Not Started (AC-Q4.2-6)', () => {
    it('shows "Not Started" badge initially', () => {
      render(<CarrierActionRow {...defaultProps} status="not_started" />);

      expect(screen.getByText('Not Started')).toBeInTheDocument();
    });

    it('Not Started badge has gray styling (status-default variant)', () => {
      render(<CarrierActionRow {...defaultProps} status="not_started" />);

      const badge = screen.getByTestId('status-badge-progressive');
      // status-default variant uses slate colors (gray)
      expect(badge).toHaveClass('bg-slate-100');
    });
  });

  describe('status badge - Copied (AC-Q4.2-7)', () => {
    it('shows "Copied" badge when status is copied', () => {
      render(<CarrierActionRow {...defaultProps} status="copied" />);

      expect(screen.getByText('Copied')).toBeInTheDocument();
    });

    it('Copied badge has blue styling (status-info variant)', () => {
      render(<CarrierActionRow {...defaultProps} status="copied" />);

      const badge = screen.getByTestId('status-badge-progressive');
      expect(badge).toHaveClass('bg-blue-100');
    });
  });

  describe('status badge - Quote Entered (AC-Q4.2-8)', () => {
    it('shows "Quote Entered" badge when status is quote_entered', () => {
      render(<CarrierActionRow {...defaultProps} status="quote_entered" />);

      expect(screen.getByText('Quote Entered')).toBeInTheDocument();
    });

    it('Quote Entered badge has green styling (status-success variant)', () => {
      render(<CarrierActionRow {...defaultProps} status="quote_entered" />);

      const badge = screen.getByTestId('status-badge-progressive');
      expect(badge).toHaveClass('bg-green-100');
    });
  });

  describe('callbacks', () => {
    it('calls onStatusChange when copy succeeds', async () => {
      const onStatusChange = vi.fn();

      render(
        <CarrierActionRow
          {...defaultProps}
          onStatusChange={onStatusChange}
        />
      );

      // Click the copy button
      const copyButton = screen.getByTestId('copy-button-progressive');
      fireEvent.click(copyButton);

      // onStatusChange should be called with 'copied'
      await waitFor(() => {
        expect(onStatusChange).toHaveBeenCalledWith('copied');
      });
    });

    it('calls onCopy callback', async () => {
      const onCopy = vi.fn();

      render(<CarrierActionRow {...defaultProps} onCopy={onCopy} />);

      const copyButton = screen.getByTestId('copy-button-progressive');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(onCopy).toHaveBeenCalled();
      });
    });
  });

  describe('logo fallback', () => {
    it('shows fallback icon when logo path is empty', () => {
      const carrierNoLogo: CarrierInfo = {
        ...mockCarrier,
        logoPath: '',
      };

      render(<CarrierActionRow {...defaultProps} carrier={carrierNoLogo} />);

      // Should not find an img element since logo path is empty
      expect(screen.queryByTestId('carrier-logo')).not.toBeInTheDocument();
    });
  });

  describe('responsive layout', () => {
    it('has responsive classes for mobile/desktop', () => {
      render(<CarrierActionRow {...defaultProps} />);

      const row = screen.getByTestId('carrier-row-progressive');
      // Check for responsive flex classes
      expect(row).toHaveClass('flex-col');
      expect(row).toHaveClass('sm:flex-row');
    });
  });

  describe('different carriers', () => {
    it('renders Travelers carrier correctly', () => {
      const travelersCarrier: CarrierInfo = {
        ...mockCarrier,
        code: 'travelers',
        name: 'Travelers',
        portalUrl: 'https://www.travelers.com/agent',
        logoPath: '/carriers/travelers.svg',
      };

      render(
        <CarrierActionRow
          {...defaultProps}
          carrier={travelersCarrier}
        />
      );

      expect(screen.getByText('Travelers')).toBeInTheDocument();
      expect(screen.getByTestId('carrier-row-travelers')).toBeInTheDocument();
      expect(screen.getByTestId('portal-link-travelers')).toHaveAttribute(
        'href',
        'https://www.travelers.com/agent'
      );
    });
  });
});
