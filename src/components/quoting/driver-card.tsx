/**
 * Driver Card Component
 * Story Q3.1: Data Capture Forms
 *
 * AC-Q3.1-25: Driver entry form fields
 * AC-Q3.1-26: First driver defaults to "Self" relationship
 * AC-Q3.1-27: License number masking (show last 4 only)
 * AC-Q3.1-28: Display format "[First] [Last] ([Relationship]) - [X] years licensed"
 * AC-Q3.1-29: Remove with confirmation dialog
 */

'use client';

import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { Users, Pencil, Trash2, X, Check, CalendarIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  US_STATES,
  DRIVER_RELATIONSHIP_OPTIONS,
  MIN_YEARS_LICENSED,
  MAX_YEARS_LICENSED,
  MIN_INCIDENTS,
  MAX_INCIDENTS,
} from '@/lib/quoting/constants';
import { maskLicenseNumber, formatDate, toISODateString, parseDate } from '@/lib/quoting/formatters';
import type { Driver } from '@/types/quoting';
import { cn } from '@/lib/utils';

export interface DriverCardProps {
  /** Driver data */
  driver: Driver;
  /** Driver index in array */
  index: number;
  /** Whether this is the first driver */
  isFirst?: boolean;
  /** Called when driver is updated */
  onUpdate: (driver: Driver) => void;
  /** Called when driver is removed */
  onRemove: () => void;
  /** Whether card is in edit mode */
  isEditing?: boolean;
  /** Toggle edit mode */
  onEditToggle?: () => void;
}

/**
 * Driver Card Component
 * AC-Q3.1-28: Display format "[First] [Last] ([Relationship]) - [X] years licensed"
 */
export function DriverCard({
  driver,
  index,
  isFirst = false,
  onUpdate,
  onRemove,
  isEditing = false,
  onEditToggle,
}: DriverCardProps) {
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [editData, setEditData] = useState<Driver>(() => ({
    ...driver,
    // AC-Q3.1-26: Default first driver to "Self"
    relationship: driver.relationship ?? (isFirst ? 'self' : undefined),
  }));
  const [showLicense, setShowLicense] = useState(false);

  // Parse DOB for calendar
  const dobDate = editData.dateOfBirth ? parseDate(editData.dateOfBirth) : undefined;

  // Display title
  const driverName = [driver.firstName, driver.lastName]
    .filter(Boolean)
    .join(' ') || `Driver ${index + 1}`;
  const relationship = driver.relationship
    ? DRIVER_RELATIONSHIP_OPTIONS.find((r) => r.value === driver.relationship)?.label
    : '';

  /**
   * Save edits
   */
  const handleSave = () => {
    onUpdate(editData);
    if (onEditToggle) {
      onEditToggle();
    }
  };

  /**
   * Cancel edits
   */
  const handleCancel = () => {
    setEditData({
      ...driver,
      relationship: driver.relationship ?? (isFirst ? 'self' : undefined),
    });
    if (onEditToggle) {
      onEditToggle();
    }
  };

  /**
   * Confirm removal
   * AC-Q3.1-29: Confirmation dialog
   */
  const handleRemove = () => {
    setShowRemoveDialog(false);
    onRemove();
  };

  /**
   * Handle DOB selection
   */
  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      if (date) {
        setEditData((prev) => ({
          ...prev,
          dateOfBirth: toISODateString(date),
        }));
      }
    },
    []
  );

  if (isEditing) {
    return (
      <Card className="border-primary" data-testid={`driver-card-${index}-edit`}>
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Editing Driver {index + 1}
            </h4>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                data-testid={`driver-cancel-${index}`}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                data-testid={`driver-save-${index}`}
              >
                <Check className="h-4 w-4 text-green-600" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* First Name */}
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input
                value={editData.firstName ?? ''}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, firstName: e.target.value }))
                }
                placeholder="John"
                data-testid={`driver-firstName-${index}`}
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label>Last Name *</Label>
              <Input
                value={editData.lastName ?? ''}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, lastName: e.target.value }))
                }
                placeholder="Doe"
                data-testid={`driver-lastName-${index}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Date of Birth */}
            <div className="space-y-2">
              <Label>Date of Birth *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !editData.dateOfBirth && 'text-muted-foreground'
                    )}
                    data-testid={`driver-dob-${index}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dobDate ? formatDate(dobDate) : 'MM/DD/YYYY'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dobDate}
                    onSelect={handleDateSelect}
                    disabled={(date) =>
                      date > new Date() || date < new Date('1900-01-01')
                    }
                    defaultMonth={dobDate ?? new Date(1990, 0, 1)}
                    captionLayout="dropdown"
                    fromYear={1920}
                    toYear={new Date().getFullYear()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Relationship */}
            <div className="space-y-2">
              <Label>Relationship *</Label>
              <Select
                value={editData.relationship ?? ''}
                onValueChange={(val) =>
                  setEditData((prev) => ({
                    ...prev,
                    relationship: val as Driver['relationship'],
                  }))
                }
              >
                <SelectTrigger data-testid={`driver-relationship-${index}`}>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {DRIVER_RELATIONSHIP_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* License Number */}
            <div className="space-y-2">
              <Label>License Number *</Label>
              <div className="relative">
                <Input
                  type={showLicense ? 'text' : 'password'}
                  value={editData.licenseNumber ?? ''}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      licenseNumber: e.target.value,
                    }))
                  }
                  placeholder="Enter license number"
                  data-testid={`driver-license-${index}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs"
                  onClick={() => setShowLicense(!showLicense)}
                >
                  {showLicense ? 'Hide' : 'Show'}
                </Button>
              </div>
            </div>

            {/* License State */}
            <div className="space-y-2">
              <Label>License State *</Label>
              <Select
                value={editData.licenseState ?? ''}
                onValueChange={(val) =>
                  setEditData((prev) => ({ ...prev, licenseState: val }))
                }
              >
                <SelectTrigger data-testid={`driver-licenseState-${index}`}>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Years Licensed */}
            <div className="space-y-2">
              <Label>Years Licensed *</Label>
              <Input
                type="number"
                min={MIN_YEARS_LICENSED}
                max={MAX_YEARS_LICENSED}
                value={editData.yearsLicensed ?? ''}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    yearsLicensed: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  }))
                }
                placeholder="15"
                data-testid={`driver-yearsLicensed-${index}`}
              />
            </div>

            {/* Accidents past 5 years */}
            <div className="space-y-2">
              <Label>Accidents (5 yrs)</Label>
              <Input
                type="number"
                min={MIN_INCIDENTS}
                max={MAX_INCIDENTS}
                value={editData.accidentsPast5Years ?? 0}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    accidentsPast5Years: e.target.value
                      ? parseInt(e.target.value)
                      : 0,
                  }))
                }
                placeholder="0"
                data-testid={`driver-accidents-${index}`}
              />
            </div>

            {/* Violations past 5 years */}
            <div className="space-y-2">
              <Label>Violations (5 yrs)</Label>
              <Input
                type="number"
                min={MIN_INCIDENTS}
                max={MAX_INCIDENTS}
                value={editData.violationsPast5Years ?? 0}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    violationsPast5Years: e.target.value
                      ? parseInt(e.target.value)
                      : 0,
                  }))
                }
                placeholder="0"
                data-testid={`driver-violations-${index}`}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // View mode
  return (
    <>
      <Card data-testid={`driver-card-${index}`}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                {/* AC-Q3.1-28: Display format */}
                <h4 className="font-medium">
                  {driverName}
                  {relationship && (
                    <span className="text-muted-foreground ml-1">
                      ({relationship})
                    </span>
                  )}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {driver.yearsLicensed !== undefined && (
                    <span>{driver.yearsLicensed} years licensed</span>
                  )}
                  {driver.licenseNumber && (
                    <>
                      {driver.yearsLicensed !== undefined && ' · '}
                      <span className="font-mono">
                        {/* AC-Q3.1-27: License masking */}
                        {maskLicenseNumber(driver.licenseNumber)}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onEditToggle}
                data-testid={`driver-edit-${index}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRemoveDialog(true)}
                data-testid={`driver-remove-${index}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Remove Confirmation Dialog - AC-Q3.1-29 */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Driver</AlertDialogTitle>
            <AlertDialogDescription>
              Remove this driver? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
