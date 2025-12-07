'use client';

import { Bot, FileText, HelpCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * AI Buddy Main Page
 * Story 14.4: Page Layout Shell
 *
 * AC 14.4.5: Empty state displayed with welcome message and CTAs.
 * Shows when no conversation is active.
 */

const quickActions = [
  {
    icon: FileText,
    title: 'Analyze a policy',
    description: 'Get coverage details, limits, and exclusions',
  },
  {
    icon: HelpCircle,
    title: 'Answer a question',
    description: 'Ask about insurance concepts or regulations',
  },
  {
    icon: Sparkles,
    title: 'Compare quotes',
    description: 'Help me evaluate options for a client',
  },
];

export default function AiBuddyPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-8">
      {/* Welcome section */}
      <div className="text-center max-w-xl mx-auto mb-12">
        <div className="w-16 h-16 rounded-full bg-[var(--chat-surface)] flex items-center justify-center mx-auto mb-6">
          <Bot className="h-8 w-8 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">
          Welcome to AI Buddy
        </h1>
        <p className="text-[var(--text-muted)] text-base">
          Your knowledgeable insurance colleague. Ask questions about policies,
          get coverage analysis, or help comparing quotes for your clients.
        </p>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full mb-12">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.title}
              className="p-4 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-surface)] text-left hover:bg-[var(--sidebar-hover)] transition-colors group"
            >
              <Icon className="h-5 w-5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] mb-2" />
              <h3 className="font-medium text-[var(--text-primary)] text-sm mb-1">
                {action.title}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                {action.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Chat input placeholder */}
      <div className="w-full max-w-2xl">
        <div className="relative">
          <input
            type="text"
            placeholder="Message AI Buddy..."
            disabled
            className="w-full px-4 py-3 pr-12 rounded-xl border border-[var(--chat-border)] bg-[var(--chat-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
          />
          <Button
            size="icon"
            disabled
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
          >
            <svg
              className="h-4 w-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </Button>
        </div>
        <p className="text-xs text-[var(--text-muted)] text-center mt-3">
          AI Buddy is your insurance assistant. Verify important details with source documents.
        </p>
      </div>
    </div>
  );
}
