/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentList } from '@/components/documents/document-list';
import type { Tables } from '@/types/database.types';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => ({}),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

type Document = Tables<'documents'>;

const createMockDocument = (overrides: Partial<Document> = {}): Document => ({
  id: crypto.randomUUID(),
  agency_id: 'test-agency',
  filename: 'test-document.pdf',
  display_name: null,
  status: 'ready',
  storage_path: '/test/path.pdf',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  page_count: null,
  uploaded_by: 'test-user',
  ...overrides,
});

describe('DocumentList', () => {
  const mockOnFilesAccepted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-4.3.1: Document List Item Structure', () => {
    it('renders document list with filenames', () => {
      const documents = [
        createMockDocument({ id: '1', filename: 'document1.pdf' }),
        createMockDocument({ id: '2', filename: 'document2.pdf' }),
      ];

      render(
        <DocumentList
          documents={documents}
          onFilesAccepted={mockOnFilesAccepted}
        />
      );

      expect(screen.getByText('document1.pdf')).toBeInTheDocument();
      expect(screen.getByText('document2.pdf')).toBeInTheDocument();
    });

    it('uses display_name when available', () => {
      const documents = [
        createMockDocument({
          id: '1',
          filename: 'ugly-filename.pdf',
          display_name: 'Nice Document Name',
        }),
      ];

      render(
        <DocumentList
          documents={documents}
          onFilesAccepted={mockOnFilesAccepted}
        />
      );

      expect(screen.getByText('Nice Document Name')).toBeInTheDocument();
      expect(screen.queryByText('ugly-filename.pdf')).not.toBeInTheDocument();
    });
  });

  describe('AC-4.3.4: Sort Order', () => {
    it('renders documents in the order provided (assumed sorted by created_at DESC)', () => {
      const documents = [
        createMockDocument({
          id: '1',
          filename: 'newest.pdf',
          created_at: '2025-11-30T12:00:00Z',
        }),
        createMockDocument({
          id: '2',
          filename: 'older.pdf',
          created_at: '2025-11-29T12:00:00Z',
        }),
        createMockDocument({
          id: '3',
          filename: 'oldest.pdf',
          created_at: '2025-11-28T12:00:00Z',
        }),
      ];

      render(
        <DocumentList
          documents={documents}
          onFilesAccepted={mockOnFilesAccepted}
        />
      );

      const items = screen.getAllByRole('button');
      // First two buttons are search-related, actual document buttons start after
      const docButtons = items.filter((btn) =>
        btn.textContent?.includes('.pdf')
      );

      expect(docButtons[0]).toHaveTextContent('newest.pdf');
      expect(docButtons[1]).toHaveTextContent('older.pdf');
      expect(docButtons[2]).toHaveTextContent('oldest.pdf');
    });
  });

  describe('AC-4.3.6: Search/Filter', () => {
    it('renders search input at top of sidebar', () => {
      const documents = [createMockDocument()];

      render(
        <DocumentList
          documents={documents}
          onFilesAccepted={mockOnFilesAccepted}
        />
      );

      expect(
        screen.getByPlaceholderText('Search documents...')
      ).toBeInTheDocument();
    });

    it('filters documents by filename match', async () => {
      const documents = [
        createMockDocument({ id: '1', filename: 'contract-2024.pdf' }),
        createMockDocument({ id: '2', filename: 'invoice-2024.pdf' }),
        createMockDocument({ id: '3', filename: 'contract-2023.pdf' }),
      ];

      render(
        <DocumentList
          documents={documents}
          onFilesAccepted={mockOnFilesAccepted}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search documents...');
      await userEvent.type(searchInput, 'contract');

      // Wait for debounce
      await waitFor(
        () => {
          expect(screen.getByText('contract-2024.pdf')).toBeInTheDocument();
          expect(screen.getByText('contract-2023.pdf')).toBeInTheDocument();
          expect(screen.queryByText('invoice-2024.pdf')).not.toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });

    it('search is case-insensitive', async () => {
      const documents = [
        createMockDocument({ id: '1', filename: 'MyContract.pdf' }),
      ];

      render(
        <DocumentList
          documents={documents}
          onFilesAccepted={mockOnFilesAccepted}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search documents...');
      await userEvent.type(searchInput, 'mycontract');

      await waitFor(
        () => {
          expect(screen.getByText('MyContract.pdf')).toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });

    it('shows clear button when search has text', async () => {
      const documents = [createMockDocument()];

      render(
        <DocumentList
          documents={documents}
          onFilesAccepted={mockOnFilesAccepted}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search documents...');

      // Clear button not visible initially
      expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();

      await userEvent.type(searchInput, 'test');

      // Clear button should appear
      expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
    });

    it('clears search when clear button is clicked', async () => {
      const documents = [
        createMockDocument({ id: '1', filename: 'document1.pdf' }),
        createMockDocument({ id: '2', filename: 'document2.pdf' }),
      ];

      render(
        <DocumentList
          documents={documents}
          onFilesAccepted={mockOnFilesAccepted}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search documents...');
      await userEvent.type(searchInput, 'document1');

      await waitFor(
        () => {
          expect(screen.queryByText('document2.pdf')).not.toBeInTheDocument();
        },
        { timeout: 500 }
      );

      const clearButton = screen.getByLabelText('Clear search');
      await userEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText('document1.pdf')).toBeInTheDocument();
        expect(screen.getByText('document2.pdf')).toBeInTheDocument();
      });
    });

    it('shows empty results message when no matches', async () => {
      const documents = [
        createMockDocument({ id: '1', filename: 'contract.pdf' }),
      ];

      render(
        <DocumentList
          documents={documents}
          onFilesAccepted={mockOnFilesAccepted}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search documents...');
      await userEvent.type(searchInput, 'nonexistent');

      await waitFor(
        () => {
          expect(
            screen.getByText(/No documents found matching 'nonexistent'/)
          ).toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });
  });

  describe('AC-4.3.9: Empty State', () => {
    it('shows empty state when no documents exist', () => {
      render(
        <DocumentList
          documents={[]}
          onFilesAccepted={mockOnFilesAccepted}
        />
      );

      // AC-6.7.6, AC-6.8.13: Updated engaging copy
      expect(screen.getByText('Your documents await')).toBeInTheDocument();
      expect(
        screen.getByText(/Drop a policy, quote, or certificate/)
      ).toBeInTheDocument();
    });

    it('shows upload zone in empty state', () => {
      render(
        <DocumentList
          documents={[]}
          onFilesAccepted={mockOnFilesAccepted}
        />
      );

      expect(
        screen.getByText('Drop a document here or click to upload')
      ).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows skeleton loading state when isLoading is true', () => {
      render(
        <DocumentList
          documents={[]}
          onFilesAccepted={mockOnFilesAccepted}
          isLoading={true}
        />
      );

      // Check for skeleton placeholders
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('upload button', () => {
    it('renders upload button at bottom of list', () => {
      const documents = [createMockDocument()];

      render(
        <DocumentList
          documents={documents}
          onFilesAccepted={mockOnFilesAccepted}
        />
      );

      expect(
        screen.getByRole('button', { name: /upload document/i })
      ).toBeInTheDocument();
    });
  });
});
