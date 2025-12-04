/**
 * @vitest-environment happy-dom
 *
 * GapConflictBanner Component Tests
 *
 * Story 7.4: AC-7.4.4, AC-7.4.5
 * Tests for the gap/conflict summary banner.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GapConflictBanner } from '@/components/compare/gap-conflict-banner';
import type { GapWarning, ConflictWarning } from '@/lib/compare/diff';

// ============================================================================
// Test Fixtures
// ============================================================================

const mockGaps: GapWarning[] = [
  {
    field: 'Property',
    coverageType: 'property',
    documentsMissing: [1],
    documentsPresent: [0, 2],
    severity: 'high',
  },
  {
    field: 'Cyber Liability',
    coverageType: 'cyber',
    documentsMissing: [0, 1],
    documentsPresent: [2],
    severity: 'low',
  },
];

const mockConflicts: ConflictWarning[] = [
  {
    field: 'General Liability',
    conflictType: 'limit_variance',
    description: 'General Liability limit varies 70% ($300,000 to $1,000,000)',
    affectedDocuments: [0, 1],
    severity: 'high',
    coverageType: 'general_liability',
  },
  {
    field: 'Flood Exclusion',
    conflictType: 'exclusion_mismatch',
    description: 'Flood excluded in 1 quote(s) but not in 1',
    affectedDocuments: [0, 1],
    severity: 'high',
  },
];

// ============================================================================
// Rendering Tests
// ============================================================================

describe('GapConflictBanner', () => {
  it('renders nothing when no gaps or conflicts', () => {
    const onItemClick = vi.fn();
    const { container } = render(
      <GapConflictBanner gaps={[]} conflicts={[]} onItemClick={onItemClick} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('AC-7.4.4: renders summary with correct counts', () => {
    const onItemClick = vi.fn();
    render(
      <GapConflictBanner
        gaps={mockGaps}
        conflicts={mockConflicts}
        onItemClick={onItemClick}
      />
    );

    // Check summary text
    expect(screen.getByText(/2 potential gaps/)).toBeInTheDocument();
    expect(screen.getByText(/2 conflicts identified/)).toBeInTheDocument();
  });

  it('renders gaps only when no conflicts', () => {
    const onItemClick = vi.fn();
    render(
      <GapConflictBanner gaps={mockGaps} conflicts={[]} onItemClick={onItemClick} />
    );

    expect(screen.getByText(/2 potential gaps/)).toBeInTheDocument();
    expect(screen.getByText(/0 conflicts/)).toBeInTheDocument();
  });

  it('renders conflicts only when no gaps', () => {
    const onItemClick = vi.fn();
    render(
      <GapConflictBanner gaps={[]} conflicts={mockConflicts} onItemClick={onItemClick} />
    );

    expect(screen.getByText(/0 potential gaps/)).toBeInTheDocument();
    expect(screen.getByText(/2 conflicts/)).toBeInTheDocument();
  });

  it('displays gap items with field names', () => {
    const onItemClick = vi.fn();
    render(
      <GapConflictBanner
        gaps={mockGaps}
        conflicts={[]}
        onItemClick={onItemClick}
      />
    );

    expect(screen.getByText('Property')).toBeInTheDocument();
    expect(screen.getByText('Cyber Liability')).toBeInTheDocument();
  });

  it('displays conflict descriptions', () => {
    const onItemClick = vi.fn();
    render(
      <GapConflictBanner
        gaps={[]}
        conflicts={mockConflicts}
        onItemClick={onItemClick}
      />
    );

    expect(screen.getByText(/General Liability limit varies/)).toBeInTheDocument();
    expect(screen.getByText(/Flood excluded/)).toBeInTheDocument();
  });

  it('displays severity badges', () => {
    const onItemClick = vi.fn();
    render(
      <GapConflictBanner
        gaps={mockGaps}
        conflicts={mockConflicts}
        onItemClick={onItemClick}
      />
    );

    // Should have multiple High badges and one Low badge
    const highBadges = screen.getAllByText('High');
    const lowBadges = screen.getAllByText('Low');
    expect(highBadges.length).toBeGreaterThan(0);
    expect(lowBadges.length).toBeGreaterThan(0);
  });

  it('has data-testid for automation', () => {
    const onItemClick = vi.fn();
    render(
      <GapConflictBanner
        gaps={mockGaps}
        conflicts={mockConflicts}
        onItemClick={onItemClick}
      />
    );

    expect(screen.getByTestId('gap-conflict-banner')).toBeInTheDocument();
  });
});

// ============================================================================
// Interaction Tests
// ============================================================================

describe('GapConflictBanner interactions', () => {
  it('AC-7.4.5: calls onItemClick with gap data when gap clicked', () => {
    const onItemClick = vi.fn();
    render(
      <GapConflictBanner
        gaps={mockGaps}
        conflicts={[]}
        onItemClick={onItemClick}
      />
    );

    // Click on Property gap
    const propertyButton = screen.getByRole('button', {
      name: /View Property gap details/,
    });
    fireEvent.click(propertyButton);

    expect(onItemClick).toHaveBeenCalledWith('Property', 'property');
  });

  it('AC-7.4.5: calls onItemClick with conflict data when conflict clicked', () => {
    const onItemClick = vi.fn();
    render(
      <GapConflictBanner
        gaps={[]}
        conflicts={mockConflicts}
        onItemClick={onItemClick}
      />
    );

    // Click on GL conflict
    const conflictButton = screen.getByRole('button', {
      name: /View General Liability conflict details/,
    });
    fireEvent.click(conflictButton);

    expect(onItemClick).toHaveBeenCalledWith(
      'General Liability',
      'general_liability'
    );
  });

  it('toggles collapse/expand when header clicked', () => {
    const onItemClick = vi.fn();
    render(
      <GapConflictBanner
        gaps={mockGaps}
        conflicts={mockConflicts}
        onItemClick={onItemClick}
      />
    );

    // Initially expanded - should see gap/conflict items
    expect(screen.getByText('Property')).toBeInTheDocument();

    // Click header to collapse
    const header = screen.getByText(/2 potential gaps/);
    fireEvent.click(header);

    // Content should be hidden
    expect(screen.queryByText('Property')).not.toBeInTheDocument();

    // Click again to expand
    fireEvent.click(header);

    // Content should be visible again
    expect(screen.getByText('Property')).toBeInTheDocument();
  });

  it('has accessible expand/collapse button', () => {
    const onItemClick = vi.fn();
    render(
      <GapConflictBanner
        gaps={mockGaps}
        conflicts={mockConflicts}
        onItemClick={onItemClick}
      />
    );

    const expandButton = screen.getByRole('button', {
      name: /Collapse issue list/,
    });
    expect(expandButton).toBeInTheDocument();
    expect(expandButton).toHaveAttribute('aria-expanded', 'true');
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('GapConflictBanner edge cases', () => {
  it('handles singular forms correctly', () => {
    const onItemClick = vi.fn();
    const singleGap: GapWarning[] = [
      {
        field: 'Property',
        coverageType: 'property',
        documentsMissing: [1],
        documentsPresent: [0],
        severity: 'high',
      },
    ];
    const singleConflict: ConflictWarning[] = [
      {
        field: 'General Liability',
        conflictType: 'limit_variance',
        description: 'Limit variance detected',
        affectedDocuments: [0, 1],
        severity: 'high',
      },
    ];

    render(
      <GapConflictBanner
        gaps={singleGap}
        conflicts={singleConflict}
        onItemClick={onItemClick}
      />
    );

    // Should use singular form when count is 1
    expect(screen.getByText(/1 potential gap,/)).toBeInTheDocument();
    expect(screen.getByText(/1 conflict identified/)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const onItemClick = vi.fn();
    render(
      <GapConflictBanner
        gaps={mockGaps}
        conflicts={mockConflicts}
        onItemClick={onItemClick}
        className="custom-class"
      />
    );

    const banner = screen.getByTestId('gap-conflict-banner');
    expect(banner).toHaveClass('custom-class');
  });
});
