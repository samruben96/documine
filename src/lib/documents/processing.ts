/**
 * Document Processing Helpers
 * Story 5.8.1: Large Document Processing Reliability
 *
 * Utilities for estimating processing time and displaying progress
 */

/**
 * Estimate processing time based on file size
 * Per AC-5.8.1.3: Display estimated time ranges
 *
 * Time estimates based on hybrid approach:
 * - <5MB: Quick processing (<1 min)
 * - 5-20MB: Moderate processing (1-2 min)
 * - 20-50MB: Extended processing (3-5 min)
 *
 * @param fileSizeBytes - File size in bytes
 * @returns Human-readable time estimate string
 */
export function estimateProcessingTime(fileSizeBytes: number): string {
  const MB = 1024 * 1024;

  if (fileSizeBytes < 5 * MB) {
    return '<1 min';
  } else if (fileSizeBytes < 20 * MB) {
    return '1-2 min';
  } else {
    return '3-5 min';
  }
}

/**
 * Format bytes to human-readable string
 * Helper for displaying file sizes
 *
 * @param bytes - File size in bytes
 * @returns Formatted string like "15.5 MB"
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
