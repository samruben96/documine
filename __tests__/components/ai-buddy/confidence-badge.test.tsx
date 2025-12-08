/**
 * @vitest-environment happy-dom
 */
/**
 * ConfidenceBadge Component Tests
 * Story 15.5: AI Response Quality & Attribution
 *
 * Tests for confidence level display components.
 * AC7-AC14: Confidence indicator rendering
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  ConfidenceBadge,
  ConfidenceIndicator,
} from '@/components/ai-buddy/confidence-badge';
import type { ConfidenceLevel } from '@/types/ai-buddy';

describe('ConfidenceBadge', () => {
  describe('High Confidence (AC9)', () => {
    it('should render with "High Confidence" label', () => {
      render(<ConfidenceBadge level="high" />);

      expect(screen.getByText('High Confidence')).toBeInTheDocument();
    });

    it('should render with green styling', () => {
      render(<ConfidenceBadge level="high" />);

      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveClass('bg-emerald-500/10');
      expect(badge).toHaveClass('text-emerald-600');
    });

    it('should render with checkmark icon', () => {
      render(<ConfidenceBadge level="high" />);

      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('should have correct data attribute', () => {
      render(<ConfidenceBadge level="high" />);

      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveAttribute('data-confidence-level', 'high');
    });
  });

  describe('Medium Confidence (AC10)', () => {
    it('should render with "Needs Review" label', () => {
      render(<ConfidenceBadge level="medium" />);

      expect(screen.getByText('Needs Review')).toBeInTheDocument();
    });

    it('should render with amber styling', () => {
      render(<ConfidenceBadge level="medium" />);

      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveClass('bg-amber-500/10');
      expect(badge).toHaveClass('text-amber-600');
    });

    it('should render with exclamation icon', () => {
      render(<ConfidenceBadge level="medium" />);

      expect(screen.getByText('!')).toBeInTheDocument();
    });

    it('should have correct data attribute', () => {
      render(<ConfidenceBadge level="medium" />);

      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveAttribute('data-confidence-level', 'medium');
    });
  });

  describe('Low Confidence (AC11)', () => {
    it('should render with "Not Found" label', () => {
      render(<ConfidenceBadge level="low" />);

      expect(screen.getByText('Not Found')).toBeInTheDocument();
    });

    it('should render with gray/slate styling', () => {
      render(<ConfidenceBadge level="low" />);

      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveClass('bg-slate-500/10');
      expect(badge).toHaveClass('text-slate-500');
    });

    it('should render with question mark icon', () => {
      render(<ConfidenceBadge level="low" />);

      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('should have correct data attribute', () => {
      render(<ConfidenceBadge level="low" />);

      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveAttribute('data-confidence-level', 'low');
    });
  });

  describe('Tooltip (AC14)', () => {
    it('should show info icon when showTooltip is true', () => {
      render(<ConfidenceBadge level="high" showTooltip />);

      // Info icon should be present
      const badge = screen.getByTestId('confidence-badge');
      const infoIcon = badge.querySelector('svg');
      expect(infoIcon).toBeInTheDocument();
    });

    it('should not show info icon when showTooltip is false', () => {
      render(<ConfidenceBadge level="high" showTooltip={false} />);

      const badge = screen.getByTestId('confidence-badge');
      const infoIcon = badge.querySelector('svg');
      expect(infoIcon).not.toBeInTheDocument();
    });

    it('should default showTooltip to true', () => {
      render(<ConfidenceBadge level="high" />);

      const badge = screen.getByTestId('confidence-badge');
      const infoIcon = badge.querySelector('svg');
      expect(infoIcon).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible aria-label with description', () => {
      render(<ConfidenceBadge level="high" />);

      // The button wrapper should have aria-label
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
      expect(button.getAttribute('aria-label')).toContain('High Confidence');
    });

    it('should be focusable when tooltip is shown', () => {
      render(<ConfidenceBadge level="medium" showTooltip />);

      const button = screen.getByRole('button');
      button.focus();
      expect(document.activeElement).toBe(button);
    });
  });

  describe('Custom className', () => {
    it('should apply custom className to badge', () => {
      render(<ConfidenceBadge level="high" className="custom-class" />);

      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveClass('custom-class');
    });
  });

  describe('Badge styling', () => {
    it('should have rounded-full class for pill shape', () => {
      render(<ConfidenceBadge level="high" />);

      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveClass('rounded-full');
    });

    it('should have border class', () => {
      render(<ConfidenceBadge level="high" />);

      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveClass('border');
    });

    it('should have appropriate padding', () => {
      render(<ConfidenceBadge level="high" />);

      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveClass('px-2.5');
      expect(badge).toHaveClass('py-1');
    });
  });
});

describe('ConfidenceIndicator', () => {
  it('should render with correct label for high', () => {
    render(<ConfidenceIndicator level="high" />);

    expect(screen.getByText('High Confidence')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('should render with correct label for medium', () => {
    render(<ConfidenceIndicator level="medium" />);

    expect(screen.getByText('Needs Review')).toBeInTheDocument();
    expect(screen.getByText('!')).toBeInTheDocument();
  });

  it('should render with correct label for low', () => {
    render(<ConfidenceIndicator level="low" />);

    expect(screen.getByText('Not Found')).toBeInTheDocument();
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('should have correct test id', () => {
    render(<ConfidenceIndicator level="high" />);

    expect(screen.getByTestId('confidence-indicator')).toBeInTheDocument();
  });

  it('should apply correct color classes', () => {
    const { rerender } = render(<ConfidenceIndicator level="high" />);
    expect(screen.getByTestId('confidence-indicator')).toHaveClass(
      'text-emerald-600'
    );

    rerender(<ConfidenceIndicator level="medium" />);
    expect(screen.getByTestId('confidence-indicator')).toHaveClass(
      'text-amber-600'
    );

    rerender(<ConfidenceIndicator level="low" />);
    expect(screen.getByTestId('confidence-indicator')).toHaveClass(
      'text-slate-500'
    );
  });

  it('should apply custom className', () => {
    render(<ConfidenceIndicator level="high" className="custom-indicator" />);

    expect(screen.getByTestId('confidence-indicator')).toHaveClass(
      'custom-indicator'
    );
  });

  it('should render smaller text (xs)', () => {
    render(<ConfidenceIndicator level="high" />);

    expect(screen.getByTestId('confidence-indicator')).toHaveClass('text-xs');
  });
});

describe('AC Requirements', () => {
  it('AC7: Confidence badge is rendered', () => {
    render(<ConfidenceBadge level="high" />);

    expect(screen.getByTestId('confidence-badge')).toBeInTheDocument();
  });

  it('AC9: High confidence shows green with checkmark', () => {
    render(<ConfidenceBadge level="high" />);

    const badge = screen.getByTestId('confidence-badge');
    expect(badge).toHaveClass('bg-emerald-500/10');
    expect(badge).toHaveClass('text-emerald-600');
    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getByText('High Confidence')).toBeInTheDocument();
  });

  it('AC10: Medium confidence shows amber with exclamation', () => {
    render(<ConfidenceBadge level="medium" />);

    const badge = screen.getByTestId('confidence-badge');
    expect(badge).toHaveClass('bg-amber-500/10');
    expect(badge).toHaveClass('text-amber-600');
    expect(screen.getByText('!')).toBeInTheDocument();
    expect(screen.getByText('Needs Review')).toBeInTheDocument();
  });

  it('AC11: Low confidence shows gray with question mark', () => {
    render(<ConfidenceBadge level="low" />);

    const badge = screen.getByTestId('confidence-badge');
    expect(badge).toHaveClass('bg-slate-500/10');
    expect(badge).toHaveClass('text-slate-500');
    expect(screen.getByText('?')).toBeInTheDocument();
    expect(screen.getByText('Not Found')).toBeInTheDocument();
  });

  it('AC14: Hover tooltip is available (info icon present)', () => {
    render(<ConfidenceBadge level="high" showTooltip />);

    const badge = screen.getByTestId('confidence-badge');
    const infoIcon = badge.querySelector('svg');
    expect(infoIcon).toBeInTheDocument();
  });
});

describe('All confidence levels', () => {
  const levels: ConfidenceLevel[] = ['high', 'medium', 'low'];

  levels.forEach((level) => {
    it(`should render ${level} level without errors`, () => {
      render(<ConfidenceBadge level={level} />);

      expect(screen.getByTestId('confidence-badge')).toBeInTheDocument();
    });
  });

  levels.forEach((level) => {
    it(`should render ${level} indicator without errors`, () => {
      render(<ConfidenceIndicator level={level} />);

      expect(screen.getByTestId('confidence-indicator')).toBeInTheDocument();
    });
  });
});
