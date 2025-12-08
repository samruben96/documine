'use client';

import { Bot, FileText, HelpCircle, Sparkles } from 'lucide-react';
import { ChatInput } from '@/components/ai-buddy/chat-input';
import { ChatMessageList } from '@/components/ai-buddy/chat-message-list';
import { useChat } from '@/hooks/ai-buddy/use-chat';

/**
 * AI Buddy Main Page
 * Story 14.4: Page Layout Shell (updated with Stories 15.1 + 15.2)
 *
 * AC 14.4.5: Empty state displayed with welcome message and CTAs.
 * Now integrated with real ChatInput (15.1) and ChatMessageList (15.2).
 * Light theme consistent with rest of docuMINE.
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
  const { messages, isLoading, streamingContent, sendMessage } = useChat();

  const handleSend = (message: string) => {
    sendMessage(message);
  };

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Messages area or welcome state */}
      <div className="flex-1 overflow-hidden">
        {hasMessages ? (
          <ChatMessageList
            messages={messages}
            isLoading={isLoading}
            streamingContent={streamingContent}
            className="h-full"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full px-4 py-8">
            {/* Welcome section */}
            <div className="text-center max-w-xl mx-auto mb-12">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                <Bot className="h-8 w-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-semibold text-slate-900 mb-3">
                Welcome to AI Buddy
              </h1>
              <p className="text-slate-600 text-base">
                Your knowledgeable insurance colleague. Ask questions about policies,
                get coverage analysis, or help comparing quotes for your clients.
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
          <ChatInput
            onSend={handleSend}
            isLoading={isLoading}
            autoFocus
          />
          <p className="text-xs text-slate-500 text-center mt-3">
            AI Buddy is your insurance assistant. Verify important details with source documents.
          </p>
        </div>
      </div>
    </div>
  );
}
