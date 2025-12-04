/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorPicker } from '@/components/settings/color-picker';

describe('ColorPicker', () => {
  const defaultProps = {
    label: 'Primary Color',
    value: '#2563eb',
    onChange: vi.fn(),
  };

  it('renders with label', () => {
    render(<ColorPicker {...defaultProps} />);

    expect(screen.getByText('Primary Color')).toBeInTheDocument();
  });

  it('renders color input with current value', () => {
    render(<ColorPicker {...defaultProps} />);

    const colorInput = screen.getByRole('textbox');
    expect(colorInput).toHaveValue('#2563eb');
  });

  it('renders native color picker', () => {
    const { container } = render(<ColorPicker {...defaultProps} />);

    const nativePicker = container.querySelector('input[type="color"]');
    expect(nativePicker).toBeInTheDocument();
    expect(nativePicker).toHaveValue('#2563eb');
  });

  it('calls onChange with valid hex color', () => {
    const onChange = vi.fn();
    render(<ColorPicker {...defaultProps} onChange={onChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '#ff0000' } });

    expect(onChange).toHaveBeenCalledWith('#ff0000');
  });

  it('does not call onChange with invalid hex color', () => {
    const onChange = vi.fn();
    render(<ColorPicker {...defaultProps} onChange={onChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'invalid' } });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows error message for invalid hex', () => {
    render(<ColorPicker {...defaultProps} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'notahex' } });

    expect(
      screen.getByText('Please enter a valid hex color (e.g., #2563eb)')
    ).toBeInTheDocument();
  });

  it('renders preset color buttons', () => {
    render(<ColorPicker {...defaultProps} />);

    // Should have multiple preset color buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('calls onChange when preset color is clicked', () => {
    const onChange = vi.fn();
    render(<ColorPicker {...defaultProps} onChange={onChange} />);

    // Click the first preset button (should be #2563eb)
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);

    expect(onChange).toHaveBeenCalled();
  });

  it('highlights selected preset color', () => {
    const { container } = render(<ColorPicker {...defaultProps} />);

    // The button matching the current value should have a ring
    const selectedButton = container.querySelector('button[title="#2563eb"]');
    expect(selectedButton).toHaveClass('ring-2');
  });

  it('disables inputs when disabled prop is true', () => {
    const { container } = render(<ColorPicker {...defaultProps} disabled />);

    const textInput = screen.getByRole('textbox');
    expect(textInput).toBeDisabled();

    const colorInput = container.querySelector('input[type="color"]');
    expect(colorInput).toBeDisabled();
  });

  it('updates input value from native color picker', () => {
    const onChange = vi.fn();
    const { container } = render(<ColorPicker {...defaultProps} onChange={onChange} />);

    const nativePicker = container.querySelector('input[type="color"]') as HTMLInputElement;
    fireEvent.change(nativePicker, { target: { value: '#00ff00' } });

    expect(onChange).toHaveBeenCalledWith('#00ff00');
  });

  it('syncs input value when prop changes', () => {
    const { rerender } = render(<ColorPicker {...defaultProps} />);

    expect(screen.getByRole('textbox')).toHaveValue('#2563eb');

    rerender(<ColorPicker {...defaultProps} value="#ff0000" />);

    expect(screen.getByRole('textbox')).toHaveValue('#ff0000');
  });
});
