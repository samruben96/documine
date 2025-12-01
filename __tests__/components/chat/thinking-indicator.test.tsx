/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThinkingIndicator } from '@/components/chat/thinking-indicator';

describe('ThinkingIndicator', () => {
  describe('AC-5.2.8: Thinking indicator', () => {
    it('renders "Thinking" text', () => {
      render(<ThinkingIndicator />);

      expect(screen.getByText('Thinking')).toBeInTheDocument();
    });

    it('renders 3 animated dots', () => {
      render(<ThinkingIndicator />);

      const container = screen.getByRole('status');
      const dots = container.querySelectorAll('.animate-thinking-dot');
      expect(dots).toHaveLength(3);
    });

    it('is left-aligned (assistant message position)', () => {
      render(<ThinkingIndicator />);

      const container = screen.getByRole('status');
      expect(container).toHaveClass('justify-start');
    });

    it('has proper accessibility label', () => {
      render(<ThinkingIndicator />);

      const container = screen.getByRole('status');
      expect(container).toHaveAttribute('aria-label', 'Assistant is thinking');
    });

    it('has gray background like assistant messages (slate-100)', () => {
      render(<ThinkingIndicator />);

      const bubble = screen.getByText('Thinking').closest('div[class*="rounded-lg"]');
      expect(bubble).toHaveClass('bg-slate-100');
    });

    it('dots have animation delay for staggered effect', () => {
      render(<ThinkingIndicator />);

      const container = screen.getByRole('status');
      const dots = container.querySelectorAll('.animate-thinking-dot');

      // Check that dots have different animation delays
      expect(dots[0]).toHaveStyle({ animationDelay: '0s' });
      expect(dots[1]).toHaveStyle({ animationDelay: '0.2s' });
      expect(dots[2]).toHaveStyle({ animationDelay: '0.4s' });
    });
  });

  describe('Custom styling', () => {
    it('accepts additional className prop', () => {
      render(<ThinkingIndicator className="custom-class" />);

      const container = screen.getByRole('status');
      expect(container).toHaveClass('custom-class');
    });
  });
});
