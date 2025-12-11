/**
 * Chart to Image Conversion for PDF Export
 *
 * Story 23.7: AC-23.7.1 (Task 4)
 * Captures Recharts SVG visualizations as PNG images for PDF embedding.
 *
 * @module @/lib/reporting/chart-capture
 */

import html2canvas from 'html2canvas';

// ============================================================================
// Types
// ============================================================================

export interface CaptureOptions {
  /** Image scale factor (default: 2 for retina) */
  scale?: number;
  /** Background color (default: white) */
  backgroundColor?: string;
  /** PNG quality (0-1) */
  quality?: number;
}

// ============================================================================
// Chart Capture Functions
// ============================================================================

/**
 * Captures a DOM element as a base64 PNG image.
 *
 * @param element - The DOM element to capture (typically a chart container)
 * @param options - Capture options
 * @returns Base64 encoded PNG data URL
 */
export async function captureElementAsImage(
  element: HTMLElement,
  options: CaptureOptions = {}
): Promise<string> {
  const { scale = 2, backgroundColor = '#ffffff', quality = 0.92 } = options;

  try {
    const canvas = await html2canvas(element, {
      scale,
      backgroundColor,
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    return canvas.toDataURL('image/png', quality);
  } catch (error) {
    console.error('[chartCapture] Failed to capture element:', error);
    throw new Error('Failed to capture chart as image');
  }
}

/**
 * Captures multiple chart elements as base64 images.
 *
 * @param elements - Array of chart DOM elements
 * @param options - Capture options
 * @returns Array of base64 encoded PNG data URLs
 */
export async function captureChartsAsImages(
  elements: HTMLElement[],
  options: CaptureOptions = {}
): Promise<string[]> {
  const images: string[] = [];

  for (const element of elements) {
    try {
      const image = await captureElementAsImage(element, options);
      images.push(image);
    } catch (error) {
      // Push empty string for failed captures, allowing PDF to show placeholder
      console.warn('[chartCapture] Skipping failed chart capture');
      images.push('');
    }
  }

  return images;
}

/**
 * Captures chart containers by their data-testid pattern.
 *
 * @param containerSelector - CSS selector for chart container (default: '[data-testid^="report-chart-"]')
 * @param options - Capture options
 * @returns Array of base64 encoded PNG data URLs
 */
export async function captureChartsBySelector(
  containerSelector: string = '[data-testid^="report-chart-"]',
  options: CaptureOptions = {}
): Promise<string[]> {
  const elements = document.querySelectorAll<HTMLElement>(containerSelector);

  if (elements.length === 0) {
    console.warn('[chartCapture] No chart elements found with selector:', containerSelector);
    return [];
  }

  return captureChartsAsImages(Array.from(elements), options);
}

/**
 * Utility to capture charts from refs.
 *
 * @param refs - Array of React refs pointing to chart containers
 * @param options - Capture options
 * @returns Array of base64 encoded PNG data URLs
 */
export async function captureChartsFromRefs(
  refs: React.RefObject<HTMLElement | null>[],
  options: CaptureOptions = {}
): Promise<string[]> {
  const elements = refs
    .map((ref) => ref.current)
    .filter((el): el is HTMLElement => el !== null);

  if (elements.length === 0) {
    console.warn('[chartCapture] No chart refs resolved to elements');
    return [];
  }

  return captureChartsAsImages(elements, options);
}
