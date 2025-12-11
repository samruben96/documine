/**
 * @vitest-environment happy-dom
 */
/**
 * QuoteSessionCard Component Tests
 * Story Q2.1: Quote Sessions List Page
 * Story Q2.5: Delete and Duplicate Quote Sessions
 *
 * Tests for:
 * - AC-Q2.1-2: Card shows prospect name, quote type badge, status indicator, created date, carrier count
 * - AC-Q2.1-3: Action menu with Edit, Duplicate, Delete options
 * - AC-Q2.1-5: Click navigates to /quoting/[id]
 * - AC-Q2.5-1: Delete triggers confirmation callback
 * - AC-Q2.5-4: Duplicate triggers duplicate callback
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuoteSessionCard } from '@/components/quoting/quote-session-card';
import type { QuoteSession } from '@/types/quoting';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

const mockSession: QuoteSession = {
  id: 'session-123',
  agencyId: 'agency-456',
  userId: 'user-789',
  prospectName: 'Smith Family',
  quoteType: 'bundle',
  status: 'in_progress',
  clientData: { personal: { firstName: 'John', lastName: 'Smith' } },
  createdAt: '2025-12-11T10:00:00Z',
  updatedAt: '2025-12-11T15:00:00Z',
  carrierCount: 3,
};

describe('QuoteSessionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-Q2.1-2: Card displays all required fields', () => {
    it('displays prospect name', () => {
      render(<QuoteSessionCard session={mockSession} />);

      expect(screen.getByText('Smith Family')).toBeInTheDocument();
    });

    it('displays quote type badge', () => {
      render(<QuoteSessionCard session={mockSession} />);

      const typeBadge = screen.getByTestId('quote-type-badge');
      expect(typeBadge).toHaveTextContent('Bundle');
    });

    it('displays status indicator', () => {
      render(<QuoteSessionCard session={mockSession} />);

      const statusBadge = screen.getByTestId('status-badge');
      expect(statusBadge).toHaveTextContent('In Progress');
    });

    it('displays created date', () => {
      render(<QuoteSessionCard session={mockSession} />);

      expect(screen.getByText(/Dec 11, 2025/)).toBeInTheDocument();
    });

    it('displays carrier count', () => {
      render(<QuoteSessionCard session={mockSession} />);

      expect(screen.getByText('3 carriers')).toBeInTheDocument();
    });

    it('displays singular carrier when count is 1', () => {
      const singleCarrierSession = { ...mockSession, carrierCount: 1 };
      render(<QuoteSessionCard session={singleCarrierSession} />);

      expect(screen.getByText('1 carrier')).toBeInTheDocument();
    });

    it('displays 0 carriers when count is undefined', () => {
      const noCarrierSession = { ...mockSession, carrierCount: undefined };
      render(<QuoteSessionCard session={noCarrierSession} />);

      expect(screen.getByText('0 carriers')).toBeInTheDocument();
    });
  });

  describe('AC-Q2.1-3: Action menu', () => {
    it('renders action menu button', () => {
      render(<QuoteSessionCard session={mockSession} />);

      const menuButton = screen.getByTestId('session-action-menu');
      expect(menuButton).toBeInTheDocument();
    });

    it('shows Edit, Duplicate, Delete options in dropdown', async () => {
      const user = userEvent.setup();
      render(<QuoteSessionCard session={mockSession} />);

      const menuButton = screen.getByTestId('session-action-menu');
      await user.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
        expect(screen.getByText('Duplicate')).toBeInTheDocument();
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });
    });

    it('calls onDelete when Delete is clicked', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(<QuoteSessionCard session={mockSession} onDelete={onDelete} />);

      const menuButton = screen.getByTestId('session-action-menu');
      await user.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });

      const deleteOption = screen.getByText('Delete');
      await user.click(deleteOption);

      expect(onDelete).toHaveBeenCalledWith('session-123');
    });

    it('calls onDuplicate when Duplicate is clicked', async () => {
      const user = userEvent.setup();
      const onDuplicate = vi.fn();
      render(<QuoteSessionCard session={mockSession} onDuplicate={onDuplicate} />);

      const menuButton = screen.getByTestId('session-action-menu');
      await user.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Duplicate')).toBeInTheDocument();
      });

      const duplicateOption = screen.getByText('Duplicate');
      await user.click(duplicateOption);

      expect(onDuplicate).toHaveBeenCalledWith('session-123');
    });

    it('navigates to edit page when Edit is clicked', async () => {
      const user = userEvent.setup();
      render(<QuoteSessionCard session={mockSession} />);

      const menuButton = screen.getByTestId('session-action-menu');
      await user.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      const editOption = screen.getByText('Edit');
      await user.click(editOption);

      expect(mockPush).toHaveBeenCalledWith('/quoting/session-123');
    });
  });

  describe('AC-Q2.1-5: Card click navigation', () => {
    it('navigates to detail page when card is clicked', () => {
      render(<QuoteSessionCard session={mockSession} />);

      const card = screen.getByTestId('quote-session-card');
      fireEvent.click(card);

      expect(mockPush).toHaveBeenCalledWith('/quoting/session-123');
    });

    it('does not navigate when action menu is clicked', () => {
      render(<QuoteSessionCard session={mockSession} />);

      const menuButton = screen.getByTestId('session-action-menu');
      fireEvent.click(menuButton);

      // Card click should not be triggered
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Status variants', () => {
    it('renders draft status correctly', () => {
      const draftSession = { ...mockSession, status: 'draft' as const };
      render(<QuoteSessionCard session={draftSession} />);

      const statusBadge = screen.getByTestId('status-badge');
      expect(statusBadge).toHaveTextContent('Draft');
    });

    it('renders quotes_received status correctly', () => {
      const quotesSession = { ...mockSession, status: 'quotes_received' as const };
      render(<QuoteSessionCard session={quotesSession} />);

      const statusBadge = screen.getByTestId('status-badge');
      expect(statusBadge).toHaveTextContent('Quotes Received');
    });

    it('renders complete status correctly', () => {
      const completeSession = { ...mockSession, status: 'complete' as const };
      render(<QuoteSessionCard session={completeSession} />);

      const statusBadge = screen.getByTestId('status-badge');
      expect(statusBadge).toHaveTextContent('Complete');
    });
  });

  describe('Quote type variants', () => {
    it('renders home type correctly', () => {
      const homeSession = { ...mockSession, quoteType: 'home' as const };
      render(<QuoteSessionCard session={homeSession} />);

      const typeBadge = screen.getByTestId('quote-type-badge');
      expect(typeBadge).toHaveTextContent('Home');
    });

    it('renders auto type correctly', () => {
      const autoSession = { ...mockSession, quoteType: 'auto' as const };
      render(<QuoteSessionCard session={autoSession} />);

      const typeBadge = screen.getByTestId('quote-type-badge');
      expect(typeBadge).toHaveTextContent('Auto');
    });
  });
});
