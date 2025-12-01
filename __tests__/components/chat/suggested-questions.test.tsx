/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SuggestedQuestions } from '@/components/chat/suggested-questions';

describe('SuggestedQuestions', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-5.2.5: Suggested questions for empty conversations', () => {
    it('renders 3 default suggested questions', () => {
      render(<SuggestedQuestions onSelect={mockOnSelect} />);

      expect(screen.getByRole('button', { name: /what's the coverage limit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /are there any exclusions/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /what's the deductible/i })).toBeInTheDocument();
    });

    it('displays "Try asking:" prompt text', () => {
      render(<SuggestedQuestions onSelect={mockOnSelect} />);

      expect(screen.getByText('Try asking:')).toBeInTheDocument();
    });

    it('renders questions as clickable buttons (chips)', () => {
      render(<SuggestedQuestions onSelect={mockOnSelect} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
      });
    });

    it('renders suggestions with pill shape styling', () => {
      render(<SuggestedQuestions onSelect={mockOnSelect} />);

      const button = screen.getByRole('button', { name: /what's the coverage limit/i });
      expect(button).toHaveClass('rounded-full');
    });
  });

  describe('AC-5.2.6: Suggested question click behavior', () => {
    it('calls onSelect with the question text when clicked', async () => {
      const user = userEvent.setup();
      render(<SuggestedQuestions onSelect={mockOnSelect} />);

      const button = screen.getByRole('button', { name: /what's the coverage limit/i });
      await user.click(button);

      expect(mockOnSelect).toHaveBeenCalledWith("What's the coverage limit?");
    });

    it('calls onSelect with correct text for each question', async () => {
      const user = userEvent.setup();
      render(<SuggestedQuestions onSelect={mockOnSelect} />);

      // Click each suggestion and verify
      await user.click(screen.getByRole('button', { name: /are there any exclusions/i }));
      expect(mockOnSelect).toHaveBeenCalledWith("Are there any exclusions?");

      mockOnSelect.mockClear();

      await user.click(screen.getByRole('button', { name: /what's the deductible/i }));
      expect(mockOnSelect).toHaveBeenCalledWith("What's the deductible?");
    });
  });

  describe('Custom suggestions', () => {
    it('renders custom suggestions when provided', () => {
      const customSuggestions = ['Custom question 1?', 'Custom question 2?'];
      render(<SuggestedQuestions onSelect={mockOnSelect} suggestions={customSuggestions} />);

      expect(screen.getByRole('button', { name: /custom question 1/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /custom question 2/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /what's the coverage limit/i })).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('buttons have accessible aria-labels', () => {
      render(<SuggestedQuestions onSelect={mockOnSelect} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('suggestions meet minimum touch target size', () => {
      render(<SuggestedQuestions onSelect={mockOnSelect} />);

      const button = screen.getByRole('button', { name: /what's the coverage limit/i });
      expect(button).toHaveClass('min-h-[44px]');
    });
  });
});
