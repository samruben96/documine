/**
 * Date Grouping Utility Tests
 * Story 16.4: Conversation History & General Chat
 *
 * Tests for groupConversationsByDate function.
 * AC-16.4.2: Date groups: Today, Yesterday, Previous 7 days, Older
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { groupConversationsByDate } from '@/lib/ai-buddy/date-grouping';
import type { Conversation } from '@/types/ai-buddy';

// Mock date-fns to control date comparisons
vi.mock('date-fns', async (importOriginal) => {
  const actual = await importOriginal<typeof import('date-fns')>();
  return {
    ...actual,
    // Keep actual implementations but can override in tests
  };
});

describe('groupConversationsByDate', () => {
  const mockDate = new Date('2024-01-15T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createConversation = (id: string, updatedAt: Date): Conversation => ({
    id,
    agencyId: 'agency-1',
    userId: 'user-1',
    projectId: null,
    title: `Conversation ${id}`,
    deletedAt: null,
    createdAt: updatedAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  });

  it('returns empty array for empty input', () => {
    const result = groupConversationsByDate([]);
    expect(result).toEqual([]);
  });

  it('groups conversations from today correctly', () => {
    const today = new Date('2024-01-15T10:00:00Z');
    const conversations = [createConversation('1', today)];

    const result = groupConversationsByDate(conversations);

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('Today');
    expect(result[0].conversations).toHaveLength(1);
    expect(result[0].conversations[0].id).toBe('1');
  });

  it('groups conversations from yesterday correctly', () => {
    const yesterday = new Date('2024-01-14T10:00:00Z');
    const conversations = [createConversation('1', yesterday)];

    const result = groupConversationsByDate(conversations);

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('Yesterday');
    expect(result[0].conversations).toHaveLength(1);
  });

  it('groups conversations from previous 7 days correctly', () => {
    const fiveDaysAgo = new Date('2024-01-10T10:00:00Z');
    const conversations = [createConversation('1', fiveDaysAgo)];

    const result = groupConversationsByDate(conversations);

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('Previous 7 days');
    expect(result[0].conversations).toHaveLength(1);
  });

  it('groups older conversations correctly', () => {
    const twoWeeksAgo = new Date('2024-01-01T10:00:00Z');
    const conversations = [createConversation('1', twoWeeksAgo)];

    const result = groupConversationsByDate(conversations);

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('Older');
    expect(result[0].conversations).toHaveLength(1);
  });

  it('groups multiple conversations into correct groups', () => {
    const today = new Date('2024-01-15T10:00:00Z');
    const yesterday = new Date('2024-01-14T10:00:00Z');
    const threeDaysAgo = new Date('2024-01-12T10:00:00Z');
    const twoWeeksAgo = new Date('2024-01-01T10:00:00Z');

    const conversations = [
      createConversation('1', today),
      createConversation('2', today),
      createConversation('3', yesterday),
      createConversation('4', threeDaysAgo),
      createConversation('5', twoWeeksAgo),
    ];

    const result = groupConversationsByDate(conversations);

    expect(result).toHaveLength(4);

    // Today
    expect(result[0].label).toBe('Today');
    expect(result[0].conversations).toHaveLength(2);

    // Yesterday
    expect(result[1].label).toBe('Yesterday');
    expect(result[1].conversations).toHaveLength(1);

    // Previous 7 days
    expect(result[2].label).toBe('Previous 7 days');
    expect(result[2].conversations).toHaveLength(1);

    // Older
    expect(result[3].label).toBe('Older');
    expect(result[3].conversations).toHaveLength(1);
  });

  it('returns groups in correct order: Today, Yesterday, Previous 7 days, Older', () => {
    const today = new Date('2024-01-15T10:00:00Z');
    const yesterday = new Date('2024-01-14T10:00:00Z');
    const threeDaysAgo = new Date('2024-01-12T10:00:00Z');
    const twoWeeksAgo = new Date('2024-01-01T10:00:00Z');

    // Add in reverse order to test sorting
    const conversations = [
      createConversation('5', twoWeeksAgo),
      createConversation('4', threeDaysAgo),
      createConversation('3', yesterday),
      createConversation('1', today),
    ];

    const result = groupConversationsByDate(conversations);

    expect(result.map((g) => g.label)).toEqual([
      'Today',
      'Yesterday',
      'Previous 7 days',
      'Older',
    ]);
  });

  it('does not return empty groups', () => {
    const today = new Date('2024-01-15T10:00:00Z');
    const twoWeeksAgo = new Date('2024-01-01T10:00:00Z');

    // No Yesterday or Previous 7 days conversations
    const conversations = [
      createConversation('1', today),
      createConversation('2', twoWeeksAgo),
    ];

    const result = groupConversationsByDate(conversations);

    expect(result).toHaveLength(2);
    expect(result.map((g) => g.label)).toEqual(['Today', 'Older']);
  });

  it('correctly categorizes edge case: exactly 7 days ago', () => {
    const sevenDaysAgo = new Date('2024-01-08T10:00:00Z');
    const conversations = [createConversation('1', sevenDaysAgo)];

    const result = groupConversationsByDate(conversations);

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('Previous 7 days');
  });

  it('correctly categorizes edge case: 8 days ago is Older', () => {
    const eightDaysAgo = new Date('2024-01-07T10:00:00Z');
    const conversations = [createConversation('1', eightDaysAgo)];

    const result = groupConversationsByDate(conversations);

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('Older');
  });
});
