'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { QuoteExtraction, DocumentSummary, ComparisonData } from '@/types/compare';

/**
 * Entry mode for one-pager page.
 * AC-9.3.2: comparison mode, AC-9.3.3: document mode, AC-9.3.4: select mode
 */
export type OnePagerEntryMode = 'comparison' | 'document' | 'select';

/**
 * Document item for selection list.
 */
export interface SelectableDocument {
  id: string;
  filename: string;
  carrierName: string | null;
  status: string;
  createdAt: string;
}

/**
 * One-pager data state.
 */
export interface OnePagerData {
  /** Entry mode determined from searchParams */
  entryMode: OnePagerEntryMode;
  /** Comparison ID if in comparison mode */
  comparisonId: string | null;
  /** Document ID if in document mode */
  documentId: string | null;
  /** Loaded extractions (from comparison or document) */
  extractions: QuoteExtraction[];
  /** Document summaries */
  documents: DocumentSummary[];
  /** Default client name (from namedInsured) */
  defaultClientName: string;
  /** List of selectable documents for select mode */
  selectableDocuments: SelectableDocument[];
}

interface UseOnePagerDataReturn {
  data: OnePagerData | null;
  isLoading: boolean;
  error: Error | null;
  /** Load comparison by ID (for select mode after user selects) */
  loadComparison: (comparisonId: string) => Promise<void>;
  /** Load document by ID (for select mode after user selects) */
  loadDocument: (documentId: string) => Promise<void>;
  /** Fetch selectable documents */
  fetchSelectableDocuments: () => Promise<void>;
}

/**
 * useOnePagerData Hook
 * Story 9.3: Fetches data based on entry mode (comparison, document, or select).
 *
 * @param comparisonId - Comparison ID from searchParams
 * @param documentId - Document ID from searchParams
 */
export function useOnePagerData(
  comparisonId: string | null,
  documentId: string | null
): UseOnePagerDataReturn {
  const [data, setData] = useState<OnePagerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = useMemo(() => createClient(), []);

  // Determine entry mode
  const entryMode: OnePagerEntryMode = useMemo(() => {
    if (comparisonId) return 'comparison';
    if (documentId) return 'document';
    return 'select';
  }, [comparisonId, documentId]);

  /**
   * Load comparison data from API.
   * AC-9.3.2: Pre-populate from comparison.
   */
  const loadComparison = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/compare/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch comparison');
      }

      const comparisonResponse = await response.json();

      // Extract default client name from first extraction's namedInsured
      const defaultClientName =
        comparisonResponse.extractions?.[0]?.namedInsured || '';

      setData({
        entryMode: 'comparison',
        comparisonId: id,
        documentId: null,
        extractions: comparisonResponse.extractions || [],
        documents: comparisonResponse.documents || [],
        defaultClientName,
        selectableDocuments: [],
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load comparison';
      setError(new Error(errorMessage));
      console.error('Error loading comparison:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load document data.
   * AC-9.3.3: Pre-populate from document.
   * Note: For single document, we need to check for cached extraction.
   */
  const loadDocument = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch document details
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();

      if (docError || !docData) {
        throw new Error(docError?.message || 'Document not found');
      }

      // Check for cached extraction in quote_extractions table
      // Use maybeSingle() to gracefully handle case where no extraction exists yet
      const { data: extractionData, error: extractionError } = await supabase
        .from('quote_extractions')
        .select('*')
        .eq('document_id', id)
        .maybeSingle();

      if (extractionError) {
        console.warn('Error fetching extraction:', extractionError);
      }

      // Try extraction from quote_extractions table first, fall back to documents.extraction_data
      let extraction = extractionData?.extracted_data as QuoteExtraction | null;

      // Fallback: check documents.extraction_data (Story 10.12 - extraction at upload)
      if (!extraction && docData.extraction_data) {
        extraction = docData.extraction_data as unknown as QuoteExtraction;
      }

      const extractions = extraction ? [extraction] : [];

      const documentSummary: DocumentSummary = {
        id: docData.id,
        filename: docData.display_name || docData.filename,
        carrierName: extraction?.carrierName || null,
        extractedAt: extractionData?.created_at || docData.created_at,
        extracted: !!extraction,
      };

      // Default client name from extraction if available
      const defaultClientName = extraction?.namedInsured || '';

      setData({
        entryMode: 'document',
        comparisonId: null,
        documentId: id,
        extractions,
        documents: [documentSummary],
        defaultClientName,
        selectableDocuments: [],
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load document';
      setError(new Error(errorMessage));
      console.error('Error loading document:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  /**
   * Fetch selectable documents for direct access mode.
   * AC-9.3.4: Show document list for selection.
   */
  const fetchSelectableDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get user's agency
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Fetch ready documents
      const { data: docs, error: docsError } = await supabase
        .from('documents')
        .select('id, display_name, filename, status, created_at')
        .eq('status', 'ready')
        .order('created_at', { ascending: false })
        .limit(50);

      if (docsError) {
        throw new Error(docsError.message);
      }

      // Map to selectable format
      const selectableDocs: SelectableDocument[] = (docs || []).map((doc) => ({
        id: doc.id,
        filename: doc.display_name || doc.filename,
        carrierName: null, // Would need extraction to know carrier
        status: doc.status,
        createdAt: doc.created_at,
      }));

      setData({
        entryMode: 'select',
        comparisonId: null,
        documentId: null,
        extractions: [],
        documents: [],
        defaultClientName: '',
        selectableDocuments: selectableDocs,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch documents';
      setError(new Error(errorMessage));
      console.error('Error fetching selectable documents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Initial data load based on entry mode
  useEffect(() => {
    if (comparisonId) {
      loadComparison(comparisonId);
    } else if (documentId) {
      loadDocument(documentId);
    } else {
      fetchSelectableDocuments();
    }
  }, [comparisonId, documentId, loadComparison, loadDocument, fetchSelectableDocuments]);

  return {
    data,
    isLoading,
    error,
    loadComparison,
    loadDocument,
    fetchSelectableDocuments,
  };
}
