'use client';

import { useEffect } from 'react';
import { Bot, FileText, FolderOpen, HelpCircle, Sparkles } from 'lucide-react';
import { ChatInput } from '@/components/ai-buddy/chat-input';
import { ChatMessageList } from '@/components/ai-buddy/chat-message-list';
import { DocumentUploadZone } from '@/components/ai-buddy/document-upload-zone';
import { useChat } from '@/hooks/ai-buddy/use-chat';
import { useConversationAttachments } from '@/hooks/ai-buddy/use-conversation-attachments';
import { useAiBuddyContext } from '@/contexts/ai-buddy-context';

/**
 * AI Buddy Main Page
 * Story 15.4: Conversation Persistence (updated from 14.4, 15.1, 15.2)
 * Story 17.1: Document Upload to Conversation with Status
 * Story 17.3: Document Preview & Multi-Document Context
 *
 * AC-15.4.1: New conversation created automatically on first message
 * AC-15.4.2: Conversation title auto-generated from first 50 characters
 * AC-15.4.3: Full conversation history loads when returning to existing conversation
 * AC-15.4.8: Clicking conversation in sidebar loads that conversation's messages
 * AC-17.1.1: Attach button opens file picker for PDF/images
 * AC-17.1.5: Drag files onto chat area to attach
 * AC-17.3.2: Click citation opens document preview to exact page
 */

const quickActions = [
  {
    icon: FileText,
    title: 'Analyze a policy',
    description: 'Get coverage details, limits, and exclusions',
    prompt: 'Help me analyze a policy document',
  },
  {
    icon: HelpCircle,
    title: 'Answer a question',
    description: 'Ask about insurance concepts or regulations',
    prompt: 'What are the key differences between occurrence and claims-made policies?',
  },
  {
    icon: Sparkles,
    title: 'Compare quotes',
    description: 'Help me evaluate options for a client',
    prompt: 'Help me compare insurance quotes for a client',
  },
];

export default function AiBuddyPage() {
  const {
    selectedConversationId,
    activeConversation,
    isLoadingConversation,
    addConversation,
    refresh,
    selectConversation,
    // Story 16.2: Get activeProjectId for chat API (AC-16.2.3)
    activeProjectId,
    activeProject,
    // Story 17.3: Document preview from citations (AC-17.3.2)
    openCitationPreview,
  } = useAiBuddyContext();

  // useChat with conversation ID and project ID from context
  // Story 16.2: Pass activeProjectId so new conversations are scoped to project (AC-16.2.3, AC-16.2.5)
  const {
    messages: chatMessages,
    isLoading: isSending,
    streamingContent,
    sendMessage,
    conversation: newConversation,
    clearMessages,
  } = useChat({
    conversationId: selectedConversationId ?? undefined,
    projectId: activeProjectId ?? undefined,
    onConversationCreated: (conv) => {
      // Add to sidebar list and select it
      addConversation(conv);
      selectConversation(conv.id);
    },
  });

  // Story 17.1: Document attachments hook (AC-17.1.2, AC-17.1.3)
  const {
    pendingAttachments,
    addPendingAttachments,
    removePendingAttachment,
    clearPendingAttachments,
  } = useConversationAttachments({
    conversationId: selectedConversationId ?? undefined,
  });

  // Sync loaded conversation messages with chat state
  // When a conversation is loaded from sidebar, set messages from context
  const displayMessages = selectedConversationId && activeConversation?.messages
    ? activeConversation.messages
    : chatMessages;

  // Handle new chat button - clear current state
  useEffect(() => {
    if (selectedConversationId === null) {
      clearMessages();
      clearPendingAttachments();
    }
  }, [selectedConversationId, clearMessages, clearPendingAttachments]);

  // Story 16.2: Clear messages when switching projects (AC-16.2.6)
  // This ensures we don't show stale messages from another project
  useEffect(() => {
    clearMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProjectId]);

  // Refresh conversations list after sending a message (to update order)
  useEffect(() => {
    if (newConversation?.id && !selectedConversationId) {
      refresh();
    }
  }, [newConversation?.id, selectedConversationId, refresh]);

  const handleSend = (message: string) => {
    sendMessage(message);
  };

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt);
  };

  const hasMessages = displayMessages.length > 0;
  const isLoading = isSending || isLoadingConversation;

  return (
    <DocumentUploadZone
      mode="zone"
      onUpload={addPendingAttachments}
      disabled={isLoading}
      maxFiles={5 - pendingAttachments.length}
      className="flex flex-col h-full bg-slate-50"
    >
      {/* Messages area or welcome state */}
      <div className="flex-1 overflow-hidden">
        {hasMessages ? (
          <ChatMessageList
            messages={displayMessages}
            isLoading={isLoading && isSending}
            streamingContent={streamingContent}
            onCitationClick={openCitationPreview}
            className="h-full"
          />
        ) : isLoadingConversation ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
              <p className="text-sm text-slate-500">Loading conversation...</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full px-4 py-8">
            {/* Project context banner - shown when in a project */}
            {activeProject && (
              <div className="flex items-center gap-2 px-4 py-2 mb-6 rounded-lg bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20">
                <FolderOpen className="h-5 w-5 text-[var(--accent-primary)]" />
                <span className="text-sm font-medium text-[var(--accent-primary)]">
                  Chatting in project:
                </span>
                <span className="text-sm font-bold text-[var(--accent-primary)]">
                  {activeProject.name}
                </span>
              </div>
            )}

            {/* Welcome section */}
            <div className="text-center max-w-xl mx-auto mb-12">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                <Bot className="h-8 w-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-semibold text-slate-900 mb-3">
                {activeProject ? `Chat with ${activeProject.name}` : 'Welcome to AI Buddy'}
              </h1>
              <p className="text-slate-600 text-base">
                {activeProject
                  ? `Ask questions about ${activeProject.name}'s documents and policies. Your conversation will be saved to this project.`
                  : 'Your knowledgeable insurance colleague. Ask questions about policies, get coverage analysis, or help comparing quotes for your clients.'}
              </p>
            </div>

            {/* Quick action cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.title}
                    onClick={() => handleQuickAction(action.prompt)}
                    className="p-4 rounded-lg border border-slate-200 bg-white text-left hover:border-emerald-300 hover:bg-emerald-50 transition-colors group shadow-sm"
                  >
                    <Icon className="h-5 w-5 text-slate-500 group-hover:text-emerald-600 mb-2" />
                    <h3 className="font-medium text-slate-900 text-sm mb-1">
                      {action.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {action.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Chat input at bottom */}
      <div className="border-t border-slate-200 bg-white p-4">
        <div className="max-w-3xl mx-auto">
          {/* Project indicator above input when in a project */}
          {activeProject && !hasMessages && (
            <div className="flex items-center justify-center gap-1.5 mb-3 text-xs text-[var(--accent-primary)]">
              <FolderOpen className="h-3.5 w-3.5" />
              <span>Messages will be saved to <strong>{activeProject.name}</strong></span>
            </div>
          )}
          <ChatInput
            onSend={handleSend}
            onAttach={addPendingAttachments}
            onRemoveAttachment={removePendingAttachment}
            pendingAttachments={pendingAttachments}
            isLoading={isLoading}
            autoFocus
          />
          <p className="text-xs text-slate-500 text-center mt-3">
            AI Buddy is your insurance assistant. Verify important details with source documents.
          </p>
        </div>
      </div>
    </DocumentUploadZone>
  );
}
