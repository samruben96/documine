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

    // DR.7: Updated to use status-success colors (green-100/green-700)
    it('should render with green styling', () => {
      render(<ConfidenceBadge level="high" />);

      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveClass('bg-green-100');
      expect(badge).toHaveClass('text-green-700');
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

    // DR.7: Updated to use status-progress colors (amber-100/amber-700)
    it('should render with amber styling', () => {
      render(<ConfidenceBadge level="medium" />);

      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveClass('bg-amber-100');
      expect(badge).toHaveClass('text-amber-700');
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

    // DR.7: Updated to use status-default colors (slate-100/slate-600)
    it('should render with gray/slate styling', () => {
      render(<ConfidenceBadge level="low" />);

      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveClass('bg-slate-100');
      expect(badge).toHaveClass('text-slate-600');
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
    // DR.7: Changed from rounded-full to rounded for consistent badge styling
    it('should have rounded class for badge shape', () => {
      render(<ConfidenceBadge level="high" />);

      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveClass('rounded');
    });

    // DR.7: Badge uses border-transparent, so check for that
    it('should have border class', () => {
      render(<ConfidenceBadge level="high" />);

      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveClass('border-transparent');
    });

    // DR.7: Updated to use DR.7 standard padding (px-2 py-0.5)
    it('should have appropriate padding', () => {
      render(<ConfidenceBadge level="high" />);

      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveClass('px-2');
      expect(badge).toHaveClass('py-0.5');
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

  // DR.7: Updated to use status variant colors
  it('should apply correct color classes', () => {
    const { rerender } = render(<ConfidenceIndicator level="high" />);
    expect(screen.getByTestId('confidence-indicator')).toHaveClass(
      'text-green-700'
    );

    rerender(<ConfidenceIndicator level="medium" />);
    expect(screen.getByTestId('confidence-indicator')).toHaveClass(
      'text-amber-700'
    );

    rerender(<ConfidenceIndicator level="low" />);
    expect(screen.getByTestId('confidence-indicator')).toHaveClass(
      'text-slate-600'
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

  // DR.7: Updated to use status variant colors
  it('AC9: High confidence shows green with checkmark', () => {
    render(<ConfidenceBadge level="high" />);

    const badge = screen.getByTestId('confidence-badge');
    expect(badge).toHaveClass('bg-green-100');
    expect(badge).toHaveClass('text-green-700');
    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getByText('High Confidence')).toBeInTheDocument();
  });

  // DR.7: Updated to use status variant colors
  it('AC10: Medium confidence shows amber with exclamation', () => {
    render(<ConfidenceBadge level="medium" />);

    const badge = screen.getByTestId('confidence-badge');
    expect(badge).toHaveClass('bg-amber-100');
    expect(badge).toHaveClass('text-amber-700');
    expect(screen.getByText('!')).toBeInTheDocument();
    expect(screen.getByText('Needs Review')).toBeInTheDocument();
  });

  // DR.7: Updated to use status variant colors
  it('AC11: Low confidence shows gray with question mark', () => {
    render(<ConfidenceBadge level="low" />);

    const badge = screen.getByTestId('confidence-badge');
    expect(badge).toHaveClass('bg-slate-100');
    expect(badge).toHaveClass('text-slate-600');
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
