/**
 * @vitest-environment happy-dom
 */
/**
 * Tests for OnboardingFlow Component
 * Story 18.1: Onboarding Flow & Guided Start
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingFlow } from '@/components/ai-buddy/onboarding/onboarding-flow';

describe('OnboardingFlow', () => {
  const mockOnComplete = vi.fn();
  const mockOnSkip = vi.fn();
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderFlow = (open = true) => {
    return render(
      <OnboardingFlow
        open={open}
        onOpenChange={mockOnOpenChange}
        onComplete={mockOnComplete}
        onSkip={mockOnSkip}
      />
    );
  };

  describe('Step 1: Welcome', () => {
    it('AC-18.1.1: renders welcome dialog on first step', () => {
      renderFlow();

      expect(screen.getByTestId('onboarding-dialog')).toBeInTheDocument();
      expect(screen.getByText('Welcome to AI Buddy!')).toBeInTheDocument();
    });

    it('AC-18.1.2: shows name input field', () => {
      renderFlow();

      expect(screen.getByTestId('name-input')).toBeInTheDocument();
      expect(screen.getByLabelText(/what should i call you/i)).toBeInTheDocument();
    });

    it('shows role selector', () => {
      renderFlow();

      expect(screen.getByTestId('role-select')).toBeInTheDocument();
    });

    it('Continue button is disabled when name is empty', () => {
      renderFlow();

      const continueButton = screen.getByTestId('continue-button');
      expect(continueButton).toBeDisabled();
    });

    it('Continue button is enabled when name is entered', () => {
      renderFlow();

      fireEvent.change(screen.getByTestId('name-input'), {
        target: { value: 'John' },
      });

      expect(screen.getByTestId('continue-button')).not.toBeDisabled();
    });

    it('proceeds to Step 2 when Continue is clicked', () => {
      renderFlow();

      fireEvent.change(screen.getByTestId('name-input'), {
        target: { value: 'John' },
      });
      fireEvent.click(screen.getByTestId('continue-button'));

      // Use heading role to specifically target the dialog title, not the step label
      expect(screen.getByRole('heading', { name: 'Lines of Business' })).toBeInTheDocument();
    });
  });

  describe('Step 2: Lines of Business', () => {
    const goToStep2 = () => {
      renderFlow();
      fireEvent.change(screen.getByTestId('name-input'), {
        target: { value: 'John' },
      });
      fireEvent.click(screen.getByTestId('continue-button'));
    };

    it('AC-18.1.3: shows LOB chip selection', () => {
      goToStep2();

      expect(screen.getByTestId('chip-select')).toBeInTheDocument();
      expect(screen.getByText('Personal Auto')).toBeInTheDocument();
      expect(screen.getByText('Homeowners')).toBeInTheDocument();
    });

    it('Continue is disabled until at least one LOB is selected', () => {
      goToStep2();

      const continueButton = screen.getByTestId('continue-button');
      expect(continueButton).toBeDisabled();
    });

    it('Continue is enabled after selecting an LOB', () => {
      goToStep2();

      fireEvent.click(screen.getByTestId('chip-personal-auto'));
      expect(screen.getByTestId('continue-button')).not.toBeDisabled();
    });

    it('AC-18.1.10: Back button returns to Step 1 with preserved name', () => {
      goToStep2();

      fireEvent.click(screen.getByTestId('back-button'));

      expect(screen.getByText('Welcome to AI Buddy!')).toBeInTheDocument();
      expect(screen.getByTestId('name-input')).toHaveValue('John');
    });
  });

  describe('Step 3: Favorite Carriers', () => {
    const goToStep3 = () => {
      renderFlow();
      fireEvent.change(screen.getByTestId('name-input'), {
        target: { value: 'John' },
      });
      fireEvent.click(screen.getByTestId('continue-button'));
      fireEvent.click(screen.getByTestId('chip-personal-auto'));
      fireEvent.click(screen.getByTestId('continue-button'));
    };

    it('AC-18.1.4: shows carrier chip selection', () => {
      goToStep3();

      expect(screen.getByText('Favorite Carriers')).toBeInTheDocument();
      expect(screen.getByText('Progressive')).toBeInTheDocument();
      expect(screen.getByText('Travelers')).toBeInTheDocument();
    });

    it('shows Start Chatting button', () => {
      goToStep3();

      expect(screen.getByTestId('start-chatting-button')).toBeInTheDocument();
    });

    it('calls onComplete with preferences when Start Chatting is clicked', async () => {
      mockOnComplete.mockResolvedValue(undefined);
      goToStep3();

      fireEvent.click(screen.getByTestId('chip-progressive'));
      fireEvent.click(screen.getByTestId('start-chatting-button'));

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith({
          displayName: 'John',
          role: undefined,
          linesOfBusiness: ['Personal Auto'],
          favoriteCarriers: ['Progressive'],
        });
      });
    });
  });

  describe('Skip Functionality', () => {
    it('AC-18.1.8: Skip button is visible on Step 1', () => {
      renderFlow();

      expect(screen.getByTestId('skip-button')).toBeInTheDocument();
    });

    it('AC-18.1.8: calls onSkip when Skip is clicked', async () => {
      mockOnSkip.mockResolvedValue(undefined);
      renderFlow();

      fireEvent.click(screen.getByTestId('skip-button'));

      await waitFor(() => {
        expect(mockOnSkip).toHaveBeenCalled();
      });
    });

    it('Skip is available on all steps', () => {
      renderFlow();

      // Step 1
      expect(screen.getByTestId('skip-button')).toBeInTheDocument();

      // Step 2
      fireEvent.change(screen.getByTestId('name-input'), {
        target: { value: 'John' },
      });
      fireEvent.click(screen.getByTestId('continue-button'));
      expect(screen.getByTestId('skip-button')).toBeInTheDocument();

      // Step 3
      fireEvent.click(screen.getByTestId('chip-personal-auto'));
      fireEvent.click(screen.getByTestId('continue-button'));
      expect(screen.getByTestId('skip-button')).toBeInTheDocument();
    });
  });

  describe('Progress Steps', () => {
    it('shows progress steps component', () => {
      renderFlow();

      expect(screen.getByTestId('progress-steps')).toBeInTheDocument();
    });

    it('progress updates as user advances through steps', () => {
      renderFlow();

      // Step 1
      expect(screen.getByTestId('step-1')).toHaveAttribute('data-state', 'current');

      // Go to Step 2
      fireEvent.change(screen.getByTestId('name-input'), {
        target: { value: 'John' },
      });
      fireEvent.click(screen.getByTestId('continue-button'));

      expect(screen.getByTestId('step-1')).toHaveAttribute('data-state', 'completed');
      expect(screen.getByTestId('step-2')).toHaveAttribute('data-state', 'current');
    });
  });
});
