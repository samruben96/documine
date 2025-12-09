/**
 * Date Grouping Utility
 * Story 16.4: Conversation History & General Chat
 *
 * Groups conversations by date: Today, Yesterday, Previous 7 days, Older.
 *
 * AC-16.4.1: Sidebar "Recent" section shows conversations grouped by date
 * AC-16.4.2: Date groups: Today, Yesterday, Previous 7 days, Older
 */

import { isToday, isYesterday, differenceInDays } from 'date-fns';
import type { Conversation } from '@/types/ai-buddy';

export interface ConversationGroup {
  label: 'Today' | 'Yesterday' | 'Previous 7 days' | 'Older';
  conversations: Conversation[];
}

type GroupLabel = ConversationGroup['label'];

/**
 * Group conversations by date
 * Returns only non-empty groups in order: Today, Yesterday, Previous 7 days, Older
 *
 * @param conversations - Array of conversations sorted by updatedAt DESC
 * @returns Array of ConversationGroup with non-empty groups only
 */
export function groupConversationsByDate(
  conversations: Conversation[]
): ConversationGroup[] {
  const groups: Record<GroupLabel, Conversation[]> = {
    'Today': [],
    'Yesterday': [],
    'Previous 7 days': [],
    'Older': [],
  };

  for (const conv of conversations) {
    const date = new Date(conv.updatedAt);
    const now = new Date();

    if (isToday(date)) {
      groups['Today'].push(conv);
    } else if (isYesterday(date)) {
      groups['Yesterday'].push(conv);
    } else if (differenceInDays(now, date) <= 7) {
      groups['Previous 7 days'].push(conv);
    } else {
      groups['Older'].push(conv);
    }
  }

  // Return only non-empty groups in order
  const orderedLabels: GroupLabel[] = ['Today', 'Yesterday', 'Previous 7 days', 'Older'];

  return orderedLabels
    .filter((label) => groups[label].length > 0)
    .map((label) => ({
      label,
      conversations: groups[label],
    }));
}
