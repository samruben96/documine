/**
 * @vitest-environment happy-dom
 */
/**
 * Communication Style Toggle Tests
 * Story 18.2: Preferences Management
 *
 * AC-18.2.7: Toggle between "Professional" and "Casual" communication styles
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommunicationStyleToggle } from '@/components/ai-buddy/communication-style-toggle';

describe('CommunicationStyleToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders toggle with professional selected by default', () => {
    const onChange = vi.fn();
    render(
      <CommunicationStyleToggle value="professional" onChange={onChange} />
    );

    expect(screen.getByTestId('communication-style-toggle')).toBeInTheDocument();

    // Professional option should be highlighted
    const professionalOption = screen.getByTestId('professional-option');
    expect(professionalOption).toHaveClass('border-primary');

    // Casual option should not be highlighted
    const casualOption = screen.getByTestId('casual-option');
    expect(casualOption).not.toHaveClass('border-primary');
  });

  it('renders toggle with casual selected', () => {
    const onChange = vi.fn();
    render(
      <CommunicationStyleToggle value="casual" onChange={onChange} />
    );

    // Casual option should be highlighted
    const casualOption = screen.getByTestId('casual-option');
    expect(casualOption).toHaveClass('border-primary');

    // Professional option should not be highlighted
    const professionalOption = screen.getByTestId('professional-option');
    expect(professionalOption).not.toHaveClass('border-primary');
  });

  it('calls onChange with casual when toggled on', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CommunicationStyleToggle value="professional" onChange={onChange} />
    );

    const toggle = screen.getByTestId('style-switch');
    await user.click(toggle);

    expect(onChange).toHaveBeenCalledWith('casual');
  });

  it('calls onChange with professional when toggled off', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CommunicationStyleToggle value="casual" onChange={onChange} />
    );

    const toggle = screen.getByTestId('style-switch');
    await user.click(toggle);

    expect(onChange).toHaveBeenCalledWith('professional');
  });

  it('shows descriptive text for both options', () => {
    render(
      <CommunicationStyleToggle value="professional" onChange={vi.fn()} />
    );

    expect(screen.getByText('Professional')).toBeInTheDocument();
    expect(screen.getByText(/Formal, structured responses/)).toBeInTheDocument();

    expect(screen.getByText('Casual')).toBeInTheDocument();
    expect(screen.getByText(/Friendly, conversational tone/)).toBeInTheDocument();
  });

  it('disables toggle when disabled prop is true', () => {
    render(
      <CommunicationStyleToggle value="professional" onChange={vi.fn()} disabled />
    );

    const toggle = screen.getByTestId('style-switch');
    expect(toggle).toBeDisabled();
  });

  it('applies custom className', () => {
    render(
      <CommunicationStyleToggle
        value="professional"
        onChange={vi.fn()}
        className="custom-class"
      />
    );

    const container = screen.getByTestId('communication-style-toggle');
    expect(container).toHaveClass('custom-class');
  });
});
