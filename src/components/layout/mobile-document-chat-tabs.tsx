'use client';

import { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { FileText, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Ref methods exposed by MobileDocumentChatTabs
 * Used for programmatic tab switching (AC-5.5.10)
 */
export interface MobileDocumentChatTabsRef {
  switchToDocument: () => void;
  switchToChat: () => void;
  activeTab: 'document' | 'chat';
}

interface MobileDocumentChatTabsProps {
  documentViewer: React.ReactNode;
  chatPanel: React.ReactNode;
  className?: string;
  onTabChange?: (tab: 'document' | 'chat') => void;
}

/**
 * Mobile Document Chat Tabs Component
 *
 * Implements AC-5.1.8: Tabbed interface with [Document] and [Chat] tabs for mobile (<640px)
 * Implements AC-5.1.9: Tab indicator with visual distinction, 44x44px minimum touch targets
 * Implements AC-5.5.10: Programmatic tab switching for source citation navigation
 *
 * Features:
 * - Only one panel visible at a time
 * - Tab bar at top of content area
 * - Active tab has bottom border accent
 * - 44x44px minimum touch targets for accessibility
 * - Ref methods for programmatic tab switching
 */
export const MobileDocumentChatTabs = forwardRef<
  MobileDocumentChatTabsRef,
  MobileDocumentChatTabsProps
>(function MobileDocumentChatTabs(
  { documentViewer, chatPanel, className, onTabChange },
  ref
) {
  const [activeTab, setActiveTab] = useState<'document' | 'chat'>('document');

  // AC-5.5.10: Programmatic tab switch to Document
  const switchToDocument = useCallback(() => {
    setActiveTab('document');
    onTabChange?.('document');
  }, [onTabChange]);

  // AC-5.5.10: Programmatic tab switch to Chat
  const switchToChat = useCallback(() => {
    setActiveTab('chat');
    onTabChange?.('chat');
  }, [onTabChange]);

  // AC-5.5.10: Expose methods via ref
  useImperativeHandle(
    ref,
    () => ({
      switchToDocument,
      switchToChat,
      activeTab,
    }),
    [switchToDocument, switchToChat, activeTab]
  );

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Tab Bar - AC-5.1.8, AC-5.1.9 */}
      <div
        className="flex-shrink-0 border-b border-slate-200 bg-white"
        role="tablist"
        aria-label="Document and Chat tabs"
      >
        <div className="flex">
          {/* Document Tab */}
          <button
            type="button"
            role="tab"
            id="tab-document"
            aria-controls="panel-document"
            aria-selected={activeTab === 'document'}
            onClick={switchToDocument}
            className={cn(
              // Base styles - 44x44px minimum touch target
              'flex-1 flex items-center justify-center gap-2 py-3 px-4 min-h-[44px]',
              'text-sm font-medium transition-colors',
              // Focus indicator - AC-6.8.5: accent color
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
              // Active state - AC-6.8.1: accent border
              activeTab === 'document'
                ? 'text-primary border-b-2 border-primary'
                : 'text-slate-500 hover:text-primary border-b-2 border-transparent'
            )}
          >
            <FileText className="h-5 w-5" aria-hidden="true" />
            <span>Document</span>
          </button>

          {/* Chat Tab */}
          <button
            type="button"
            role="tab"
            id="tab-chat"
            aria-controls="panel-chat"
            aria-selected={activeTab === 'chat'}
            onClick={switchToChat}
            className={cn(
              // Base styles - 44x44px minimum touch target
              'flex-1 flex items-center justify-center gap-2 py-3 px-4 min-h-[44px]',
              'text-sm font-medium transition-colors',
              // Focus indicator - AC-6.8.5: accent color
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
              // Active state - AC-6.8.1: accent border
              activeTab === 'chat'
                ? 'text-primary border-b-2 border-primary'
                : 'text-slate-500 hover:text-primary border-b-2 border-transparent'
            )}
          >
            <MessageSquare className="h-5 w-5" aria-hidden="true" />
            <span>Chat</span>
          </button>
        </div>
      </div>

      {/* Tab Panels - AC-5.1.8: Only one panel visible at a time */}
      <div className="flex-1 overflow-hidden">
        {/* Document Panel */}
        <div
          id="panel-document"
          role="tabpanel"
          aria-labelledby="tab-document"
          className={cn(
            'h-full',
            activeTab === 'document' ? 'block' : 'hidden'
          )}
        >
          {documentViewer}
        </div>

        {/* Chat Panel */}
        <div
          id="panel-chat"
          role="tabpanel"
          aria-labelledby="tab-chat"
          className={cn(
            'h-full',
            activeTab === 'chat' ? 'block' : 'hidden'
          )}
        >
          {chatPanel}
        </div>
      </div>
    </div>
  );
});
