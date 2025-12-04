'use client';

import { FileText, FileQuestion, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DocumentTypeBadge } from './document-type-badge';
import type { DocumentType } from '@/types';

/**
 * Document Type Toggle Component
 *
 * Story F2-2: UI toggle/dropdown to change document type
 * AC-F2-2.3: UI toggle/dropdown to change document type on document card
 *
 * Uses dropdown menu for selection with visual feedback.
 */

interface DocumentTypeToggleProps {
  type: DocumentType | null | undefined;
  onTypeChange: (type: DocumentType) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const typeOptions: { value: DocumentType; label: string; icon: typeof FileText; description: string }[] = [
  {
    value: 'quote',
    label: 'Quote',
    icon: FileText,
    description: 'Insurance quote document',
  },
  {
    value: 'general',
    label: 'General',
    icon: FileQuestion,
    description: 'General document (not a quote)',
  },
];

export function DocumentTypeToggle({
  type,
  onTypeChange,
  disabled = false,
  isLoading = false,
}: DocumentTypeToggleProps) {
  const currentType: DocumentType = type ?? 'quote';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled || isLoading}
        className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded-full"
        data-testid="document-type-toggle"
      >
        <div className="flex items-center gap-1">
          <DocumentTypeBadge
            type={currentType}
            className={isLoading ? 'opacity-50' : ''}
          />
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {typeOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = currentType === option.value;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onTypeChange(option.value)}
              className={isSelected ? 'bg-accent' : ''}
              data-testid={`type-option-${option.value}`}
            >
              <Icon className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
