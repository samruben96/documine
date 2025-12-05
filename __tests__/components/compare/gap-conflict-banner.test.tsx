/**
 * @vitest-environment happy-dom
 *
 * GapConflictBanner Component Tests
 *
 * Story 7.4: AC-7.4.4, AC-7.4.5
 * Story 10.7: AC-10.7.6 - Enhanced with gap analysis, endorsement gaps, risk score
 * Tests for the gap/conflict summary banner.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GapConflictBanner } from '@/components/compare/gap-conflict-banner';
import type { GapWarning, ConflictWarning } from '@/lib/compare/diff';
import type { GapAnalysis } from '@/types/compare';

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

  it('AC-7.4.4: renders summary with total issue count', () => {
    const onItemClick = vi.fn();
    render(
      <GapConflictBanner
        gaps={mockGaps}
        conflicts={mockConflicts}
        onItemClick={onItemClick}
      />
    );

    // Check summary text - now shows total issues count
    expect(screen.getByText(/4 issues identified/)).toBeInTheDocument();
  });

  it('renders gaps only when no conflicts', () => {
    const onItemClick = vi.fn();
    render(
      <GapConflictBanner gaps={mockGaps} conflicts={[]} onItemClick={onItemClick} />
    );

    // Should show 2 issues (2 gaps)
    expect(screen.getByText(/2 issues identified/)).toBeInTheDocument();
  });

  it('renders conflicts only when no gaps', () => {
    const onItemClick = vi.fn();
    render(
      <GapConflictBanner gaps={[]} conflicts={mockConflicts} onItemClick={onItemClick} />
    );

    // Should show 2 issues (2 conflicts)
    expect(screen.getByText(/2 issues identified/)).toBeInTheDocument();
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

    // Click header to collapse - use the new "issues identified" text
    const header = screen.getByText(/4 issues identified/);
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

    // Should use singular "issue" when count is > 1, but correctly pluralize
    // 1 gap + 1 conflict = 2 issues
    expect(screen.getByText(/2 issues identified/)).toBeInTheDocument();
  });

  it('handles single issue with singular form', () => {
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

    render(
      <GapConflictBanner
        gaps={singleGap}
        conflicts={[]}
        onItemClick={onItemClick}
      />
    );

    // Should use singular "issue" when count is 1
    expect(screen.getByText(/1 issue identified/)).toBeInTheDocument();
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

// ============================================================================
// Story 10.7: Gap Analysis Feature Tests
// ============================================================================

describe('GapConflictBanner with gapAnalysis (AC-10.7.6)', () => {
  const mockGapAnalysis: GapAnalysis = {
    missingCoverages: [],
    limitConcerns: [
      {
        coverage: 'General Liability',
        currentLimit: 500000,
        recommendedMinimum: 1000000,
        reason: 'GL limit is below recommended minimum',
        documentIndex: 0,
        carrierName: 'Carrier A',
      },
    ],
    endorsementGaps: [
      {
        endorsement: 'Additional Insured',
        formNumber: 'CG 20 10',
        importance: 'critical',
        reason: 'Required for most contracts',
        presentIn: ['Carrier B'],
      },
    ],
    overallRiskScore: 60,
  };

  it('displays risk score badge when gapAnalysis is provided', () => {
    const onItemClick = vi.fn();
    render(
      <GapConflictBanner
        gaps={[]}
        conflicts={[]}
        onItemClick={onItemClick}
        gapAnalysis={mockGapAnalysis}
      />
    );

    const riskBadge = screen.getByTestId('risk-score-badge');
    expect(riskBadge).toBeInTheDocument();
    expect(riskBadge).toHaveTextContent('60');
    expect(riskBadge).toHaveTextContent('High Risk');
  });

  it('displays endorsement gaps section', () => {
    const onItemClick = vi.fn();
    render(
      <GapConflictBanner
        gaps={[]}
        conflicts={[]}
        onItemClick={onItemClick}
        gapAnalysis={mockGapAnalysis}
      />
    );

    expect(screen.getByText(/Missing Endorsements/)).toBeInTheDocument();
    expect(screen.getByTestId('endorsement-gap-item')).toBeInTheDocument();
    expect(screen.getByText('Additional Insured')).toBeInTheDocument();
    expect(screen.getByText('(CG 20 10)')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('displays limit concerns section', () => {
    const onItemClick = vi.fn();
    render(
      <GapConflictBanner
        gaps={[]}
        conflicts={[]}
        onItemClick={onItemClick}
        gapAnalysis={mockGapAnalysis}
      />
    );

    expect(screen.getByText(/Limit Concerns/)).toBeInTheDocument();
    expect(screen.getByTestId('limit-concern-item')).toBeInTheDocument();
    expect(screen.getByText(/\$500,000/)).toBeInTheDocument();
    expect(screen.getByText(/\$1,000,000/)).toBeInTheDocument();
    expect(screen.getByText('Carrier A', { exact: false })).toBeInTheDocument();
  });

  it('includes gapAnalysis issues in total count', () => {
    const onItemClick = vi.fn();
    render(
      <GapConflictBanner
        gaps={mockGaps} // 2 gaps
        conflicts={[]} // 0 conflicts
        onItemClick={onItemClick}
        gapAnalysis={mockGapAnalysis} // 1 limit concern + 1 endorsement gap = 2
      />
    );

    // Total: 2 gaps + 0 conflicts + 1 limit concern + 1 endorsement gap = 4
    expect(screen.getByText(/4 issues identified/)).toBeInTheDocument();
  });

  it('does not show risk badge when score is 0', () => {
    const onItemClick = vi.fn();
    const zeroScoreAnalysis: GapAnalysis = {
      missingCoverages: [],
      limitConcerns: [],
      endorsementGaps: [],
      overallRiskScore: 0,
    };

    render(
      <GapConflictBanner
        gaps={mockGaps}
        conflicts={[]}
        onItemClick={onItemClick}
        gapAnalysis={zeroScoreAnalysis}
      />
    );

    expect(screen.queryByTestId('risk-score-badge')).not.toBeInTheDocument();
  });

  it('shows correct risk level colors', () => {
    const onItemClick = vi.fn();

    // Test medium risk (30-59)
    const mediumRiskAnalysis: GapAnalysis = {
      missingCoverages: [],
      limitConcerns: [mockGapAnalysis.limitConcerns[0]!],
      endorsementGaps: [],
      overallRiskScore: 45,
    };

    const { rerender } = render(
      <GapConflictBanner
        gaps={[]}
        conflicts={[]}
        onItemClick={onItemClick}
        gapAnalysis={mediumRiskAnalysis}
      />
    );

    let riskBadge = screen.getByTestId('risk-score-badge');
    expect(riskBadge).toHaveTextContent('Medium Risk');

    // Test low risk (<30)
    const lowRiskAnalysis: GapAnalysis = {
      ...mediumRiskAnalysis,
      overallRiskScore: 15,
    };

    rerender(
      <GapConflictBanner
        gaps={[]}
        conflicts={[]}
        onItemClick={onItemClick}
        gapAnalysis={lowRiskAnalysis}
      />
    );

    riskBadge = screen.getByTestId('risk-score-badge');
    expect(riskBadge).toHaveTextContent('Low Risk');
  });
});
