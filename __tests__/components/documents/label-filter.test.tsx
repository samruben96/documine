/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LabelFilter } from '@/components/documents/label-filter';

describe('LabelFilter', () => {
  const mockLabels = [
    { id: 'label-1', agency_id: 'agency-1', name: 'Important', color: '#3b82f6', created_at: '2024-01-01' },
    { id: 'label-2', agency_id: 'agency-1', name: 'Urgent', color: '#ef4444', created_at: '2024-01-01' },
    { id: 'label-3', agency_id: 'agency-1', name: 'Review', color: '#22c55e', created_at: '2024-01-01' },
  ];

  describe('AC-4.5.9: Filter by Label', () => {
    it('renders filter button with Labels text', () => {
      render(
        <LabelFilter
          allLabels={mockLabels}
          selectedLabelIds={[]}
          onSelectionChange={vi.fn()}
        />
      );
      expect(screen.getByText('Labels')).toBeInTheDocument();
    });

    it('opens dropdown when button is clicked', () => {
      render(
        <LabelFilter
          allLabels={mockLabels}
          selectedLabelIds={[]}
          onSelectionChange={vi.fn()}
        />
      );
      fireEvent.click(screen.getByText('Labels'));
      expect(screen.getByText('Important')).toBeInTheDocument();
      expect(screen.getByText('Urgent')).toBeInTheDocument();
      expect(screen.getByText('Review')).toBeInTheDocument();
    });

    it('shows badge count when labels are selected', () => {
      render(
        <LabelFilter
          allLabels={mockLabels}
          selectedLabelIds={['label-1', 'label-2']}
          onSelectionChange={vi.fn()}
        />
      );
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('calls onSelectionChange when label is clicked', () => {
      const onSelectionChange = vi.fn();
      render(
        <LabelFilter
          allLabels={mockLabels}
          selectedLabelIds={[]}
          onSelectionChange={onSelectionChange}
        />
      );
      fireEvent.click(screen.getByText('Labels'));
      fireEvent.click(screen.getByText('Important'));
      expect(onSelectionChange).toHaveBeenCalledWith(['label-1']);
    });

    it('removes label from selection when already selected', () => {
      const onSelectionChange = vi.fn();
      render(
        <LabelFilter
          allLabels={mockLabels}
          selectedLabelIds={['label-1']}
          onSelectionChange={onSelectionChange}
        />
      );
      fireEvent.click(screen.getByText('Labels'));
      fireEvent.click(screen.getByText('Important'));
      expect(onSelectionChange).toHaveBeenCalledWith([]);
    });

    it('shows Clear filter option when labels are selected', () => {
      render(
        <LabelFilter
          allLabels={mockLabels}
          selectedLabelIds={['label-1']}
          onSelectionChange={vi.fn()}
        />
      );
      fireEvent.click(screen.getByText('Labels'));
      expect(screen.getByText('Clear filter')).toBeInTheDocument();
    });

    it('clears all selections when Clear filter is clicked', () => {
      const onSelectionChange = vi.fn();
      render(
        <LabelFilter
          allLabels={mockLabels}
          selectedLabelIds={['label-1', 'label-2']}
          onSelectionChange={onSelectionChange}
        />
      );
      fireEvent.click(screen.getByText('Labels'));
      fireEvent.click(screen.getByText('Clear filter'));
      expect(onSelectionChange).toHaveBeenCalledWith([]);
    });

    it('shows checkmark on selected labels', () => {
      render(
        <LabelFilter
          allLabels={mockLabels}
          selectedLabelIds={['label-1']}
          onSelectionChange={vi.fn()}
        />
      );
      fireEvent.click(screen.getByText('Labels'));
      const importantOption = screen.getByRole('option', { name: /important/i });
      expect(importantOption).toHaveAttribute('aria-selected', 'true');
    });

    it('shows "No labels yet" when allLabels is empty', () => {
      render(
        <LabelFilter
          allLabels={[]}
          selectedLabelIds={[]}
          onSelectionChange={vi.fn()}
        />
      );
      fireEvent.click(screen.getByText('Labels'));
      expect(screen.getByText('No labels yet')).toBeInTheDocument();
    });
  });

  describe('visual indicator for active filter', () => {
    it('applies different styling when labels are selected', () => {
      const { rerender } = render(
        <LabelFilter
          allLabels={mockLabels}
          selectedLabelIds={[]}
          onSelectionChange={vi.fn()}
        />
      );

      const button = screen.getByRole('button', { expanded: false });
      expect(button).toHaveClass('bg-white');

      rerender(
        <LabelFilter
          allLabels={mockLabels}
          selectedLabelIds={['label-1']}
          onSelectionChange={vi.fn()}
        />
      );

      expect(button).toHaveClass('bg-slate-100');
    });
  });
});
