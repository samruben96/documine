/**
 * Date formatting utilities
 *
 * Provides relative date formatting for document timestamps.
 * Implements AC-4.3.2: Upload date shows relative format.
 */

/**
 * Format a date string as a relative time description
 *
 * Formats:
 * - "Just now" for < 1 minute
 * - "X minutes ago" for < 1 hour
 * - "X hours ago" for < 24 hours
 * - "Yesterday" for 1 day ago
 * - "Nov 20" for older dates (short month format)
 *
 * @param dateString - ISO date string to format
 * @returns Human-readable relative date string
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays === 1) return 'Yesterday';

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
