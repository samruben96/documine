/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatPanel } from '@/components/chat/chat-panel';

describe('ChatPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-5.1.2: Chat Panel structure', () => {
    it('renders chat panel container', () => {
      render(<ChatPanel documentId="test-doc-id" />);
      expect(screen.getByRole('log', { name: /conversation history/i })).toBeInTheDocument();
    });

    it('displays chat header', () => {
      render(<ChatPanel documentId="test-doc-id" />);
      expect(screen.getByText('Chat')).toBeInTheDocument();
    });

    it('renders scrollable conversation history area', () => {
      render(<ChatPanel documentId="test-doc-id" />);
      const historyArea = screen.getByRole('log', { name: /conversation history/i });
      expect(historyArea).toBeInTheDocument();
    });

    it('renders fixed input area at bottom', () => {
      render(<ChatPanel documentId="test-doc-id" />);
      const input = screen.getByRole('textbox', { name: /message input/i });
      expect(input).toBeInTheDocument();
    });
  });

  describe('AC-5.1.3: Placeholder text', () => {
    it('displays placeholder text "Ask a question..." in input', () => {
      render(<ChatPanel documentId="test-doc-id" />);
      const input = screen.getByRole('textbox', { name: /message input/i });
      expect(input).toHaveAttribute('placeholder', 'Ask a question...');
    });
  });

  describe('Empty state', () => {
    it('shows empty state message when no messages', () => {
      render(<ChatPanel documentId="test-doc-id" />);
      expect(screen.getByText('Ask questions about this document')).toBeInTheDocument();
    });

    it('shows source citations hint in empty state', () => {
      render(<ChatPanel documentId="test-doc-id" />);
      expect(screen.getByText('Get answers with source citations')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('conversation history has aria-live="polite"', () => {
      render(<ChatPanel documentId="test-doc-id" />);
      const historyArea = screen.getByRole('log', { name: /conversation history/i });
      expect(historyArea).toHaveAttribute('aria-live', 'polite');
    });
  });
});
