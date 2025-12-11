'use client';

import { FileUp, Upload, Sparkles } from 'lucide-react';
import { UploadZone } from './upload-zone';
import { typography } from '@/lib/typography';
import { cn } from '@/lib/utils';

interface DocumentListEmptyProps {
  onFilesAccepted: (files: File[]) => void;
  disabled?: boolean;
}

/**
 * Document List Empty State Component
 *
 * Shown when no documents exist in sidebar.
 * Story DR.8: Typography standardization
 * Implements:
 * - AC-4.3.9: Empty state with centered upload zone
 * - AC-6.7.6-10: Engaging empty state with value proposition
 * - AC-6.8.13: Animated illustration with engaging copy
 */
export function DocumentListEmpty({
  onFilesAccepted,
  disabled = false,
}: DocumentListEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
      {/* Animated icon container - AC-6.8.13 */}
      <div className="relative">
        {/* Decorative sparkles */}
        <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-primary/60 animate-pulse" />

        {/* Main icon with floating animation */}
        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 p-4 animate-float">
          <FileUp className="h-8 w-8 text-primary" />
        </div>
      </div>

      {/* Headline - AC-6.7.6, AC-6.8.13, DR.8.3: Card title typography */}
      <h3 className={cn(typography.cardTitle, 'mt-4 text-sm')}>
        Your documents await
      </h3>

      {/* Value proposition - AC-6.7.6, AC-6.8.13, DR.8.5: Muted text */}
      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 max-w-[200px] leading-relaxed">
        Drop a policy, quote, or certificate and unlock AI-powered insights in seconds
      </p>

      {/* Upload zone - AC-6.7.7 */}
      <div className="mt-5 w-full max-w-xs">
        <UploadZone
          onFilesAccepted={onFilesAccepted}
          disabled={disabled}
          className="border-primary/20 hover:border-primary/40 dark:border-primary/30"
        />
      </div>
    </div>
  );
}
