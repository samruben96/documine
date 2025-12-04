'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Color Picker Component
 * Story 9.1: AC-9.1.3 - Select primary and secondary colors
 */

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

// Predefined color palette for quick selection
const PRESET_COLORS = [
  '#2563eb', // Blue (default primary)
  '#1e40af', // Dark blue (default secondary)
  '#16a34a', // Green
  '#0891b2', // Cyan
  '#7c3aed', // Purple
  '#dc2626', // Red
  '#ea580c', // Orange
  '#ca8a04', // Yellow
  '#0f172a', // Slate dark
  '#64748b', // Slate medium
];

/**
 * Validate hex color format
 */
function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

export function ColorPicker({
  label,
  value,
  onChange,
  disabled = false,
}: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isValid, setIsValid] = useState(true);

  // Sync input value with prop
  useEffect(() => {
    setInputValue(value);
    setIsValid(isValidHexColor(value));
  }, [value]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Validate and update if valid
    if (isValidHexColor(newValue)) {
      setIsValid(true);
      onChange(newValue);
    } else {
      setIsValid(false);
    }
  }, [onChange]);

  const handlePresetClick = useCallback((color: string) => {
    if (disabled) return;
    setInputValue(color);
    setIsValid(true);
    onChange(color);
  }, [disabled, onChange]);

  const handleNativePickerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setInputValue(color);
    setIsValid(true);
    onChange(color);
  }, [onChange]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>

      <div className="flex items-center gap-3">
        {/* Native color picker */}
        <div className="relative">
          <input
            type="color"
            value={isValid ? inputValue : value}
            onChange={handleNativePickerChange}
            disabled={disabled}
            className={cn(
              'h-10 w-10 cursor-pointer rounded-md border border-slate-200',
              'appearance-none bg-transparent',
              disabled && 'cursor-not-allowed opacity-50'
            )}
            style={{ colorScheme: 'light' }}
          />
        </div>

        {/* Hex input */}
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="#2563eb"
          disabled={disabled}
          className={cn(
            'w-28 font-mono text-sm',
            !isValid && 'border-red-300 focus-visible:ring-red-500'
          )}
          maxLength={7}
        />

        {/* Color preview swatch */}
        <div
          className="h-10 w-10 rounded-md border border-slate-200 shadow-sm"
          style={{ backgroundColor: isValid ? inputValue : value }}
        />
      </div>

      {/* Preset colors */}
      <div className="flex flex-wrap gap-2 pt-1">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => handlePresetClick(color)}
            disabled={disabled}
            className={cn(
              'h-6 w-6 rounded border transition-all',
              value === color
                ? 'ring-2 ring-electric-blue ring-offset-2'
                : 'border-slate-200 hover:scale-110',
              disabled && 'cursor-not-allowed opacity-50'
            )}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      {!isValid && (
        <p className="text-xs text-red-600">
          Please enter a valid hex color (e.g., #2563eb)
        </p>
      )}
    </div>
  );
}
