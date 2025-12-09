/**
 * @vitest-environment happy-dom
 */
/**
 * Tests for ProgressSteps Component
 * Story 18.1: Onboarding Flow & Guided Start
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressSteps } from '@/components/ai-buddy/onboarding/progress-steps';

describe('ProgressSteps', () => {
  it('renders correct number of steps', () => {
    render(<ProgressSteps currentStep={1} totalSteps={3} />);

    expect(screen.getByTestId('step-1')).toBeInTheDocument();
    expect(screen.getByTestId('step-2')).toBeInTheDocument();
    expect(screen.getByTestId('step-3')).toBeInTheDocument();
  });

  it('marks completed steps correctly', () => {
    render(<ProgressSteps currentStep={2} totalSteps={3} />);

    const step1 = screen.getByTestId('step-1');
    const step2 = screen.getByTestId('step-2');
    const step3 = screen.getByTestId('step-3');

    expect(step1).toHaveAttribute('data-state', 'completed');
    expect(step2).toHaveAttribute('data-state', 'current');
    expect(step3).toHaveAttribute('data-state', 'upcoming');
  });

  it('shows check icon for completed steps', () => {
    render(<ProgressSteps currentStep={3} totalSteps={3} />);

    // Steps 1 and 2 should be completed and show checkmarks (not numbers)
    const step1 = screen.getByTestId('step-1');
    const step2 = screen.getByTestId('step-2');

    expect(step1.textContent).not.toBe('1');
    expect(step2.textContent).not.toBe('2');
  });

  it('shows step number for current and upcoming steps', () => {
    render(<ProgressSteps currentStep={1} totalSteps={3} />);

    expect(screen.getByTestId('step-1').textContent).toBe('1');
    expect(screen.getByTestId('step-2').textContent).toBe('2');
    expect(screen.getByTestId('step-3').textContent).toBe('3');
  });

  it('renders labels when provided', () => {
    const labels = ['Welcome', 'Lines of Business', 'Carriers'];
    render(<ProgressSteps currentStep={1} totalSteps={3} labels={labels} />);

    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('Lines of Business')).toBeInTheDocument();
    expect(screen.getByText('Carriers')).toBeInTheDocument();
  });

  it('has correct aria attributes for accessibility', () => {
    render(<ProgressSteps currentStep={2} totalSteps={3} />);

    const progressBar = screen.getByTestId('progress-steps');
    expect(progressBar).toHaveAttribute('role', 'progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '2');
    expect(progressBar).toHaveAttribute('aria-valuemin', '1');
    expect(progressBar).toHaveAttribute('aria-valuemax', '3');
  });

  it('marks current step with aria-current', () => {
    render(<ProgressSteps currentStep={2} totalSteps={3} />);

    const step2 = screen.getByTestId('step-2');
    expect(step2).toHaveAttribute('aria-current', 'step');

    const step1 = screen.getByTestId('step-1');
    expect(step1).not.toHaveAttribute('aria-current');
  });
});
