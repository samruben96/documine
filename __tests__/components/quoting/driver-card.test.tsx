/**
 * @vitest-environment happy-dom
 */
/**
 * DriverCard Component Tests
 * Story Q3.1: Data Capture Forms
 *
 * Tests for:
 * - AC-Q3.1-26: First driver defaults to "Self" relationship
 * - AC-Q3.1-27: License number masked in view mode
 * - AC-Q3.1-28: Display format "[First] [Last] ([Relationship]) - [X] years licensed"
 * - AC-Q3.1-29: Remove driver with confirmation
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DriverCard } from '@/components/quoting/driver-card';
import type { Driver } from '@/types/quoting';

describe('DriverCard', () => {
  const mockDriver: Driver = {
    id: 'driver-1',
    firstName: 'John',
    lastName: 'Smith',
    dateOfBirth: '1990-01-15',
    licenseNumber: 'DL12345678',
    licenseState: 'CA',
    yearsLicensed: 10,
    relationship: 'self',
    accidentsPast5Years: 0,
    violationsPast5Years: 0,
  };

  const defaultProps = {
    driver: mockDriver,
    index: 0,
    onUpdate: vi.fn(),
    onRemove: vi.fn(),
    isEditing: false,
    onEditToggle: vi.fn(),
  };

  it('AC-Q3.1-28: displays driver name as "[First] [Last]"', () => {
    render(<DriverCard {...defaultProps} />);

    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });

  it('displays relationship in parentheses', () => {
    render(<DriverCard {...defaultProps} />);

    // Relationship should be "(Self)"
    expect(screen.getByText('(Self)')).toBeInTheDocument();
  });

  it('displays years licensed', () => {
    render(<DriverCard {...defaultProps} />);

    expect(screen.getByText('10 years licensed')).toBeInTheDocument();
  });

  it('displays fallback title when driver data is incomplete', () => {
    const incompleteDriver: Driver = { id: 'd-1' };
    render(
      <DriverCard
        {...defaultProps}
        driver={incompleteDriver}
        index={1}
      />
    );

    expect(screen.getByText('Driver 2')).toBeInTheDocument();
  });

  it('AC-Q3.1-27: displays masked license number in view mode', () => {
    render(<DriverCard {...defaultProps} />);

    // License number should be masked (showing only last 4)
    // DL12345678 -> ••••••5678
    expect(screen.getByText('••••••5678')).toBeInTheDocument();
  });

  it('shows edit button in view mode', () => {
    render(<DriverCard {...defaultProps} />);

    const editButton = screen.getByTestId('driver-edit-0');
    expect(editButton).toBeInTheDocument();
  });

  it('calls onEditToggle when edit button is clicked', () => {
    const onEditToggle = vi.fn();
    render(<DriverCard {...defaultProps} onEditToggle={onEditToggle} />);

    const editButton = screen.getByTestId('driver-edit-0');
    fireEvent.click(editButton);

    expect(onEditToggle).toHaveBeenCalled();
  });

  it('shows remove button in view mode', () => {
    render(<DriverCard {...defaultProps} />);

    const removeButton = screen.getByTestId('driver-remove-0');
    expect(removeButton).toBeInTheDocument();
  });

  it('AC-Q3.1-29: shows confirmation dialog when remove is clicked', async () => {
    render(<DriverCard {...defaultProps} />);

    const removeButton = screen.getByTestId('driver-remove-0');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.getByText('Remove Driver')).toBeInTheDocument();
    });
  });

  it('calls onRemove when confirmation is confirmed', async () => {
    const onRemove = vi.fn();
    render(<DriverCard {...defaultProps} onRemove={onRemove} />);

    // Click remove button
    const removeButton = screen.getByTestId('driver-remove-0');
    fireEvent.click(removeButton);

    // Wait for dialog and confirm
    await waitFor(() => {
      expect(screen.getByText('Remove Driver')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /^remove$/i });
    fireEvent.click(confirmButton);

    expect(onRemove).toHaveBeenCalled();
  });

  describe('edit mode', () => {
    it('shows edit card with different testid when isEditing is true', () => {
      render(<DriverCard {...defaultProps} isEditing={true} />);

      expect(screen.getByTestId('driver-card-0-edit')).toBeInTheDocument();
    });

    it('shows form inputs when isEditing is true', () => {
      render(<DriverCard {...defaultProps} isEditing={true} />);

      // Should show name inputs via testids
      expect(screen.getByTestId('driver-firstName-0')).toBeInTheDocument();
      expect(screen.getByTestId('driver-lastName-0')).toBeInTheDocument();
    });

    it('shows save and cancel buttons in edit mode', () => {
      render(<DriverCard {...defaultProps} isEditing={true} />);

      expect(screen.getByTestId('driver-save-0')).toBeInTheDocument();
      expect(screen.getByTestId('driver-cancel-0')).toBeInTheDocument();
    });

    it('calls onUpdate with edited data when save is clicked', async () => {
      const onUpdate = vi.fn();
      render(
        <DriverCard
          {...defaultProps}
          onUpdate={onUpdate}
          isEditing={true}
        />
      );

      // Change first name input
      const firstNameInput = screen.getByTestId('driver-firstName-0');
      fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

      // Click save
      const saveButton = screen.getByTestId('driver-save-0');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'Jane',
          })
        );
      });
    });

    it('calls onEditToggle when cancel is clicked', () => {
      const onEditToggle = vi.fn();
      render(
        <DriverCard
          {...defaultProps}
          onEditToggle={onEditToggle}
          isEditing={true}
        />
      );

      const cancelButton = screen.getByTestId('driver-cancel-0');
      fireEvent.click(cancelButton);

      expect(onEditToggle).toHaveBeenCalled();
    });
  });

  describe('AC-Q3.1-26: First driver defaults to Self', () => {
    it('sets relationship to "self" for first driver when undefined', async () => {
      const driverNoRelationship: Driver = {
        ...mockDriver,
        relationship: undefined,
      };
      const onUpdate = vi.fn();

      render(
        <DriverCard
          {...defaultProps}
          driver={driverNoRelationship}
          isFirst={true}
          isEditing={true}
          onUpdate={onUpdate}
        />
      );

      // Click save
      const saveButton = screen.getByTestId('driver-save-0');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            relationship: 'self',
          })
        );
      });
    });
  });

  it('renders view mode card with correct testid', () => {
    render(<DriverCard {...defaultProps} />);

    expect(screen.getByTestId('driver-card-0')).toBeInTheDocument();
  });
});
