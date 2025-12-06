/**
 * Tests for Extraction Readiness Utilities
 *
 * Story 11.7: AC-11.7.1 - Extraction Status Detection
 */

import { describe, it, expect } from 'vitest';
import {
  getExtractionReadiness,
  estimateExtractionTime,
  getReadinessMessage,
  type DocumentWithExtraction,
} from '@/lib/compare/extraction-readiness';

// Helper to create test documents
function createDoc(
  id: string,
  overrides: Partial<DocumentWithExtraction> = {}
): DocumentWithExtraction {
  return {
    id,
    filename: `doc-${id}.pdf`,
    display_name: null,
    status: 'ready',
    extraction_status: null,
    extraction_data: null,
    page_count: 10,
    created_at: new Date().toISOString(),
    document_type: 'quote',
    ...overrides,
  };
}

describe('getExtractionReadiness', () => {
  describe('categorization by extraction_status', () => {
    it('should categorize complete documents as ready', () => {
      const docs = [
        createDoc('1', { extraction_status: 'complete', extraction_data: { test: true } }),
        createDoc('2', { extraction_status: 'complete', extraction_data: { test: true } }),
      ];

      const result = getExtractionReadiness(docs);

      expect(result.allReady).toBe(true);
      expect(result.readyDocs).toHaveLength(2);
      expect(result.pendingDocs).toHaveLength(0);
      expect(result.extractingDocs).toHaveLength(0);
      expect(result.failedDocs).toHaveLength(0);
    });

    it('should categorize pending documents correctly', () => {
      const docs = [
        createDoc('1', { extraction_status: 'pending' }),
        createDoc('2', { extraction_status: 'complete', extraction_data: { test: true } }),
      ];

      const result = getExtractionReadiness(docs);

      expect(result.allReady).toBe(false);
      expect(result.readyDocs).toHaveLength(1);
      expect(result.pendingDocs).toHaveLength(1);
      expect(result.pendingDocs[0].id).toBe('1');
    });

    it('should categorize extracting documents correctly', () => {
      const docs = [
        createDoc('1', { extraction_status: 'extracting' }),
        createDoc('2', { extraction_status: 'extracting' }),
      ];

      const result = getExtractionReadiness(docs);

      expect(result.allReady).toBe(false);
      expect(result.extractingDocs).toHaveLength(2);
      expect(result.pendingDocs).toHaveLength(0);
    });

    it('should categorize failed documents correctly', () => {
      const docs = [
        createDoc('1', { extraction_status: 'failed' }),
        createDoc('2', { extraction_status: 'complete', extraction_data: { test: true } }),
      ];

      const result = getExtractionReadiness(docs);

      expect(result.allReady).toBe(true); // Failed docs don't block
      expect(result.failedDocs).toHaveLength(1);
      expect(result.readyDocs).toHaveLength(1);
    });

    it('should categorize skipped documents correctly', () => {
      const docs = [
        createDoc('1', { extraction_status: 'skipped', document_type: 'general' }),
      ];

      const result = getExtractionReadiness(docs);

      expect(result.skippedDocs).toHaveLength(1);
      expect(result.allReady).toBe(true);
    });
  });

  describe('legacy support for null extraction_status', () => {
    it('should treat null status with extraction_data as ready', () => {
      const docs = [
        createDoc('1', { extraction_status: null, extraction_data: { legacy: true } }),
      ];

      const result = getExtractionReadiness(docs);

      expect(result.allReady).toBe(true);
      expect(result.readyDocs).toHaveLength(1);
      expect(result.pendingDocs).toHaveLength(0);
    });

    it('should treat null status without extraction_data as pending', () => {
      const docs = [
        createDoc('1', { extraction_status: null, extraction_data: null }),
      ];

      const result = getExtractionReadiness(docs);

      expect(result.allReady).toBe(false);
      expect(result.pendingDocs).toHaveLength(1);
    });
  });

  describe('edge cases', () => {
    it('should handle pending docs with existing extraction_data', () => {
      // Edge case: Status is pending but has data from earlier attempt
      const docs = [
        createDoc('1', { extraction_status: 'pending', extraction_data: { old: true } }),
      ];

      const result = getExtractionReadiness(docs);

      expect(result.allReady).toBe(true);
      expect(result.readyDocs).toHaveLength(1);
      expect(result.pendingDocs).toHaveLength(0);
    });

    it('should handle failed docs with partial extraction_data', () => {
      // Edge case: Failed but has partial data
      const docs = [
        createDoc('1', { extraction_status: 'failed', extraction_data: { partial: true } }),
      ];

      const result = getExtractionReadiness(docs);

      expect(result.allReady).toBe(true);
      expect(result.readyDocs).toHaveLength(1);
      expect(result.failedDocs).toHaveLength(0);
    });

    it('should handle empty document array', () => {
      const result = getExtractionReadiness([]);

      expect(result.allReady).toBe(true);
      expect(result.readyDocs).toHaveLength(0);
    });

    it('should handle mixed extraction states correctly', () => {
      const docs = [
        createDoc('1', { extraction_status: 'complete', extraction_data: { test: true } }),
        createDoc('2', { extraction_status: 'extracting' }),
        createDoc('3', { extraction_status: 'pending' }),
        createDoc('4', { extraction_status: 'failed' }),
        createDoc('5', { extraction_status: 'skipped' }),
      ];

      const result = getExtractionReadiness(docs);

      expect(result.allReady).toBe(false);
      expect(result.readyDocs).toHaveLength(1);
      expect(result.extractingDocs).toHaveLength(1);
      expect(result.pendingDocs).toHaveLength(1);
      expect(result.failedDocs).toHaveLength(1);
      expect(result.skippedDocs).toHaveLength(1);
    });
  });
});

describe('estimateExtractionTime', () => {
  it('should estimate ~2 seconds per page', () => {
    const docs = [
      createDoc('1', { page_count: 10 }),
      createDoc('2', { page_count: 10 }),
    ];

    const estimate = estimateExtractionTime(docs);

    expect(estimate).toBe(40); // 20 pages * 2 seconds
  });

  it('should use default 10 pages when page_count is null', () => {
    const docs = [
      createDoc('1', { page_count: null }),
    ];

    const estimate = estimateExtractionTime(docs);

    expect(estimate).toBe(20); // 10 pages * 2 seconds
  });

  it('should apply minimum 15 second bound', () => {
    const docs = [
      createDoc('1', { page_count: 1 }),
    ];

    const estimate = estimateExtractionTime(docs);

    expect(estimate).toBe(15); // Minimum bound
  });

  it('should apply maximum 120 second bound', () => {
    const docs = [
      createDoc('1', { page_count: 100 }),
    ];

    const estimate = estimateExtractionTime(docs);

    expect(estimate).toBe(120); // Maximum bound
  });
});

describe('getReadinessMessage', () => {
  it('should return ready message when all complete', () => {
    const readiness = getExtractionReadiness([
      createDoc('1', { extraction_status: 'complete', extraction_data: { test: true } }),
    ]);

    expect(getReadinessMessage(readiness)).toBe('All documents ready for comparison');
  });

  it('should show analyzing message when extracting', () => {
    const readiness = getExtractionReadiness([
      createDoc('1', { extraction_status: 'extracting' }),
      createDoc('2', { extraction_status: 'extracting' }),
    ]);

    expect(getReadinessMessage(readiness)).toBe('Analyzing 2 documents...');
  });

  it('should show waiting message when pending', () => {
    const readiness = getExtractionReadiness([
      createDoc('1', { extraction_status: 'pending' }),
    ]);

    expect(getReadinessMessage(readiness)).toBe('Waiting for 1 document');
  });

  it('should show failed count in message', () => {
    const readiness = getExtractionReadiness([
      createDoc('1', { extraction_status: 'complete', extraction_data: { test: true } }),
      createDoc('2', { extraction_status: 'failed' }),
    ]);

    expect(getReadinessMessage(readiness)).toBe('1 of 2 ready (1 failed)');
  });
});
