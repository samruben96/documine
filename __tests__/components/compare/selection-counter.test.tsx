/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SelectionCounter } from '@/components/compare/selection-counter';

describe('SelectionCounter', () => {
  describe('AC-7.1.3: Selection count display', () => {
    it('renders selected count', () => {
      render(<SelectionCounter selected={2} max={4} min={2} />);

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('renders max count', () => {
      render(<SelectionCounter selected={2} max={4} min={2} />);

      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('renders "selected" text', () => {
      render(<SelectionCounter selected={2} max={4} min={2} />);

      expect(screen.getByText('selected')).toBeInTheDocument();
    });
  });

  describe('Helper text', () => {
    it('shows "Select at least X documents" when none selected', () => {
      render(<SelectionCounter selected={0} max={4} min={2} />);

      expect(screen.getByText('Select at least 2 documents to compare')).toBeInTheDocument();
    });

    it('shows "Select X more" when 1 selected and min is 2', () => {
      render(<SelectionCounter selected={1} max={4} min={2} />);

      expect(screen.getByText('Select 1 more to compare')).toBeInTheDocument();
    });

    it('shows "Maximum reached" when at max', () => {
      render(<SelectionCounter selected={4} max={4} min={2} />);

      expect(screen.getByText('Maximum reached')).toBeInTheDocument();
    });

    it('does not show helper text when between min and max', () => {
      render(<SelectionCounter selected={3} max={4} min={2} />);

      expect(screen.queryByText(/Select at least/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Select.*more/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Maximum reached/)).not.toBeInTheDocument();
    });
  });

  describe('Visual styling', () => {
    it('applies empty styling when 0 selected', () => {
      const { container } = render(<SelectionCounter selected={0} max={4} min={2} />);

      const badge = container.querySelector('.bg-slate-100');
      expect(badge).toBeInTheDocument();
    });

    it('applies active styling when between 0 and max', () => {
      const { container } = render(<SelectionCounter selected={2} max={4} min={2} />);

      const badge = container.querySelector('.bg-blue-100');
      expect(badge).toBeInTheDocument();
    });

    it('applies max styling when at max', () => {
      const { container } = render(<SelectionCounter selected={4} max={4} min={2} />);

      const badge = container.querySelector('.bg-blue-100');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('works with min=1', () => {
      render(<SelectionCounter selected={0} max={4} min={1} />);

      expect(screen.getByText('Select at least 1 documents to compare')).toBeInTheDocument();
    });

    it('works with different max values', () => {
      render(<SelectionCounter selected={2} max={10} min={2} />);

      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });
});
