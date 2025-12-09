/**
 * AI Disclosure Editor Component Tests
 * Story 19.4: AI Disclosure Message
 *
 * Tests for the AIDisclosureEditor component covering:
 * - AC-19.4.1: Editor renders in Guardrails section
 * - AC-19.4.2: Placeholder text when empty
 * - AC-19.4.3: Auto-save with debounce
 *
 * @vitest-environment happy-dom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AIDisclosureEditor } from '@/components/ai-buddy/admin/ai-disclosure-editor';

// Mock use-debounce
vi.mock('use-debounce', () => ({
  useDebouncedCallback: (callback: (value: string) => void) => callback,
}));

describe('AIDisclosureEditor', () => {
  const mockOnChange = vi.fn();
  const mockOnEnabledChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // AC-19.4.1: Editor renders in Guardrails section
  describe('rendering', () => {
    it('renders editor with enabled toggle', () => {
      render(
        <AIDisclosureEditor
          value={null}
          enabled={true}
          onChange={mockOnChange}
          onEnabledChange={mockOnEnabledChange}
        />
      );

      expect(screen.getByTestId('ai-disclosure-editor')).toBeInTheDocument();
      expect(screen.getByTestId('ai-disclosure-enabled-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('ai-disclosure-textarea')).toBeInTheDocument();
    });

    it('hides textarea when disabled', () => {
      render(
        <AIDisclosureEditor
          value={null}
          enabled={false}
          onChange={mockOnChange}
          onEnabledChange={mockOnEnabledChange}
        />
      );

      expect(screen.getByTestId('ai-disclosure-editor')).toBeInTheDocument();
      expect(screen.getByTestId('ai-disclosure-enabled-toggle')).toBeInTheDocument();
      expect(screen.queryByTestId('ai-disclosure-textarea')).not.toBeInTheDocument();
    });

    it('renders with existing disclosure message', () => {
      const existingMessage = 'You are chatting with an AI assistant.';
      render(
        <AIDisclosureEditor
          value={existingMessage}
          enabled={true}
          onChange={mockOnChange}
          onEnabledChange={mockOnEnabledChange}
        />
      );

      const textarea = screen.getByTestId('ai-disclosure-textarea');
      expect(textarea).toHaveValue(existingMessage);
    });
  });

  // AC-19.4.2: Placeholder text when empty
  describe('placeholder text', () => {
    it('shows placeholder when value is null', () => {
      render(
        <AIDisclosureEditor
          value={null}
          enabled={true}
          onChange={mockOnChange}
          onEnabledChange={mockOnEnabledChange}
        />
      );

      const textarea = screen.getByTestId('ai-disclosure-textarea');
      expect(textarea).toHaveAttribute('placeholder');
      expect(textarea.getAttribute('placeholder')).toContain('Example:');
    });

    it('shows placeholder when value is empty string', () => {
      render(
        <AIDisclosureEditor
          value=""
          enabled={true}
          onChange={mockOnChange}
          onEnabledChange={mockOnEnabledChange}
        />
      );

      const textarea = screen.getByTestId('ai-disclosure-textarea');
      expect(textarea).toHaveValue('');
      expect(textarea).toHaveAttribute('placeholder');
    });
  });

  // Character count display
  describe('character count', () => {
    it('displays character count', () => {
      render(
        <AIDisclosureEditor
          value="Test message"
          enabled={true}
          onChange={mockOnChange}
          onEnabledChange={mockOnEnabledChange}
        />
      );

      expect(screen.getByTestId('ai-disclosure-char-count')).toHaveTextContent('12 / 500');
    });

    it('updates character count on input', async () => {
      const user = userEvent.setup();
      render(
        <AIDisclosureEditor
          value=""
          enabled={true}
          onChange={mockOnChange}
          onEnabledChange={mockOnEnabledChange}
        />
      );

      const textarea = screen.getByTestId('ai-disclosure-textarea');
      await user.type(textarea, 'Hello');

      expect(screen.getByTestId('ai-disclosure-char-count')).toHaveTextContent('5 / 500');
    });

    it('shows warning style when over recommended limit', () => {
      const longMessage = 'a'.repeat(501);
      render(
        <AIDisclosureEditor
          value={longMessage}
          enabled={true}
          onChange={mockOnChange}
          onEnabledChange={mockOnEnabledChange}
        />
      );

      const charCount = screen.getByTestId('ai-disclosure-char-count');
      expect(charCount).toHaveTextContent('501 / 500');
      expect(charCount).toHaveClass('text-amber-600');
    });
  });

  // AC-19.4.3: onChange callback fires with debounce
  describe('onChange behavior', () => {
    it('calls onChange when text is entered', async () => {
      const user = userEvent.setup();
      render(
        <AIDisclosureEditor
          value=""
          enabled={true}
          onChange={mockOnChange}
          onEnabledChange={mockOnEnabledChange}
        />
      );

      const textarea = screen.getByTestId('ai-disclosure-textarea');
      await user.type(textarea, 'New disclosure');

      // With mocked debounce, onChange should be called for each character
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('calls onChange with null for empty string', async () => {
      const user = userEvent.setup();
      render(
        <AIDisclosureEditor
          value="Test"
          enabled={true}
          onChange={mockOnChange}
          onEnabledChange={mockOnEnabledChange}
        />
      );

      const textarea = screen.getByTestId('ai-disclosure-textarea');
      await user.clear(textarea);

      expect(mockOnChange).toHaveBeenCalledWith(null);
    });

    it('trims whitespace from message', async () => {
      const user = userEvent.setup();
      render(
        <AIDisclosureEditor
          value=""
          enabled={true}
          onChange={mockOnChange}
          onEnabledChange={mockOnEnabledChange}
        />
      );

      const textarea = screen.getByTestId('ai-disclosure-textarea');
      await user.type(textarea, '  Test message  ');

      // Should trim the value
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenLastCalledWith('Test message');
      });
    });
  });

  // Enabled toggle
  describe('enabled toggle', () => {
    it('calls onEnabledChange when toggle is clicked', async () => {
      const user = userEvent.setup();
      render(
        <AIDisclosureEditor
          value="Test"
          enabled={true}
          onChange={mockOnChange}
          onEnabledChange={mockOnEnabledChange}
        />
      );

      const toggle = screen.getByTestId('ai-disclosure-enabled-toggle');
      await user.click(toggle);

      expect(mockOnEnabledChange).toHaveBeenCalledWith(false);
    });

    it('shows info icon for state compliance info', async () => {
      render(
        <AIDisclosureEditor
          value={null}
          enabled={true}
          onChange={mockOnChange}
          onEnabledChange={mockOnEnabledChange}
        />
      );

      // Info icon should be present (SVG with lucide-info class)
      const editor = screen.getByTestId('ai-disclosure-editor');
      const infoIcon = editor.querySelector('.lucide-info');
      expect(infoIcon).toBeInTheDocument();
    });
  });

  // Preview functionality
  describe('preview', () => {
    it('shows preview toggle button', () => {
      render(
        <AIDisclosureEditor
          value="Test message"
          enabled={true}
          onChange={mockOnChange}
          onEnabledChange={mockOnEnabledChange}
        />
      );

      expect(screen.getByTestId('ai-disclosure-preview-toggle')).toBeInTheDocument();
    });

    it('shows preview when toggle is clicked', async () => {
      const user = userEvent.setup();
      render(
        <AIDisclosureEditor
          value="Test disclosure message"
          enabled={true}
          onChange={mockOnChange}
          onEnabledChange={mockOnEnabledChange}
        />
      );

      const previewToggle = screen.getByTestId('ai-disclosure-preview-toggle');
      await user.click(previewToggle);

      // Preview should show the AIDisclosureBanner with the message
      expect(screen.getByTestId('ai-disclosure-banner')).toBeInTheDocument();
      // Use getAllByText since text might appear in multiple places
      const messageElements = screen.getAllByText('Test disclosure message');
      expect(messageElements.length).toBeGreaterThan(0);
    });

    it('hides preview when toggle is clicked again', async () => {
      const user = userEvent.setup();
      render(
        <AIDisclosureEditor
          value="Test message"
          enabled={true}
          onChange={mockOnChange}
          onEnabledChange={mockOnEnabledChange}
        />
      );

      const previewToggle = screen.getByTestId('ai-disclosure-preview-toggle');

      // Show preview
      await user.click(previewToggle);
      expect(screen.getByTestId('ai-disclosure-banner')).toBeInTheDocument();

      // Hide preview
      await user.click(previewToggle);
      expect(screen.queryByTestId('ai-disclosure-banner')).not.toBeInTheDocument();
    });

    it('shows empty preview message when no text entered', async () => {
      const user = userEvent.setup();
      render(
        <AIDisclosureEditor
          value=""
          enabled={true}
          onChange={mockOnChange}
          onEnabledChange={mockOnEnabledChange}
        />
      );

      const previewToggle = screen.getByTestId('ai-disclosure-preview-toggle');
      await user.click(previewToggle);

      // Should show placeholder message instead of banner
      expect(screen.queryByTestId('ai-disclosure-banner')).not.toBeInTheDocument();
      expect(screen.getByText(/Enter a disclosure message above/)).toBeInTheDocument();
    });
  });

  // Loading state
  describe('loading state', () => {
    it('disables textarea when loading', () => {
      render(
        <AIDisclosureEditor
          value="Test"
          enabled={true}
          onChange={mockOnChange}
          onEnabledChange={mockOnEnabledChange}
          isLoading={true}
        />
      );

      expect(screen.getByTestId('ai-disclosure-textarea')).toBeDisabled();
    });

    it('disables toggle when loading', () => {
      render(
        <AIDisclosureEditor
          value="Test"
          enabled={true}
          onChange={mockOnChange}
          onEnabledChange={mockOnEnabledChange}
          isLoading={true}
        />
      );

      expect(screen.getByTestId('ai-disclosure-enabled-toggle')).toBeDisabled();
    });
  });

  // Accessibility
  describe('accessibility', () => {
    it('has associated label for textarea', () => {
      render(
        <AIDisclosureEditor
          value={null}
          enabled={true}
          onChange={mockOnChange}
          onEnabledChange={mockOnEnabledChange}
        />
      );

      const textarea = screen.getByTestId('ai-disclosure-textarea');
      expect(textarea).toHaveAttribute('id', 'ai-disclosure-message');
      expect(textarea).toHaveAttribute('aria-describedby', 'ai-disclosure-char-count');
    });

    it('has label for enabled toggle', () => {
      render(
        <AIDisclosureEditor
          value={null}
          enabled={true}
          onChange={mockOnChange}
          onEnabledChange={mockOnEnabledChange}
        />
      );

      expect(screen.getByLabelText(/Show AI Disclosure/i)).toBeInTheDocument();
    });
  });
});
