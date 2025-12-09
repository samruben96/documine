/**
 * @vitest-environment happy-dom
 */
/**
 * Tests for ChipSelect Component
 * Story 18.1: Onboarding Flow & Guided Start
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChipSelect } from '@/components/ai-buddy/onboarding/chip-select';

const OPTIONS = ['Personal Auto', 'Homeowners', 'Commercial Auto', 'Workers Compensation'];

describe('ChipSelect', () => {
  it('renders all options as chips', () => {
    render(
      <ChipSelect options={OPTIONS} selected={[]} onChange={() => {}} />
    );

    OPTIONS.forEach((option) => {
      const chipTestId = `chip-${option.replace(/\s+/g, '-').toLowerCase()}`;
      expect(screen.getByTestId(chipTestId)).toBeInTheDocument();
    });
  });

  it('marks selected options with data-selected', () => {
    render(
      <ChipSelect
        options={OPTIONS}
        selected={['Personal Auto', 'Homeowners']}
        onChange={() => {}}
      />
    );

    expect(screen.getByTestId('chip-personal-auto')).toHaveAttribute('data-selected', 'true');
    expect(screen.getByTestId('chip-homeowners')).toHaveAttribute('data-selected', 'true');
    expect(screen.getByTestId('chip-commercial-auto')).toHaveAttribute('data-selected', 'false');
  });

  it('calls onChange when chip is clicked', () => {
    const onChange = vi.fn();
    render(
      <ChipSelect options={OPTIONS} selected={[]} onChange={onChange} />
    );

    fireEvent.click(screen.getByTestId('chip-personal-auto'));

    expect(onChange).toHaveBeenCalledWith(['Personal Auto']);
  });

  it('removes item from selected when already selected', () => {
    const onChange = vi.fn();
    render(
      <ChipSelect
        options={OPTIONS}
        selected={['Personal Auto', 'Homeowners']}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByTestId('chip-personal-auto'));

    expect(onChange).toHaveBeenCalledWith(['Homeowners']);
  });

  it('prevents deselecting below minSelection', () => {
    const onChange = vi.fn();
    render(
      <ChipSelect
        options={OPTIONS}
        selected={['Personal Auto']}
        onChange={onChange}
        minSelection={1}
      />
    );

    fireEvent.click(screen.getByTestId('chip-personal-auto'));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows selection count when minSelection is set', () => {
    render(
      <ChipSelect
        options={OPTIONS}
        selected={['Personal Auto', 'Homeowners']}
        onChange={() => {}}
        minSelection={1}
        label="Select options"
      />
    );

    expect(screen.getByTestId('selection-count')).toHaveTextContent('2 selected');
  });

  it('shows warning when below minSelection', () => {
    render(
      <ChipSelect
        options={OPTIONS}
        selected={[]}
        onChange={() => {}}
        minSelection={1}
        label="Select options"
      />
    );

    expect(screen.getByTestId('min-selection-warning')).toBeInTheDocument();
    expect(screen.getByTestId('min-selection-warning')).toHaveTextContent('Please select at least 1 option');
  });

  it('renders label when provided', () => {
    render(
      <ChipSelect
        options={OPTIONS}
        selected={[]}
        onChange={() => {}}
        label="Select your lines of business"
      />
    );

    expect(screen.getByText('Select your lines of business')).toBeInTheDocument();
  });

  it('has correct aria-pressed attribute', () => {
    render(
      <ChipSelect
        options={OPTIONS}
        selected={['Personal Auto']}
        onChange={() => {}}
      />
    );

    expect(screen.getByTestId('chip-personal-auto')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('chip-homeowners')).toHaveAttribute('aria-pressed', 'false');
  });
});
