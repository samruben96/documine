'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LabelPillProps {
  id: string;
  name: string;
  color: string | null;
  onRemove?: (id: string) => void;
  className?: string;
}

/**
 * Label Pill Component
 *
 * Displays a label as a small colored pill/badge.
 * Optionally includes an X button for removal.
 *
 * Implements AC-4.5.7, AC-4.5.8
 */
export function LabelPill({
  id,
  name,
  color,
  onRemove,
  className,
}: LabelPillProps) {
  const bgColor = color || '#64748b';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        'max-w-[120px]',
        className
      )}
      style={{
        backgroundColor: `${bgColor}20`, // 12% opacity background
        color: bgColor,
        border: `1px solid ${bgColor}40`, // 25% opacity border
      }}
    >
      <span className="truncate">{name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(id);
          }}
          className={cn(
            'flex-shrink-0 p-0.5 rounded-full hover:bg-black/10 transition-colors',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current'
          )}
          aria-label={`Remove ${name} label`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
