'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

/**
 * Logo Upload Component
 * Story 9.1: AC-9.1.2 - Upload logo image (PNG/JPG, max 2MB)
 */

interface LogoUploadProps {
  currentLogoUrl: string | null;
  onUpload: (file: File) => Promise<string | null>;
  onRemove: () => Promise<void>;
  disabled?: boolean;
}

export function LogoUpload({
  currentLogoUrl,
  onUpload,
  onRemove,
  disabled = false,
}: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Create preview
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    try {
      setIsUploading(true);
      const result = await onUpload(file);

      if (!result) {
        // Upload failed, clear preview
        setPreviewUrl(null);
      }
    } finally {
      setIsUploading(false);
      // Clean up preview URL
      URL.revokeObjectURL(preview);
      setPreviewUrl(null);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxSize: 2 * 1024 * 1024, // 2MB
    maxFiles: 1,
    disabled: disabled || isUploading,
  });

  const handleRemove = async () => {
    try {
      setIsRemoving(true);
      await onRemove();
    } finally {
      setIsRemoving(false);
    }
  };

  const displayUrl = previewUrl || currentLogoUrl;

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-slate-700">
        Agency Logo
      </label>

      {displayUrl ? (
        // Logo preview
        <div className="relative inline-block">
          <div className="relative h-20 w-auto min-w-[120px] max-w-[300px] rounded-lg border border-slate-200 bg-white p-2">
            <Image
              src={displayUrl}
              alt="Agency logo"
              fill
              className="object-contain"
              unoptimized // External URLs from Supabase storage
            />
          </div>

          {/* Remove button */}
          {!disabled && !isUploading && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -right-2 -top-2 h-6 w-6"
              onClick={handleRemove}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <X className="h-3 w-3" />
              )}
            </Button>
          )}

          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/80">
              <Loader2 className="h-6 w-6 animate-spin text-electric-blue" />
            </div>
          )}
        </div>
      ) : (
        // Upload dropzone
        <div
          {...getRootProps()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors',
            isDragActive
              ? 'border-electric-blue bg-electric-blue/5'
              : 'border-slate-300 hover:border-slate-400',
            (disabled || isUploading) && 'cursor-not-allowed opacity-50'
          )}
        >
          <input {...getInputProps()} />

          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-electric-blue" />
          ) : (
            <div className="rounded-full bg-slate-100 p-2">
              {isDragActive ? (
                <ImageIcon className="h-6 w-6 text-electric-blue" />
              ) : (
                <Upload className="h-6 w-6 text-slate-500" />
              )}
            </div>
          )}

          <div className="text-center">
            <p className="text-sm font-medium text-slate-600">
              {isDragActive ? 'Drop your logo here' : 'Drop logo here or click to upload'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              PNG or JPG, max 2MB (recommended: 800×200px)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
