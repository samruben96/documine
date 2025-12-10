/**
 * @vitest-environment happy-dom
 */
/**
 * Tests for TranscriptModal Component
 * Story 20.4: Audit Log Interface
 *
 * Tests:
 * - AC-20.4.4: Full read-only conversation transcript modal
 * - AC-20.4.5: Messages show role, content, timestamps, source citations, confidence badges
 * - AC-20.4.6: Guardrail events highlighted with type and trigger info
 * - AC-20.4.10: Read-only - no edit or delete options visible
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TranscriptModal } from '@/components/ai-buddy/admin/audit-log/transcript-modal';
import type { TranscriptData } from '@/app/api/ai-buddy/admin/audit-logs/[conversationId]/transcript/route';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockTranscriptData: TranscriptData = {
  conversation: {
    id: 'conv-1',
    title: 'Test Conversation',
    projectId: 'proj-1',
    projectName: 'Test Project',
    userId: 'user-1',
    userName: 'Test User',
    userEmail: 'test@example.com',
    createdAt: '2024-01-15T10:30:00Z',
  },
  messages: [
    {
      id: 'msg-1',
      role: 'user',
      content: 'What is the policy coverage?',
      createdAt: '2024-01-15T10:30:00Z',
      confidence: null,
      sources: null,
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content: 'Based on the policy document, the coverage includes...',
      createdAt: '2024-01-15T10:30:15Z',
      confidence: 'high',
      sources: [
        { documentId: 'doc-1', documentName: 'Policy.pdf', text: 'Coverage includes...', page: 5 },
      ],
    },
  ],
  guardrailEvents: [],
};

describe('TranscriptModal', () => {
  const defaultProps = {
    conversationId: 'conv-1',
    open: true,
    onOpenChange: vi.fn(),
  };

  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('shows loading skeleton when fetching', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<TranscriptModal {...defaultProps} />);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByTestId('transcript-modal')).toBeInTheDocument();
      });
    });
  });

  describe('Successful Load (AC-20.4.4)', () => {
    it('renders transcript modal', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockTranscriptData }),
      });

      render(<TranscriptModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('transcript-modal')).toBeInTheDocument();
      });
    });

    it('displays conversation title in header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockTranscriptData }),
      });

      render(<TranscriptModal {...defaultProps} />);

      await waitFor(() => {
        // Title appears in description which includes the project/user info
        const description = screen.getByTestId('transcript-modal').querySelector('[data-slot="dialog-description"]');
        expect(description?.textContent).toContain('Test Conversation');
      });
    });

    it('displays project name in header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockTranscriptData }),
      });

      render(<TranscriptModal {...defaultProps} />);

      await waitFor(() => {
        const description = screen.getByTestId('transcript-modal').querySelector('[data-slot="dialog-description"]');
        expect(description?.textContent).toContain('Test Project');
      });
    });

    it('displays user name in header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockTranscriptData }),
      });

      render(<TranscriptModal {...defaultProps} />);

      await waitFor(() => {
        const description = screen.getByTestId('transcript-modal').querySelector('[data-slot="dialog-description"]');
        expect(description?.textContent).toContain('Test User');
      });
    });
  });

  describe('Messages Display (AC-20.4.5)', () => {
    it('shows message role badges', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockTranscriptData }),
      });

      render(<TranscriptModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('user')).toBeInTheDocument();
        expect(screen.getByText('assistant')).toBeInTheDocument();
      });
    });

    it('shows message content', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockTranscriptData }),
      });

      render(<TranscriptModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('What is the policy coverage?')).toBeInTheDocument();
        expect(screen.getByText(/Based on the policy document/)).toBeInTheDocument();
      });
    });

    it('shows confidence badge for assistant messages', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockTranscriptData }),
      });

      render(<TranscriptModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('confidence-badge')).toBeInTheDocument();
        expect(screen.getByText('high confidence')).toBeInTheDocument();
      });
    });

    it('shows source citations button', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockTranscriptData }),
      });

      render(<TranscriptModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('1 source')).toBeInTheDocument();
      });
    });
  });

  describe('Guardrail Events (AC-20.4.6)', () => {
    it('shows guardrail events summary when events exist', async () => {
      const dataWithGuardrails: TranscriptData = {
        ...mockTranscriptData,
        guardrailEvents: [
          {
            id: 'event-1',
            triggeredTopic: 'competitor_mention',
            redirectMessage: 'Redirecting from competitor topic',
            loggedAt: '2024-01-15T10:30:15Z',
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: dataWithGuardrails }),
      });

      render(<TranscriptModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/1 guardrail event/)).toBeInTheDocument();
      });
    });

    it('highlights messages with associated guardrail events', async () => {
      const dataWithGuardrails: TranscriptData = {
        ...mockTranscriptData,
        guardrailEvents: [
          {
            id: 'event-1',
            triggeredTopic: 'competitor_mention',
            redirectMessage: 'Redirecting from competitor topic',
            loggedAt: '2024-01-15T10:30:15Z', // Same time as msg-2
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: dataWithGuardrails }),
      });

      render(<TranscriptModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('guardrail-highlight')).toBeInTheDocument();
        expect(screen.getByText(/Guardrail triggered: competitor_mention/)).toBeInTheDocument();
      });
    });

    it('shows redirect message in guardrail highlight', async () => {
      const dataWithGuardrails: TranscriptData = {
        ...mockTranscriptData,
        guardrailEvents: [
          {
            id: 'event-1',
            triggeredTopic: 'competitor_mention',
            redirectMessage: 'Redirecting from competitor topic',
            loggedAt: '2024-01-15T10:30:15Z',
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: dataWithGuardrails }),
      });

      render(<TranscriptModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Redirect: Redirecting from competitor topic/)).toBeInTheDocument();
      });
    });
  });

  describe('Read-Only (AC-20.4.10)', () => {
    it('only shows close button in footer', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockTranscriptData }),
      });

      render(<TranscriptModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('close-transcript-btn')).toBeInTheDocument();
      });

      // Should NOT have edit/delete buttons
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    it('calls onOpenChange when close button clicked', async () => {
      const onOpenChange = vi.fn();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockTranscriptData }),
      });

      render(<TranscriptModal {...defaultProps} onOpenChange={onOpenChange} />);

      await waitFor(() => {
        expect(screen.getByTestId('close-transcript-btn')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('close-transcript-btn'));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Error State', () => {
    it('shows error message when fetch fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: 'Server error' } }),
      });

      render(<TranscriptModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('transcript-error')).toBeInTheDocument();
        expect(screen.getByText('Failed to load transcript')).toBeInTheDocument();
      });
    });

    it('shows retry button on error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: 'Server error' } }),
      });

      render(<TranscriptModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    it('retries fetch when retry button clicked', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: { message: 'Server error' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockTranscriptData }),
        });

      render(<TranscriptModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Try Again'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Empty Messages State', () => {
    it('shows empty state when no messages', async () => {
      const emptyData: TranscriptData = {
        ...mockTranscriptData,
        messages: [],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: emptyData }),
      });

      render(<TranscriptModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No messages')).toBeInTheDocument();
      });
    });
  });

  describe('Modal State Management', () => {
    it('does not fetch when closed', () => {
      render(<TranscriptModal {...defaultProps} open={false} />);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('resets state when modal closes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockTranscriptData }),
      });

      const { rerender } = render(<TranscriptModal {...defaultProps} open={true} />);

      await waitFor(() => {
        expect(screen.getByTestId('transcript-content')).toBeInTheDocument();
      });

      // Close modal
      rerender(<TranscriptModal {...defaultProps} open={false} />);

      // Modal should be unmounted
      expect(screen.queryByTestId('transcript-modal')).not.toBeInTheDocument();
    });
  });
});
