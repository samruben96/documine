/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LabelPill } from '@/components/documents/label-pill';

describe('LabelPill', () => {
  const defaultProps = {
    id: 'label-1',
    name: 'Important',
    color: '#3b82f6',
  };

  describe('AC-4.5.7: Label Display', () => {
    it('renders label name', () => {
      render(<LabelPill {...defaultProps} />);
      expect(screen.getByText('Important')).toBeInTheDocument();
    });

    it('applies label color to styling', () => {
      render(<LabelPill {...defaultProps} />);
      const pill = screen.getByText('Important').closest('span');
      expect(pill).toHaveStyle({ color: '#3b82f6' });
    });

    it('uses default color when color is null', () => {
      render(<LabelPill {...defaultProps} color={null} />);
      const pill = screen.getByText('Important').closest('span');
      expect(pill).toHaveStyle({ color: '#64748b' });
    });
  });

  describe('AC-4.5.8: Label Removal', () => {
    it('shows X button when onRemove is provided', () => {
      const onRemove = vi.fn();
      render(<LabelPill {...defaultProps} onRemove={onRemove} />);
      expect(screen.getByRole('button', { name: /remove important label/i })).toBeInTheDocument();
    });

    it('does not show X button when onRemove is not provided', () => {
      render(<LabelPill {...defaultProps} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('calls onRemove with label id when X button is clicked', () => {
      const onRemove = vi.fn();
      render(<LabelPill {...defaultProps} onRemove={onRemove} />);
      fireEvent.click(screen.getByRole('button', { name: /remove important label/i }));
      expect(onRemove).toHaveBeenCalledWith('label-1');
    });

    it('stops event propagation on X button click', () => {
      const onRemove = vi.fn();
      const onClick = vi.fn();
      render(
        <div onClick={onClick}>
          <LabelPill {...defaultProps} onRemove={onRemove} />
        </div>
      );
      fireEvent.click(screen.getByRole('button', { name: /remove important label/i }));
      expect(onRemove).toHaveBeenCalled();
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('truncation', () => {
    it('truncates long label names', () => {
      render(
        <LabelPill
          {...defaultProps}
          name="This is a very long label name that should be truncated"
        />
      );
      const nameSpan = screen.getByText('This is a very long label name that should be truncated');
      expect(nameSpan).toHaveClass('truncate');
    });
  });
});
