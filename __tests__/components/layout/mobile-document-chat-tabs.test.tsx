/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { MobileDocumentChatTabs, type MobileDocumentChatTabsRef } from '@/components/layout/mobile-document-chat-tabs';

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

  describe('AC-5.7.4: onTabChange callback', () => {
    it('calls onTabChange with "chat" when Chat tab is clicked', async () => {
      const user = userEvent.setup();
      const onTabChange = vi.fn();

      render(
        <MobileDocumentChatTabs
          documentViewer={documentViewer}
          chatPanel={chatPanel}
          onTabChange={onTabChange}
        />
      );

      const chatTab = screen.getByRole('tab', { name: /chat/i });
      await user.click(chatTab);

      expect(onTabChange).toHaveBeenCalledWith('chat');
      expect(onTabChange).toHaveBeenCalledTimes(1);
    });

    it('calls onTabChange with "document" when Document tab is clicked', async () => {
      const user = userEvent.setup();
      const onTabChange = vi.fn();

      render(
        <MobileDocumentChatTabs
          documentViewer={documentViewer}
          chatPanel={chatPanel}
          onTabChange={onTabChange}
        />
      );

      // First switch to chat
      const chatTab = screen.getByRole('tab', { name: /chat/i });
      await user.click(chatTab);

      // Then switch back to document
      const documentTab = screen.getByRole('tab', { name: /document/i });
      await user.click(documentTab);

      expect(onTabChange).toHaveBeenLastCalledWith('document');
      expect(onTabChange).toHaveBeenCalledTimes(2);
    });
  });

  describe('AC-5.7.10: Programmatic tab switching via ref', () => {
    it('switchToChat method switches to chat panel', () => {
      const ref = createRef<MobileDocumentChatTabsRef>();

      render(
        <MobileDocumentChatTabs
          ref={ref}
          documentViewer={documentViewer}
          chatPanel={chatPanel}
        />
      );

      // Initially on document tab
      expect(screen.getByTestId('document-viewer').parentElement).not.toHaveClass('hidden');
      expect(screen.getByTestId('chat-panel').parentElement).toHaveClass('hidden');

      // Switch to chat via ref method
      act(() => {
        ref.current?.switchToChat();
      });

      // Now chat should be visible
      expect(screen.getByTestId('chat-panel').parentElement).not.toHaveClass('hidden');
      expect(screen.getByTestId('document-viewer').parentElement).toHaveClass('hidden');
    });

    it('switchToDocument method switches to document panel', () => {
      const ref = createRef<MobileDocumentChatTabsRef>();

      render(
        <MobileDocumentChatTabs
          ref={ref}
          documentViewer={documentViewer}
          chatPanel={chatPanel}
        />
      );

      // Switch to chat first
      act(() => {
        ref.current?.switchToChat();
      });

      // Then switch back to document
      act(() => {
        ref.current?.switchToDocument();
      });

      // Document should be visible
      expect(screen.getByTestId('document-viewer').parentElement).not.toHaveClass('hidden');
      expect(screen.getByTestId('chat-panel').parentElement).toHaveClass('hidden');
    });

    it('switchToChat calls onTabChange callback', () => {
      const ref = createRef<MobileDocumentChatTabsRef>();
      const onTabChange = vi.fn();

      render(
        <MobileDocumentChatTabs
          ref={ref}
          documentViewer={documentViewer}
          chatPanel={chatPanel}
          onTabChange={onTabChange}
        />
      );

      act(() => {
        ref.current?.switchToChat();
      });

      expect(onTabChange).toHaveBeenCalledWith('chat');
    });

    it('activeTab property reflects current tab state', () => {
      const ref = createRef<MobileDocumentChatTabsRef>();

      render(
        <MobileDocumentChatTabs
          ref={ref}
          documentViewer={documentViewer}
          chatPanel={chatPanel}
        />
      );

      // Initially on document
      expect(ref.current?.activeTab).toBe('document');

      // Switch to chat
      act(() => {
        ref.current?.switchToChat();
      });

      expect(ref.current?.activeTab).toBe('chat');
    });
  });
});
