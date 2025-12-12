/**
 * @vitest-environment happy-dom
 */
/**
 * VehicleCard Component Tests
 * Story Q3.1: Data Capture Forms
 *
 * Tests for:
 * - AC-Q3.1-20: Display vehicle as "[Year] [Make] [Model]"
 * - AC-Q3.1-21: Remove with confirmation dialog
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VehicleCard } from '@/components/quoting/vehicle-card';
import type { Vehicle } from '@/types/quoting';

describe('VehicleCard', () => {
  const mockVehicle: Vehicle = {
    id: 'vehicle-1',
    year: 2020,
    make: 'Toyota',
    model: 'Camry',
    usage: 'commute',
    annualMileage: 12000,
  };

  const defaultProps = {
    vehicle: mockVehicle,
    index: 0,
    onUpdate: vi.fn(),
    onRemove: vi.fn(),
    isEditing: false,
    onEditToggle: vi.fn(),
  };

  it('AC-Q3.1-20: displays vehicle title as "[Year] [Make] [Model]"', () => {
    render(<VehicleCard {...defaultProps} />);

    expect(screen.getByText('2020 Toyota Camry')).toBeInTheDocument();
  });

  it('displays fallback title when vehicle data is incomplete', () => {
    const incompleteVehicle: Vehicle = { id: 'v-1' };
    render(
      <VehicleCard
        {...defaultProps}
        vehicle={incompleteVehicle}
        index={2}
      />
    );

    expect(screen.getByText('Vehicle 3')).toBeInTheDocument();
  });

  it('displays usage and mileage in view mode', () => {
    render(<VehicleCard {...defaultProps} />);

    expect(screen.getByText('commute')).toBeInTheDocument();
    expect(screen.getByText('12,000 mi/yr')).toBeInTheDocument();
  });

  it('shows edit button in view mode', () => {
    render(<VehicleCard {...defaultProps} />);

    const editButton = screen.getByTestId('vehicle-edit-0');
    expect(editButton).toBeInTheDocument();
  });

  it('calls onEditToggle when edit button is clicked', () => {
    const onEditToggle = vi.fn();
    render(<VehicleCard {...defaultProps} onEditToggle={onEditToggle} />);

    const editButton = screen.getByTestId('vehicle-edit-0');
    fireEvent.click(editButton);

    expect(onEditToggle).toHaveBeenCalled();
  });

  it('shows remove button in view mode', () => {
    render(<VehicleCard {...defaultProps} />);

    const removeButton = screen.getByTestId('vehicle-remove-0');
    expect(removeButton).toBeInTheDocument();
  });

  it('AC-Q3.1-21: shows confirmation dialog when remove is clicked', async () => {
    render(<VehicleCard {...defaultProps} />);

    const removeButton = screen.getByTestId('vehicle-remove-0');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.getByText('Remove Vehicle')).toBeInTheDocument();
    });
  });

  it('calls onRemove when confirmation is confirmed', async () => {
    const onRemove = vi.fn();
    render(<VehicleCard {...defaultProps} onRemove={onRemove} />);

    // Click remove button
    const removeButton = screen.getByTestId('vehicle-remove-0');
    fireEvent.click(removeButton);

    // Wait for dialog and confirm
    await waitFor(() => {
      expect(screen.getByText('Remove Vehicle')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /^remove$/i });
    fireEvent.click(confirmButton);

    expect(onRemove).toHaveBeenCalled();
  });

  describe('edit mode', () => {
    it('shows edit card with different testid when isEditing is true', () => {
      render(<VehicleCard {...defaultProps} isEditing={true} />);

      expect(screen.getByTestId('vehicle-card-0-edit')).toBeInTheDocument();
    });

    it('shows form inputs when isEditing is true', () => {
      render(<VehicleCard {...defaultProps} isEditing={true} />);

      // Should show inputs via testids
      expect(screen.getByTestId('vehicle-make-0')).toBeInTheDocument();
      expect(screen.getByTestId('vehicle-model-0')).toBeInTheDocument();
      expect(screen.getByTestId('vehicle-year-0')).toBeInTheDocument();
    });

    it('shows save and cancel buttons in edit mode', () => {
      render(<VehicleCard {...defaultProps} isEditing={true} />);

      expect(screen.getByTestId('vehicle-save-0')).toBeInTheDocument();
      expect(screen.getByTestId('vehicle-cancel-0')).toBeInTheDocument();
    });

    it('calls onUpdate with edited data when save is clicked', async () => {
      const onUpdate = vi.fn();
      render(
        <VehicleCard
          {...defaultProps}
          onUpdate={onUpdate}
          isEditing={true}
        />
      );

      // Change make input
      const makeInput = screen.getByTestId('vehicle-make-0');
      fireEvent.change(makeInput, { target: { value: 'Honda' } });

      // Click save
      const saveButton = screen.getByTestId('vehicle-save-0');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            make: 'Honda',
          })
        );
      });
    });

    it('calls onEditToggle when cancel is clicked', () => {
      const onEditToggle = vi.fn();
      render(
        <VehicleCard
          {...defaultProps}
          onEditToggle={onEditToggle}
          isEditing={true}
        />
      );

      const cancelButton = screen.getByTestId('vehicle-cancel-0');
      fireEvent.click(cancelButton);

      expect(onEditToggle).toHaveBeenCalled();
    });
  });

  it('renders view mode card with correct testid', () => {
    render(<VehicleCard {...defaultProps} />);

    expect(screen.getByTestId('vehicle-card-0')).toBeInTheDocument();
  });
});
