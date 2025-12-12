/**
 * Vehicle Card Component
 * Story Q3.1: Data Capture Forms
 *
 * AC-Q3.1-20: Display vehicle as card with "[Year] [Make] [Model]" format
 * AC-Q3.1-21: Remove with confirmation dialog or undo toast
 */

'use client';

import { useState } from 'react';
import { Car, Pencil, Trash2, X, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { VINInput } from '@/components/quoting/vin-input';
import {
  getVehicleYearOptions,
  VEHICLE_USAGE_OPTIONS,
} from '@/lib/quoting/constants';
import type { Vehicle } from '@/types/quoting';
import type { VINDecodeResult } from '@/hooks/quoting/use-vin-decode';

export interface VehicleCardProps {
  /** Vehicle data */
  vehicle: Vehicle;
  /** Vehicle index in array */
  index: number;
  /** Called when vehicle is updated */
  onUpdate: (vehicle: Vehicle) => void;
  /** Called when vehicle is removed */
  onRemove: () => void;
  /** Whether card is in edit mode */
  isEditing?: boolean;
  /** Toggle edit mode */
  onEditToggle?: () => void;
}

/**
 * Vehicle Card Component
 * AC-Q3.1-20: Display format "[Year] [Make] [Model]"
 */
export function VehicleCard({
  vehicle,
  index,
  onUpdate,
  onRemove,
  isEditing = false,
  onEditToggle,
}: VehicleCardProps) {
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [editData, setEditData] = useState<Vehicle>(vehicle);

  const yearOptions = getVehicleYearOptions();

  // Display title
  const vehicleTitle = [vehicle.year, vehicle.make, vehicle.model]
    .filter(Boolean)
    .join(' ') || `Vehicle ${index + 1}`;

  /**
   * Handle VIN decode result
   * AC-Q3.1-18: Auto-populate year/make/model
   */
  const handleVINDecode = (result: VINDecodeResult) => {
    setEditData((prev) => ({
      ...prev,
      year: result.year ?? prev.year,
      make: result.make ?? prev.make,
      model: result.model ?? prev.model,
    }));
  };

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
    setEditData(vehicle);
    if (onEditToggle) {
      onEditToggle();
    }
  };

  /**
   * Confirm removal
   * AC-Q3.1-21: Confirmation dialog
   */
  const handleRemove = () => {
    setShowRemoveDialog(false);
    onRemove();
  };

  if (isEditing) {
    return (
      <Card className="border-primary" data-testid={`vehicle-card-${index}-edit`}>
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              Editing Vehicle {index + 1}
            </h4>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                data-testid={`vehicle-cancel-${index}`}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                data-testid={`vehicle-save-${index}`}
              >
                <Check className="h-4 w-4 text-green-600" />
              </Button>
            </div>
          </div>

          {/* VIN Input - AC-Q3.1-17, AC-Q3.1-18 */}
          <div className="space-y-2">
            <Label>VIN (optional)</Label>
            <VINInput
              value={editData.vin ?? ''}
              onChange={(vin) => setEditData((prev) => ({ ...prev, vin }))}
              onDecode={handleVINDecode}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Year */}
            <div className="space-y-2">
              <Label>Year *</Label>
              <Select
                value={editData.year?.toString() ?? ''}
                onValueChange={(val) =>
                  setEditData((prev) => ({
                    ...prev,
                    year: val ? parseInt(val) : undefined,
                  }))
                }
              >
                <SelectTrigger data-testid={`vehicle-year-${index}`}>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Make */}
            <div className="space-y-2">
              <Label>Make *</Label>
              <Input
                value={editData.make ?? ''}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, make: e.target.value }))
                }
                placeholder="Toyota"
                data-testid={`vehicle-make-${index}`}
              />
            </div>

            {/* Model */}
            <div className="space-y-2">
              <Label>Model *</Label>
              <Input
                value={editData.model ?? ''}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, model: e.target.value }))
                }
                placeholder="Camry"
                data-testid={`vehicle-model-${index}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Usage */}
            <div className="space-y-2">
              <Label>Usage *</Label>
              <Select
                value={editData.usage ?? ''}
                onValueChange={(val) =>
                  setEditData((prev) => ({
                    ...prev,
                    usage: val as Vehicle['usage'],
                  }))
                }
              >
                <SelectTrigger data-testid={`vehicle-usage-${index}`}>
                  <SelectValue placeholder="Select usage" />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_USAGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Annual Mileage */}
            <div className="space-y-2">
              <Label>Annual Mileage *</Label>
              <Input
                type="number"
                value={editData.annualMileage ?? ''}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    annualMileage: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  }))
                }
                placeholder="12000"
                data-testid={`vehicle-mileage-${index}`}
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
      <Card data-testid={`vehicle-card-${index}`}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Car className="h-5 w-5 text-muted-foreground" />
              <div>
                <h4 className="font-medium">{vehicleTitle}</h4>
                <p className="text-sm text-muted-foreground">
                  {vehicle.usage && (
                    <span className="capitalize">{vehicle.usage}</span>
                  )}
                  {vehicle.usage && vehicle.annualMileage && ' · '}
                  {vehicle.annualMileage && (
                    <span>{vehicle.annualMileage.toLocaleString()} mi/yr</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onEditToggle}
                data-testid={`vehicle-edit-${index}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRemoveDialog(true)}
                data-testid={`vehicle-remove-${index}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Remove Confirmation Dialog - AC-Q3.1-21 */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Vehicle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {vehicleTitle}? This action cannot
              be undone.
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
