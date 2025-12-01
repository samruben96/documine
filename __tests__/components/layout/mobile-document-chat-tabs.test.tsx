/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileDocumentChatTabs } from '@/components/layout/mobile-document-chat-tabs';

describe('MobileDocumentChatTabs', () => {
  const documentViewer = <div data-testid="document-viewer">Document Viewer Content</div>;
  const chatPanel = <div data-testid="chat-panel">Chat Panel Content</div>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-5.1.8: Tabbed interface on mobile', () => {
    it('renders Document and Chat tabs', () => {
      render(
        <MobileDocumentChatTabs
          documentViewer={documentViewer}
          chatPanel={chatPanel}
        />
      );

      expect(screen.getByRole('tab', { name: /document/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /chat/i })).toBeInTheDocument();
    });

    it('shows Document tab content by default', () => {
      render(
        <MobileDocumentChatTabs
          documentViewer={documentViewer}
          chatPanel={chatPanel}
        />
      );

      expect(screen.getByTestId('document-viewer')).toBeVisible();
      // Chat panel should exist but be hidden
      expect(screen.getByTestId('chat-panel').parentElement).toHaveClass('hidden');
    });

    it('only shows one panel at a time', () => {
      render(
        <MobileDocumentChatTabs
          documentViewer={documentViewer}
          chatPanel={chatPanel}
        />
      );

      // Document visible, chat hidden
      expect(screen.getByTestId('document-viewer').parentElement).not.toHaveClass('hidden');
      expect(screen.getByTestId('chat-panel').parentElement).toHaveClass('hidden');
    });
  });

  describe('AC-5.1.9: Tab indicator and touch targets', () => {
    it('Document tab has aria-selected when active', () => {
      render(
        <MobileDocumentChatTabs
          documentViewer={documentViewer}
          chatPanel={chatPanel}
        />
      );

      const documentTab = screen.getByRole('tab', { name: /document/i });
      expect(documentTab).toHaveAttribute('aria-selected', 'true');
    });

    it('Chat tab has aria-selected when active', async () => {
      const user = userEvent.setup();
      render(
        <MobileDocumentChatTabs
          documentViewer={documentViewer}
          chatPanel={chatPanel}
        />
      );

      const chatTab = screen.getByRole('tab', { name: /chat/i });
      await user.click(chatTab);

      expect(chatTab).toHaveAttribute('aria-selected', 'true');
    });

    it('tabs have minimum 44px height for touch targets', () => {
      render(
        <MobileDocumentChatTabs
          documentViewer={documentViewer}
          chatPanel={chatPanel}
        />
      );

      const documentTab = screen.getByRole('tab', { name: /document/i });
      const chatTab = screen.getByRole('tab', { name: /chat/i });

      // Check for min-h-[44px] class
      expect(documentTab).toHaveClass('min-h-[44px]');
      expect(chatTab).toHaveClass('min-h-[44px]');
    });
  });

  describe('Tab switching', () => {
    it('clicking Chat tab shows chat panel and hides document', async () => {
      const user = userEvent.setup();
      render(
        <MobileDocumentChatTabs
          documentViewer={documentViewer}
          chatPanel={chatPanel}
        />
      );

      const chatTab = screen.getByRole('tab', { name: /chat/i });
      await user.click(chatTab);

      expect(screen.getByTestId('chat-panel').parentElement).not.toHaveClass('hidden');
      expect(screen.getByTestId('document-viewer').parentElement).toHaveClass('hidden');
    });

    it('clicking Document tab shows document panel and hides chat', async () => {
      const user = userEvent.setup();
      render(
        <MobileDocumentChatTabs
          documentViewer={documentViewer}
          chatPanel={chatPanel}
        />
      );

      // First switch to chat
      const chatTab = screen.getByRole('tab', { name: /chat/i });
      await user.click(chatTab);

      // Then switch back to document
      const documentTab = screen.getByRole('tab', { name: /document/i });
      await user.click(documentTab);

      expect(screen.getByTestId('document-viewer').parentElement).not.toHaveClass('hidden');
      expect(screen.getByTestId('chat-panel').parentElement).toHaveClass('hidden');
    });
  });

  describe('Accessibility', () => {
    it('has tablist role on tab container', () => {
      render(
        <MobileDocumentChatTabs
          documentViewer={documentViewer}
          chatPanel={chatPanel}
        />
      );

      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('tab panels have correct aria-labelledby', () => {
      render(
        <MobileDocumentChatTabs
          documentViewer={documentViewer}
          chatPanel={chatPanel}
        />
      );

      const documentPanelElement = screen.getByTestId('document-viewer').closest('[role="tabpanel"]');
      const chatPanelElement = screen.getByTestId('chat-panel').closest('[role="tabpanel"]');

      expect(documentPanelElement).toHaveAttribute('aria-labelledby', 'tab-document');
      expect(chatPanelElement).toHaveAttribute('aria-labelledby', 'tab-chat');
    });
  });
});
