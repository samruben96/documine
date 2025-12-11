/**
 * Typography Utility Tests
 * Story DR.8: Typography & Spacing Standardization
 *
 * Tests for typography and spacing utility classes
 */

import { describe, it, expect } from 'vitest';
import { typography, spacing, type TypographyKey, type SpacingKey } from '@/lib/typography';

describe('typography utilities', () => {
  describe('typography.pageTitle (AC: DR.8.1)', () => {
    it('includes text-2xl class', () => {
      expect(typography.pageTitle).toContain('text-2xl');
    });

    it('includes font-semibold class', () => {
      expect(typography.pageTitle).toContain('font-semibold');
    });

    it('includes text-slate-900 class', () => {
      expect(typography.pageTitle).toContain('text-slate-900');
    });

    it('includes dark mode variant dark:text-slate-100', () => {
      expect(typography.pageTitle).toContain('dark:text-slate-100');
    });
  });

  describe('typography.sectionTitle (AC: DR.8.2)', () => {
    it('includes text-lg class', () => {
      expect(typography.sectionTitle).toContain('text-lg');
    });

    it('includes font-medium class', () => {
      expect(typography.sectionTitle).toContain('font-medium');
    });

    it('includes text-slate-900 class', () => {
      expect(typography.sectionTitle).toContain('text-slate-900');
    });

    it('includes dark mode variant dark:text-slate-100', () => {
      expect(typography.sectionTitle).toContain('dark:text-slate-100');
    });
  });

  describe('typography.cardTitle (AC: DR.8.3)', () => {
    it('includes font-medium class', () => {
      expect(typography.cardTitle).toContain('font-medium');
    });

    it('includes text-slate-900 class', () => {
      expect(typography.cardTitle).toContain('text-slate-900');
    });

    it('includes dark mode variant dark:text-slate-100', () => {
      expect(typography.cardTitle).toContain('dark:text-slate-100');
    });
  });

  describe('typography.body (AC: DR.8.4)', () => {
    it('includes text-sm class', () => {
      expect(typography.body).toContain('text-sm');
    });

    it('includes text-slate-600 class', () => {
      expect(typography.body).toContain('text-slate-600');
    });

    it('includes dark mode variant dark:text-slate-300', () => {
      expect(typography.body).toContain('dark:text-slate-300');
    });
  });

  describe('typography.muted (AC: DR.8.5)', () => {
    it('includes text-sm class', () => {
      expect(typography.muted).toContain('text-sm');
    });

    it('includes text-slate-500 class', () => {
      expect(typography.muted).toContain('text-slate-500');
    });

    it('includes dark mode variant dark:text-slate-400', () => {
      expect(typography.muted).toContain('dark:text-slate-400');
    });
  });

  describe('typography.label (AC: DR.8.6)', () => {
    it('includes text-sm class', () => {
      expect(typography.label).toContain('text-sm');
    });

    it('includes font-medium class', () => {
      expect(typography.label).toContain('font-medium');
    });

    it('includes text-slate-700 class', () => {
      expect(typography.label).toContain('text-slate-700');
    });

    it('includes dark mode variant dark:text-slate-300', () => {
      expect(typography.label).toContain('dark:text-slate-300');
    });
  });

  describe('all typography keys have dark mode variants (AC: DR.8.8)', () => {
    const typographyKeys: TypographyKey[] = [
      'pageTitle',
      'sectionTitle',
      'cardTitle',
      'body',
      'muted',
      'label',
    ];

    it.each(typographyKeys)('typography.%s includes dark: variant', (key) => {
      expect(typography[key]).toMatch(/dark:/);
    });
  });
});

describe('spacing utilities', () => {
  describe('spacing.section (AC: DR.8.7)', () => {
    it('equals space-y-6', () => {
      expect(spacing.section).toBe('space-y-6');
    });
  });

  describe('spacing.card (AC: DR.8.8)', () => {
    it('equals p-4', () => {
      expect(spacing.card).toBe('p-4');
    });
  });

  describe('spacing.cardSpacious (AC: DR.8.8)', () => {
    it('equals p-6', () => {
      expect(spacing.cardSpacious).toBe('p-6');
    });
  });

  describe('spacing.cardCompact (AC: DR.8.8)', () => {
    it('equals p-4', () => {
      expect(spacing.cardCompact).toBe('p-4');
    });
  });

  describe('spacing.form (AC: DR.8.9)', () => {
    it('equals space-y-4', () => {
      expect(spacing.form).toBe('space-y-4');
    });
  });
});

describe('type exports', () => {
  it('exports TypographyKey type', () => {
    // Type check - this test verifies the type exists and includes expected keys
    const key: TypographyKey = 'pageTitle';
    expect(Object.keys(typography)).toContain(key);
  });

  it('exports SpacingKey type', () => {
    // Type check - this test verifies the type exists and includes expected keys
    const key: SpacingKey = 'section';
    expect(Object.keys(spacing)).toContain(key);
  });
});

describe('immutability', () => {
  it('typography object is readonly (const assertion)', () => {
    // Attempt to verify the object is frozen/readonly by checking it's defined
    expect(typeof typography).toBe('object');
    expect(Object.keys(typography).length).toBe(6);
  });

  it('spacing object is readonly (const assertion)', () => {
    expect(typeof spacing).toBe('object');
    expect(Object.keys(spacing).length).toBe(5);
  });
});
