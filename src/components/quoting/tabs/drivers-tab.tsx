/**
 * Drivers Tab
 * Story Q3.1: Data Capture Forms
 *
 * AC-Q3.1-23: Visible for "auto" or "bundle" quote types, hidden for "home"
 * AC-Q3.1-24: Add Driver with max 8 limit, disabled button with tooltip
 * AC-Q3.1-25: Driver entry form fields
 * AC-Q3.1-26: First driver defaults to "Self" relationship
 * AC-Q3.1-27: License number masking
 * AC-Q3.1-28: Driver cards with display format
 * AC-Q3.1-29: Remove with confirmation
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Users, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { DriverCard } from '@/components/quoting/driver-card';
import { useQuoteSessionContext } from '@/contexts/quote-session-context';
import { MAX_DRIVERS } from '@/lib/quoting/constants';
import type { Driver } from '@/types/quoting';

/**
 * Drivers Tab Component
 */
export function DriversTab() {
  const { session, updateAutoInfo } = useQuoteSessionContext();

  // Local state for drivers
  const [drivers, setDrivers] = useState<Driver[]>(
    session?.clientData?.auto?.drivers ?? []
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Sync from session when it changes
  useEffect(() => {
    if (session?.clientData?.auto) {
      setDrivers(session.clientData.auto.drivers ?? []);
    }
  }, [session?.id]);

  /**
   * Save drivers - context handles debouncing via auto-save hook
   */
  const saveData = useCallback(
    (updatedDrivers: Driver[]) => {
      updateAutoInfo({ drivers: updatedDrivers });
    },
    [updateAutoInfo]
  );

  /**
   * Add new driver
   * AC-Q3.1-24: Max 8 drivers
   * AC-Q3.1-26: First driver defaults to "Self"
   */
  const handleAddDriver = useCallback(() => {
    if (drivers.length >= MAX_DRIVERS) return;

    const isFirst = drivers.length === 0;
    const newDriver: Driver = {
      id: uuidv4(),
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      licenseNumber: '',
      licenseState: '',
      yearsLicensed: undefined,
      relationship: isFirst ? 'self' : undefined, // AC-Q3.1-26
      accidentsPast5Years: 0,
      violationsPast5Years: 0,
    };

    const updatedDrivers = [...drivers, newDriver];
    setDrivers(updatedDrivers);
    setEditingIndex(updatedDrivers.length - 1); // Open new driver in edit mode
    saveData(updatedDrivers);
  }, [drivers, saveData]);

  /**
   * Update driver
   */
  const handleUpdateDriver = useCallback(
    (index: number, updatedDriver: Driver) => {
      const updatedDrivers = [...drivers];
      updatedDrivers[index] = updatedDriver;
      setDrivers(updatedDrivers);
      setEditingIndex(null);
      saveData(updatedDrivers);
    },
    [drivers, saveData]
  );

  /**
   * Remove driver
   * AC-Q3.1-29: Confirmation handled by DriverCard
   */
  const handleRemoveDriver = useCallback(
    (index: number) => {
      const updatedDrivers = drivers.filter((_, i) => i !== index);
      setDrivers(updatedDrivers);
      if (editingIndex === index) {
        setEditingIndex(null);
      } else if (editingIndex !== null && editingIndex > index) {
        setEditingIndex(editingIndex - 1);
      }
      saveData(updatedDrivers);
    },
    [drivers, editingIndex, saveData]
  );

  /**
   * Toggle edit mode for driver
   */
  const handleEditToggle = useCallback(
    (index: number) => {
      setEditingIndex(editingIndex === index ? null : index);
    },
    [editingIndex]
  );

  const canAddDriver = drivers.length < MAX_DRIVERS;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Drivers</CardTitle>
        </div>
        <CardDescription>
          Drivers to be included in the auto insurance quote
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Driver List */}
        <div className="space-y-3">
          {drivers.length === 0 && (
            <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
              No drivers added yet. Click &quot;Add Driver&quot; to get started.
            </div>
          )}

          {drivers.map((driver, index) => (
            <DriverCard
              key={driver.id ?? index}
              driver={driver}
              index={index}
              isFirst={index === 0}
              isEditing={editingIndex === index}
              onEditToggle={() => handleEditToggle(index)}
              onUpdate={(d) => handleUpdateDriver(index, d)}
              onRemove={() => handleRemoveDriver(index)}
            />
          ))}
        </div>

        {/* Add Driver Button - AC-Q3.1-24 */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-block">
                <Button
                  variant="outline"
                  onClick={handleAddDriver}
                  disabled={!canAddDriver}
                  data-testid="add-driver"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Driver
                </Button>
              </div>
            </TooltipTrigger>
            {!canAddDriver && (
              <TooltipContent>
                <p>Maximum {MAX_DRIVERS} drivers</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
