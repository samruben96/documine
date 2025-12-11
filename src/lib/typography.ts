/**
 * Typography and Spacing Utility Classes
 *
 * Centralized typography hierarchy and spacing patterns for consistent UI.
 * All components should use these utilities for text styling and spacing.
 *
 * Typography Scale:
 * - pageTitle: Main page headings (text-2xl)
 * - sectionTitle: Section headings within pages (text-lg)
 * - cardTitle: Card/panel headings (text-base)
 * - body: Default body text (text-sm)
 * - muted: Secondary/helper text (text-sm, lighter)
 * - label: Form labels (text-sm, medium weight)
 *
 * Spacing Patterns:
 * - section: Vertical spacing between major sections (space-y-6)
 * - card: Standard card padding (p-4)
 * - cardSpacious: Larger card padding for spacious layouts (p-6)
 * - cardCompact: Compact card padding (p-4)
 * - form: Vertical spacing between form fields (space-y-4)
 */

/**
 * Typography class name constants
 * Use these for consistent text styling across the application
 */
export const typography = {
  /** Page title: text-2xl font-semibold text-slate-900 dark:text-slate-100 */
  pageTitle: 'text-2xl font-semibold text-slate-900 dark:text-slate-100',

  /** Section title: text-lg font-medium text-slate-900 dark:text-slate-100 */
  sectionTitle: 'text-lg font-medium text-slate-900 dark:text-slate-100',

  /** Card title: font-medium text-slate-900 dark:text-slate-100 */
  cardTitle: 'font-medium text-slate-900 dark:text-slate-100',

  /** Body text: text-sm text-slate-600 dark:text-slate-300 */
  body: 'text-sm text-slate-600 dark:text-slate-300',

  /** Muted text: text-sm text-slate-500 dark:text-slate-400 */
  muted: 'text-sm text-slate-500 dark:text-slate-400',

  /** Labels: text-sm font-medium text-slate-700 dark:text-slate-300 */
  label: 'text-sm font-medium text-slate-700 dark:text-slate-300',
} as const;

/**
 * Spacing class name constants
 * Use these for consistent spacing across the application
 */
export const spacing = {
  /** Section gaps: space-y-6 */
  section: 'space-y-6',

  /** Card padding (standard): p-4 */
  card: 'p-4',

  /** Card padding (spacious): p-6 */
  cardSpacious: 'p-6',

  /** Card padding (compact): p-4 */
  cardCompact: 'p-4',

  /** Form field gaps: space-y-4 */
  form: 'space-y-4',
} as const;

/**
 * Type for typography keys
 */
export type TypographyKey = keyof typeof typography;

/**
 * Type for spacing keys
 */
export type SpacingKey = keyof typeof spacing;
