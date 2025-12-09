/**
 * Add Document Menu Component
 * Story 17.2: Project Document Management
 *
 * Dropdown menu with options to upload new files or select from library.
 *
 * AC-17.2.1: Add Document shows "Upload New" and "Select from Library" options
 */

'use client';

import { useState, useRef } from 'react';
import { Plus, Upload, Library, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export interface AddDocumentMenuProps {
  /** Callback when "Upload New" is selected */
  onUpload?: () => void;
  /** Callback when "Select from Library" is selected */
  onSelectFromLibrary?: () => void;
  /** Whether the menu is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Number of remaining document slots */
  remainingSlots?: number;
}

/**
 * Add Document Menu Component
 * Shows dropdown with Upload and Library options
 */
export function AddDocumentMenu({
  onUpload,
  onSelectFromLibrary,
  disabled = false,
  className,
  remainingSlots,
}: AddDocumentMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    setIsOpen(false);
    // Trigger file input
    fileInputRef.current?.click();
    onUpload?.();
  };

  const handleLibraryClick = () => {
    setIsOpen(false);
    onSelectFromLibrary?.();
  };

  const canAdd = !disabled && (remainingSlots === undefined || remainingSlots > 0);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={!canAdd}
          className={cn(
            'flex items-center gap-1.5',
            'border-dashed border-slate-300 text-slate-600',
            'hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50',
            className
          )}
          data-testid="add-document-button"
        >
          <Plus className="h-4 w-4" />
          <span>Add</span>
          <ChevronDown className="h-3 w-3 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={handleUploadClick}
          className="flex items-center gap-2 cursor-pointer"
          data-testid="upload-option"
        >
          <Upload className="h-4 w-4 text-slate-500" />
          <span>Upload New</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleLibraryClick}
          className="flex items-center gap-2 cursor-pointer"
          data-testid="library-option"
        >
          <Library className="h-4 w-4 text-slate-500" />
          <span>Select from Library</span>
        </DropdownMenuItem>
      </DropdownMenuContent>

      {/* Hidden file input for upload mode */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.png,.jpg,.jpeg"
        className="hidden"
        data-testid="hidden-file-input"
      />
    </DropdownMenu>
  );
}
