/**
 * Streaming Indicator Component
 * Story 14.5: Component Scaffolding
 *
 * Shows animated indicator while AI is generating a response.
 * Stub implementation - full functionality in Epic 15.
 */

import { cn } from '@/lib/utils';

export interface StreamingIndicatorProps {
  className?: string;
}

export function StreamingIndicator({ className }: StreamingIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" />
    </div>
  );
}
