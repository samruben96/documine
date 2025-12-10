/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  AdminPanelSkeleton,
  UserManagementSkeleton,
  AuditLogSkeleton,
} from '@/components/admin/admin-panel-skeleton';

/**
 * Story 22.2: AC-22.2.1, AC-22.2.5
 * Tests for AdminPanelSkeleton component
 */
describe('AdminPanelSkeleton', () => {
  it('renders with default props', () => {
    render(<AdminPanelSkeleton />);

    // Should render card wrapper by default
    expect(screen.getByTestId('admin-panel-skeleton')).toBeInTheDocument();

    // Should show search skeleton by default
    expect(screen.getByTestId('search-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('action-button-skeleton')).toBeInTheDocument();

    // Should render 5 rows by default
    for (let i = 0; i < 5; i++) {
      expect(screen.getByTestId(`row-skeleton-${i}`)).toBeInTheDocument();
    }
  });

  it('renders configurable number of rows', () => {
    render(<AdminPanelSkeleton rows={3} />);

    // Should render exactly 3 rows
    expect(screen.getByTestId('row-skeleton-0')).toBeInTheDocument();
    expect(screen.getByTestId('row-skeleton-1')).toBeInTheDocument();
    expect(screen.getByTestId('row-skeleton-2')).toBeInTheDocument();
    expect(screen.queryByTestId('row-skeleton-3')).not.toBeInTheDocument();
  });

  it('renders configurable number of columns', () => {
    render(<AdminPanelSkeleton columns={3} />);

    // Should render 3 header skeletons
    expect(screen.getByTestId('header-skeleton-0')).toBeInTheDocument();
    expect(screen.getByTestId('header-skeleton-1')).toBeInTheDocument();
    expect(screen.getByTestId('header-skeleton-2')).toBeInTheDocument();
    expect(screen.queryByTestId('header-skeleton-3')).not.toBeInTheDocument();
  });

  it('hides search when showSearch is false', () => {
    render(<AdminPanelSkeleton showSearch={false} />);

    expect(screen.queryByTestId('search-skeleton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('action-button-skeleton')).not.toBeInTheDocument();
  });

  it('shows filters when showFilters is true', () => {
    const { container } = render(<AdminPanelSkeleton showFilters={true} />);

    // Filter skeletons should exist
    const filterSkeletons = container.querySelectorAll('.flex.flex-wrap.items-center.gap-3 [data-slot="skeleton"]');
    expect(filterSkeletons.length).toBe(3);
  });

  it('renders without card wrapper when showCard is false', () => {
    render(<AdminPanelSkeleton showCard={false} />);

    expect(screen.queryByTestId('admin-panel-skeleton')).not.toBeInTheDocument();
    // Table should still render
    expect(screen.getByTestId('row-skeleton-0')).toBeInTheDocument();
  });

  it('applies custom column widths', () => {
    const { container } = render(
      <AdminPanelSkeleton columns={2} columnWidths={['w-20', 'w-40']} />
    );

    const headers = container.querySelectorAll('thead [data-slot="skeleton"]');
    expect(headers[0]).toHaveClass('w-20');
    expect(headers[1]).toHaveClass('w-40');
  });

  it('applies custom className', () => {
    const { container } = render(
      <AdminPanelSkeleton showCard={false} className="custom-class" />
    );

    const wrapper = container.querySelector('.custom-class');
    expect(wrapper).toBeInTheDocument();
  });

  it('renders skeleton elements with animate-pulse', () => {
    const { container } = render(<AdminPanelSkeleton />);

    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    skeletons.forEach(skeleton => {
      expect(skeleton).toHaveClass('animate-pulse');
    });
  });
});

describe('UserManagementSkeleton', () => {
  it('renders pre-configured skeleton for user management', () => {
    render(<UserManagementSkeleton />);

    // Should have search
    expect(screen.getByTestId('search-skeleton')).toBeInTheDocument();

    // Should have 5 rows and 5 columns
    expect(screen.getByTestId('row-skeleton-4')).toBeInTheDocument();
    expect(screen.getByTestId('header-skeleton-4')).toBeInTheDocument();
  });
});

describe('AuditLogSkeleton', () => {
  it('renders pre-configured skeleton for audit log', () => {
    const { container } = render(<AuditLogSkeleton />);

    // Should not have search
    expect(screen.queryByTestId('search-skeleton')).not.toBeInTheDocument();

    // Should have filters
    const filterSkeletons = container.querySelectorAll('.flex.flex-wrap.items-center.gap-3 [data-slot="skeleton"]');
    expect(filterSkeletons.length).toBe(3);

    // Should have 6 columns
    expect(screen.getByTestId('header-skeleton-5')).toBeInTheDocument();
  });
});
