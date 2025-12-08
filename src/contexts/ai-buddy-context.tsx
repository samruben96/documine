/**
 * AI Buddy Context Provider
 * Story 15.4: Conversation Persistence
 *
 * Provides shared state between AI Buddy layout (sidebar) and page (chat).
 * Manages conversation selection and coordination.
 *
 * AC-15.4.3: Full conversation history loads when returning to existing conversation
 * AC-15.4.8: Clicking conversation in sidebar loads that conversation's messages
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useConversations, type UseConversationsReturn } from '@/hooks/ai-buddy/use-conversations';
import type { Conversation, Message } from '@/types/ai-buddy';

interface AiBuddyContextValue extends UseConversationsReturn {
  /** Currently selected conversation ID (may differ from loaded conversation) */
  selectedConversationId: string | null;
  /** Select a conversation by ID */
  selectConversation: (id: string | null) => void;
  /** Start a new conversation */
  startNewConversation: () => void;
  /** Messages for the current conversation (from activeConversation) */
  currentMessages: Message[];
}

const AiBuddyContext = createContext<AiBuddyContextValue | null>(null);

interface AiBuddyProviderProps {
  children: ReactNode;
}

export function AiBuddyProvider({ children }: AiBuddyProviderProps) {
  const conversationsHook = useConversations({ autoFetch: true });
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const selectConversation = useCallback(
    async (id: string | null) => {
      setSelectedConversationId(id);
      if (id) {
        await conversationsHook.loadConversation(id);
      } else {
        conversationsHook.clearActiveConversation();
      }
    },
    [conversationsHook]
  );

  const startNewConversation = useCallback(() => {
    setSelectedConversationId(null);
    conversationsHook.clearActiveConversation();
  }, [conversationsHook]);

  // Get messages from active conversation
  const currentMessages = conversationsHook.activeConversation?.messages ?? [];

  const value: AiBuddyContextValue = {
    ...conversationsHook,
    selectedConversationId,
    selectConversation,
    startNewConversation,
    currentMessages,
  };

  return (
    <AiBuddyContext.Provider value={value}>
      {children}
    </AiBuddyContext.Provider>
  );
}

export function useAiBuddyContext(): AiBuddyContextValue {
  const context = useContext(AiBuddyContext);
  if (!context) {
    throw new Error('useAiBuddyContext must be used within an AiBuddyProvider');
  }
  return context;
}
