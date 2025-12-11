/**
 * @vitest-environment happy-dom
 */
/**
 * PromptInput Component Tests
 * Epic 23: Flexible AI Reports
 * Story 23.3: Prompt Input UI
 *
 * AC-23.3.1: Text input field for optional report description with multi-line support
 * AC-23.3.2: Placeholder text explains auto-analysis option
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PromptInput } from '@/components/reporting/prompt-input';

describe('PromptInput Component', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-23.3.1: Multi-line text input', () => {
    it('renders a textarea element', () => {
      render(<PromptInput {...defaultProps} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('has min-height for multi-line support', () => {
      render(<PromptInput {...defaultProps} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('min-h-[100px]');
    });

    it('displays the provided value', () => {
      render(<PromptInput {...defaultProps} value="Show me sales trends" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('Show me sales trends');
    });

    it('calls onChange when text is entered', () => {
      const onChange = vi.fn();
      render(<PromptInput {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'New prompt text' } });

      expect(onChange).toHaveBeenCalledWith('New prompt text');
    });
  });

  describe('AC-23.3.2: Placeholder text explains auto-analysis', () => {
    it('renders default placeholder with auto-analysis mention', () => {
      render(<PromptInput {...defaultProps} />);
      const textarea = screen.getByRole('textbox');

      expect(textarea).toHaveAttribute('placeholder');
      const placeholder = textarea.getAttribute('placeholder') || '';
      expect(placeholder.toLowerCase()).toContain('leave blank');
      expect(placeholder.toLowerCase()).toContain('automatically');
    });

    it('allows custom placeholder', () => {
      render(
        <PromptInput {...defaultProps} placeholder="Custom placeholder text" />
      );
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('placeholder', 'Custom placeholder text');
    });
  });

  describe('Character count indicator', () => {
    it('displays character count', () => {
      render(<PromptInput {...defaultProps} value="Hello" maxLength={500} />);
      expect(screen.getByText('5 / 500 characters')).toBeInTheDocument();
    });

    it('updates character count as value changes', () => {
      const { rerender } = render(
        <PromptInput {...defaultProps} value="" maxLength={500} />
      );
      expect(screen.getByText('0 / 500 characters')).toBeInTheDocument();

      rerender(<PromptInput {...defaultProps} value="Test input" maxLength={500} />);
      expect(screen.getByText('10 / 500 characters')).toBeInTheDocument();
    });

    it('shows warning color near limit (>80%)', () => {
      render(<PromptInput {...defaultProps} value={'x'.repeat(450)} maxLength={500} />);
      const charCount = screen.getByText('450 / 500 characters');
      expect(charCount).toHaveClass('text-amber-500');
    });

    it('shows error color over limit', () => {
      render(<PromptInput {...defaultProps} value={'x'.repeat(501)} maxLength={500} />);
      const charCount = screen.getByText('501 / 500 characters');
      expect(charCount).toHaveClass('text-red-500');
    });
  });

  describe('Disabled state', () => {
    it('disables textarea when disabled prop is true', () => {
      render(<PromptInput {...defaultProps} disabled />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
    });

    it('applies disabled styling', () => {
      render(<PromptInput {...defaultProps} disabled />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('cursor-not-allowed');
    });
  });

  describe('Accessibility', () => {
    it('has proper aria-label', () => {
      render(<PromptInput {...defaultProps} />);
      const textarea = screen.getByLabelText('Report description (optional)');
      expect(textarea).toBeInTheDocument();
    });

    it('has aria-describedby for character count and validation', () => {
      render(<PromptInput {...defaultProps} />);
      const textarea = screen.getByRole('textbox');
      // AC-23.8.5: aria-describedby includes both char count and validation error IDs
      expect(textarea).toHaveAttribute('aria-describedby', 'prompt-char-count prompt-validation-error');
    });

    it('character count has live region for screen readers', () => {
      render(<PromptInput {...defaultProps} />);
      const charCount = screen.getByRole('status');
      expect(charCount).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Custom className', () => {
    it('applies custom className to textarea', () => {
      render(<PromptInput {...defaultProps} className="custom-class" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('custom-class');
    });
  });

  describe('AC-23.8.5: Form validation', () => {
    it('shows error message when over character limit', () => {
      render(<PromptInput {...defaultProps} value={'x'.repeat(501)} maxLength={500} />);
      expect(screen.getByRole('alert')).toHaveTextContent('Prompt is too long');
    });

    it('does not show error message when under limit', () => {
      render(<PromptInput {...defaultProps} value={'x'.repeat(400)} maxLength={500} />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('sets aria-invalid when over limit', () => {
      render(<PromptInput {...defaultProps} value={'x'.repeat(501)} maxLength={500} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });

    it('applies error border styling when over limit', () => {
      render(<PromptInput {...defaultProps} value={'x'.repeat(501)} maxLength={500} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('border-red-500');
    });

    it('applies warning border styling when near limit', () => {
      render(<PromptInput {...defaultProps} value={'x'.repeat(450)} maxLength={500} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('border-amber-400');
    });
  });
});
