/**
 * @vitest-environment happy-dom
 */
/**
 * SuggestedPrompts Component Tests
 * Epic 23: Flexible AI Reports
 * Story 23.3: Prompt Input UI
 *
 * AC-23.3.3: Suggested prompts from analysis API are clickable chips that populate the input
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SuggestedPrompts } from '@/components/reporting/suggested-prompts';

describe('SuggestedPrompts Component', () => {
  const defaultPrompts = [
    'Show monthly totals',
    'Compare by category',
    'Find top 10 items',
    'Analyze trends over time',
  ];

  const defaultProps = {
    prompts: defaultPrompts,
    onSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-23.3.3: Clickable chips render correctly', () => {
    it('renders all prompts as buttons', () => {
      render(<SuggestedPrompts {...defaultProps} />);

      defaultPrompts.forEach((prompt) => {
        expect(screen.getByRole('button', { name: new RegExp(prompt) })).toBeInTheDocument();
      });
    });

    it('renders 3-5 chips (typical API response)', () => {
      render(<SuggestedPrompts {...defaultProps} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(3);
      expect(buttons.length).toBeLessThanOrEqual(5);
    });

    it('renders with AI Suggestions label', () => {
      render(<SuggestedPrompts {...defaultProps} />);
      expect(screen.getByText('AI Suggestions:')).toBeInTheDocument();
    });

    it('returns null when prompts array is empty', () => {
      const { container } = render(
        <SuggestedPrompts prompts={[]} onSelect={vi.fn()} />
      );
      expect(container).toBeEmptyDOMElement();
    });

    it('returns null when prompts is undefined', () => {
      const { container } = render(
        // @ts-expect-error - testing undefined case
        <SuggestedPrompts prompts={undefined} onSelect={vi.fn()} />
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('AC-23.3.3: Clicking chip populates textarea', () => {
    it('calls onSelect with prompt text when chip is clicked', async () => {
      const onSelect = vi.fn();
      render(<SuggestedPrompts {...defaultProps} onSelect={onSelect} />);

      const chip = screen.getByRole('button', { name: /Show monthly totals/i });
      await userEvent.click(chip);

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith('Show monthly totals');
    });

    it('calls onSelect with correct prompt for each chip', async () => {
      const onSelect = vi.fn();
      render(<SuggestedPrompts {...defaultProps} onSelect={onSelect} />);

      for (const prompt of defaultPrompts) {
        const chip = screen.getByRole('button', { name: new RegExp(prompt) });
        await userEvent.click(chip);
        expect(onSelect).toHaveBeenLastCalledWith(prompt);
      }
    });
  });

  describe('Visual feedback on hover/click', () => {
    it('chips have hover styling classes', () => {
      render(<SuggestedPrompts {...defaultProps} />);
      const chip = screen.getByRole('button', { name: /Show monthly totals/i });

      expect(chip).toHaveClass('hover:bg-blue-100');
      expect(chip).toHaveClass('hover:scale-[1.02]');
    });

    it('chips have active/click styling', () => {
      render(<SuggestedPrompts {...defaultProps} />);
      const chip = screen.getByRole('button', { name: /Show monthly totals/i });

      expect(chip).toHaveClass('active:scale-[0.98]');
    });

    it('chips have proper base styling', () => {
      render(<SuggestedPrompts {...defaultProps} />);
      const chip = screen.getByRole('button', { name: /Show monthly totals/i });

      expect(chip).toHaveClass('bg-blue-50');
      expect(chip).toHaveClass('text-blue-700');
      expect(chip).toHaveClass('rounded-full');
    });
  });

  describe('Accessible keyboard navigation', () => {
    it('chips are focusable with Tab', async () => {
      render(<SuggestedPrompts {...defaultProps} />);
      const chips = screen.getAllByRole('button');

      chips[0].focus();
      expect(chips[0]).toHaveFocus();

      await userEvent.tab();
      expect(chips[1]).toHaveFocus();
    });

    it('chips can be activated with Enter key', async () => {
      const onSelect = vi.fn();
      render(<SuggestedPrompts {...defaultProps} onSelect={onSelect} />);

      const chip = screen.getByRole('button', { name: /Show monthly totals/i });
      chip.focus();
      await userEvent.keyboard('{Enter}');

      expect(onSelect).toHaveBeenCalledWith('Show monthly totals');
    });

    it('chips can be activated with Space key', async () => {
      const onSelect = vi.fn();
      render(<SuggestedPrompts {...defaultProps} onSelect={onSelect} />);

      const chip = screen.getByRole('button', { name: /Show monthly totals/i });
      chip.focus();
      await userEvent.keyboard(' ');

      expect(onSelect).toHaveBeenCalledWith('Show monthly totals');
    });

    it('chips have focus ring styling', () => {
      render(<SuggestedPrompts {...defaultProps} />);
      const chip = screen.getByRole('button', { name: /Show monthly totals/i });

      expect(chip).toHaveClass('focus:ring-2');
      expect(chip).toHaveClass('focus:ring-blue-500');
    });

    it('chip group has proper ARIA role', () => {
      render(<SuggestedPrompts {...defaultProps} />);
      const group = screen.getByRole('group', { name: 'Suggested prompts' });
      expect(group).toBeInTheDocument();
    });

    it('each chip has aria-label with context', () => {
      render(<SuggestedPrompts {...defaultProps} />);
      const chip = screen.getByRole('button', { name: /Use suggestion: Show monthly totals/i });
      expect(chip).toBeInTheDocument();
    });
  });

  describe('Disabled state', () => {
    it('disables all chips when disabled prop is true', () => {
      render(<SuggestedPrompts {...defaultProps} disabled />);

      const chips = screen.getAllByRole('button');
      chips.forEach((chip) => {
        expect(chip).toBeDisabled();
      });
    });

    it('does not call onSelect when disabled', async () => {
      const onSelect = vi.fn();
      render(<SuggestedPrompts {...defaultProps} onSelect={onSelect} disabled />);

      const chip = screen.getByRole('button', { name: /Show monthly totals/i });
      await userEvent.click(chip);

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('applies disabled styling', () => {
      render(<SuggestedPrompts {...defaultProps} disabled />);
      const chip = screen.getByRole('button', { name: /Show monthly totals/i });

      expect(chip).toHaveClass('opacity-50');
      expect(chip).toHaveClass('cursor-not-allowed');
    });
  });

  describe('Custom className', () => {
    it('applies custom className to container', () => {
      const { container } = render(
        <SuggestedPrompts {...defaultProps} className="custom-class" />
      );
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('custom-class');
    });
  });
});
