/**
 * Auto Tab
 * Story Q3.1: Data Capture Forms
 *
 * AC-Q3.1-14: Visible for "auto" or "bundle" quote types, hidden for "home"
 * AC-Q3.1-15: Add Vehicle with max 6 limit, disabled button with tooltip
 * AC-Q3.1-16: Vehicle entry form fields
 * AC-Q3.1-17-19: VIN input, decode, error handling
 * AC-Q3.1-20: Vehicle cards with "[Year] [Make] [Model]" format
 * AC-Q3.1-21: Remove with confirmation
 * AC-Q3.1-22: Coverage preferences section (once per quote)
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Car, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { VehicleCard } from '@/components/quoting/vehicle-card';
import { useQuoteSessionContext } from '@/contexts/quote-session-context';
import {
  MAX_VEHICLES,
  BODILY_INJURY_OPTIONS,
  PROPERTY_DAMAGE_OPTIONS,
  AUTO_DEDUCTIBLE_OPTIONS,
} from '@/lib/quoting/constants';
import type { Vehicle, AutoCoverage } from '@/types/quoting';

/**
 * Auto Tab Component
 */
export function AutoTab() {
  const { session, updateAutoInfo } = useQuoteSessionContext();

  // Local state for vehicles
  const [vehicles, setVehicles] = useState<Vehicle[]>(
    session?.clientData?.auto?.vehicles ?? []
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Local state for coverage
  const [coverage, setCoverage] = useState<AutoCoverage>(
    session?.clientData?.auto?.coverage ?? {}
  );

  // Sync from session when it changes
  useEffect(() => {
    if (session?.clientData?.auto) {
      setVehicles(session.clientData.auto.vehicles ?? []);
      setCoverage(session.clientData.auto.coverage ?? {});
    }
  }, [session?.id]);

  /**
   * Save auto info - context handles debouncing via auto-save hook
   */
  const saveData = useCallback(
    (data: { vehicles?: Vehicle[]; coverage?: AutoCoverage }) => {
      updateAutoInfo(data);
    },
    [updateAutoInfo]
  );

  /**
   * Add new vehicle
   * AC-Q3.1-15: Max 6 vehicles
   */
  const handleAddVehicle = useCallback(() => {
    if (vehicles.length >= MAX_VEHICLES) return;

    const newVehicle: Vehicle = {
      id: uuidv4(),
      year: undefined,
      make: '',
      model: '',
      vin: '',
      usage: undefined,
      annualMileage: undefined,
    };

    const updatedVehicles = [...vehicles, newVehicle];
    setVehicles(updatedVehicles);
    setEditingIndex(updatedVehicles.length - 1); // Open new vehicle in edit mode
    saveData({ vehicles: updatedVehicles });
  }, [vehicles, saveData]);

  /**
   * Update vehicle
   */
  const handleUpdateVehicle = useCallback(
    (index: number, updatedVehicle: Vehicle) => {
      const updatedVehicles = [...vehicles];
      updatedVehicles[index] = updatedVehicle;
      setVehicles(updatedVehicles);
      setEditingIndex(null);
      saveData({ vehicles: updatedVehicles });
    },
    [vehicles, saveData]
  );

  /**
   * Remove vehicle
   * AC-Q3.1-21: Confirmation handled by VehicleCard
   */
  const handleRemoveVehicle = useCallback(
    (index: number) => {
      const updatedVehicles = vehicles.filter((_, i) => i !== index);
      setVehicles(updatedVehicles);
      if (editingIndex === index) {
        setEditingIndex(null);
      } else if (editingIndex !== null && editingIndex > index) {
        setEditingIndex(editingIndex - 1);
      }
      saveData({ vehicles: updatedVehicles });
    },
    [vehicles, editingIndex, saveData]
  );

  /**
   * Toggle edit mode for vehicle
   */
  const handleEditToggle = useCallback(
    (index: number) => {
      setEditingIndex(editingIndex === index ? null : index);
    },
    [editingIndex]
  );

  /**
   * Update coverage preference
   */
  const handleCoverageChange = useCallback(
    (field: keyof AutoCoverage, value: string | boolean) => {
      const updatedCoverage = { ...coverage, [field]: value };
      setCoverage(updatedCoverage);
      saveData({ coverage: updatedCoverage });
    },
    [coverage, saveData]
  );

  const canAddVehicle = vehicles.length < MAX_VEHICLES;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Car className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Vehicles</CardTitle>
        </div>
        <CardDescription>
          Vehicles to be included in the auto insurance quote
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vehicle List */}
        <div className="space-y-3">
          {vehicles.length === 0 && (
            <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
              No vehicles added yet. Click &quot;Add Vehicle&quot; to get started.
            </div>
          )}

          {vehicles.map((vehicle, index) => (
            <VehicleCard
              key={vehicle.id ?? index}
              vehicle={vehicle}
              index={index}
              isEditing={editingIndex === index}
              onEditToggle={() => handleEditToggle(index)}
              onUpdate={(v) => handleUpdateVehicle(index, v)}
              onRemove={() => handleRemoveVehicle(index)}
            />
          ))}
        </div>

        {/* Add Vehicle Button - AC-Q3.1-15 */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-block">
                <Button
                  variant="outline"
                  onClick={handleAddVehicle}
                  disabled={!canAddVehicle}
                  data-testid="add-vehicle"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vehicle
                </Button>
              </div>
            </TooltipTrigger>
            {!canAddVehicle && (
              <TooltipContent>
                <p>Maximum {MAX_VEHICLES} vehicles</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        {/* Coverage Preferences - AC-Q3.1-22 */}
        <div className="pt-6 border-t space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Coverage Preferences
          </h3>
          <p className="text-xs text-muted-foreground">
            These preferences apply to all vehicles in this quote.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Bodily Injury Liability */}
            <div className="space-y-2">
              <Label>Bodily Injury Liability</Label>
              <Select
                value={coverage.bodilyInjuryLiability ?? ''}
                onValueChange={(val) =>
                  handleCoverageChange('bodilyInjuryLiability', val)
                }
              >
                <SelectTrigger data-testid="bodilyInjuryLiability">
                  <SelectValue placeholder="Select limit" />
                </SelectTrigger>
                <SelectContent>
                  {BODILY_INJURY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Property Damage Liability */}
            <div className="space-y-2">
              <Label>Property Damage Liability</Label>
              <Select
                value={coverage.propertyDamageLiability ?? ''}
                onValueChange={(val) =>
                  handleCoverageChange('propertyDamageLiability', val)
                }
              >
                <SelectTrigger data-testid="propertyDamageLiability">
                  <SelectValue placeholder="Select limit" />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_DAMAGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Comprehensive Deductible */}
            <div className="space-y-2">
              <Label>Comprehensive Deductible</Label>
              <Select
                value={coverage.comprehensiveDeductible ?? ''}
                onValueChange={(val) =>
                  handleCoverageChange('comprehensiveDeductible', val)
                }
              >
                <SelectTrigger data-testid="comprehensiveDeductible">
                  <SelectValue placeholder="Select deductible" />
                </SelectTrigger>
                <SelectContent>
                  {AUTO_DEDUCTIBLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Collision Deductible */}
            <div className="space-y-2">
              <Label>Collision Deductible</Label>
              <Select
                value={coverage.collisionDeductible ?? ''}
                onValueChange={(val) =>
                  handleCoverageChange('collisionDeductible', val)
                }
              >
                <SelectTrigger data-testid="collisionDeductible">
                  <SelectValue placeholder="Select deductible" />
                </SelectTrigger>
                <SelectContent>
                  {AUTO_DEDUCTIBLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Uninsured Motorist */}
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="uninsuredMotorist"
                checked={coverage.uninsuredMotorist ?? false}
                onCheckedChange={(checked) =>
                  handleCoverageChange('uninsuredMotorist', checked as boolean)
                }
                data-testid="uninsuredMotorist"
              />
              <Label htmlFor="uninsuredMotorist" className="cursor-pointer">
                Uninsured Motorist Coverage
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
