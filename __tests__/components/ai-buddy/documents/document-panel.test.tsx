/**
 * @vitest-environment happy-dom
 */
/**
 * Document Panel Component Tests
 * Story 17.2: Project Document Management
 *
 * Tests for DocumentPanel collapsible component.
 *
 * AC-17.2.1: Add Document with Upload/Library options
 * AC-17.2.2: Uploaded documents appear in list
 * AC-17.2.5: Remove documents with confirmation
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentPanel } from '@/components/ai-buddy/documents/document-panel';

// Mock the useProjectDocuments hook
vi.mock('@/hooks/ai-buddy/use-project-documents', () => ({
  useProjectDocuments: vi.fn(() => ({
    documents: [],
    isLoading: false,
    isAdding: false,
    isUploading: false,
    isRemoving: false,
    error: null,
    addDocuments: vi.fn(),
    uploadDocuments: vi.fn(),
    removeDocument: vi.fn(),
    canAddMore: true,
    remainingSlots: 25,
    refresh: vi.fn(),
  })),
}));

// Import the mock to configure it in tests
import { useProjectDocuments } from '@/hooks/ai-buddy/use-project-documents';

const mockDocuments = [
  {
    document_id: 'doc-1',
    attached_at: '2024-01-01T00:00:00Z',
    document: {
      id: 'doc-1',
      name: 'Test Policy.pdf',
      file_type: 'pdf',
      status: 'ready',
      page_count: 10,
      created_at: '2024-01-01T00:00:00Z',
      extraction_data: null,
    },
  },
];

describe('DocumentPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default mock
    vi.mocked(useProjectDocuments).mockReturnValue({
      documents: [],
      isLoading: false,
      isAdding: false,
      isUploading: false,
      isRemoving: false,
      error: null,
      addDocuments: vi.fn(),
      uploadDocuments: vi.fn(),
      removeDocument: vi.fn(),
      canAddMore: true,
      remainingSlots: 25,
      refresh: vi.fn(),
    });
  });

  it('renders nothing when no project is selected', () => {
    const { container } = render(<DocumentPanel projectId={null} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders panel when project is selected', () => {
    render(<DocumentPanel projectId="proj-1" />);

    expect(screen.getByTestId('document-panel')).toBeInTheDocument();
  });

  it('shows Documents header', () => {
    render(<DocumentPanel projectId="proj-1" />);

    expect(screen.getByText('Documents')).toBeInTheDocument();
  });

  it('shows document count badge', () => {
    vi.mocked(useProjectDocuments).mockReturnValue({
      documents: mockDocuments,
      isLoading: false,
      isAdding: false,
      isUploading: false,
      isRemoving: false,
      error: null,
      addDocuments: vi.fn(),
      uploadDocuments: vi.fn(),
      removeDocument: vi.fn(),
      canAddMore: true,
      remainingSlots: 24,
      refresh: vi.fn(),
    });

    render(<DocumentPanel projectId="proj-1" />);

    expect(screen.getByText('1/25')).toBeInTheDocument();
  });

  it('shows empty state when no documents', () => {
    render(<DocumentPanel projectId="proj-1" />);

    expect(screen.getByText('No documents yet')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    vi.mocked(useProjectDocuments).mockReturnValue({
      documents: [],
      isLoading: true,
      isAdding: false,
      isUploading: false,
      isRemoving: false,
      error: null,
      addDocuments: vi.fn(),
      uploadDocuments: vi.fn(),
      removeDocument: vi.fn(),
      canAddMore: true,
      remainingSlots: 25,
      refresh: vi.fn(),
    });

    render(<DocumentPanel projectId="proj-1" />);

    // Should show loading spinner
    const panel = screen.getByTestId('document-panel');
    expect(panel.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error state', () => {
    vi.mocked(useProjectDocuments).mockReturnValue({
      documents: [],
      isLoading: false,
      isAdding: false,
      isUploading: false,
      isRemoving: false,
      error: new Error('Failed to load documents'),
      addDocuments: vi.fn(),
      uploadDocuments: vi.fn(),
      removeDocument: vi.fn(),
      canAddMore: true,
      remainingSlots: 25,
      refresh: vi.fn(),
    });

    render(<DocumentPanel projectId="proj-1" />);

    expect(screen.getByText('Failed to load documents')).toBeInTheDocument();
  });

  it('renders document cards when documents exist', () => {
    vi.mocked(useProjectDocuments).mockReturnValue({
      documents: mockDocuments,
      isLoading: false,
      isAdding: false,
      isUploading: false,
      isRemoving: false,
      error: null,
      addDocuments: vi.fn(),
      uploadDocuments: vi.fn(),
      removeDocument: vi.fn(),
      canAddMore: true,
      remainingSlots: 24,
      refresh: vi.fn(),
    });

    render(<DocumentPanel projectId="proj-1" />);

    expect(screen.getByText('Test Policy.pdf')).toBeInTheDocument();
  });

  it('can collapse and expand', () => {
    render(<DocumentPanel projectId="proj-1" />);

    // Panel should be expanded initially
    expect(screen.getByTestId('document-panel')).toBeInTheDocument();

    // Click collapse button
    const collapseButton = screen.getByLabelText('Collapse document panel');
    fireEvent.click(collapseButton);

    // Panel should show expand button now
    expect(screen.getByLabelText('Expand document panel')).toBeInTheDocument();

    // Click expand button
    fireEvent.click(screen.getByLabelText('Expand document panel'));

    // Panel should be expanded again
    expect(screen.getByTestId('document-panel')).toBeInTheDocument();
  });

  it('calls onCollapseChange when collapse state changes', () => {
    const onCollapseChange = vi.fn();
    render(
      <DocumentPanel projectId="proj-1" onCollapseChange={onCollapseChange} />
    );

    // Click collapse button
    fireEvent.click(screen.getByLabelText('Collapse document panel'));

    expect(onCollapseChange).toHaveBeenCalledWith(true);
  });

  it('shows uploading status indicator', () => {
    vi.mocked(useProjectDocuments).mockReturnValue({
      documents: [],
      isLoading: false,
      isAdding: false,
      isUploading: true,
      isRemoving: false,
      error: null,
      addDocuments: vi.fn(),
      uploadDocuments: vi.fn(),
      removeDocument: vi.fn(),
      canAddMore: true,
      remainingSlots: 25,
      refresh: vi.fn(),
    });

    render(<DocumentPanel projectId="proj-1" />);

    expect(screen.getByText('Uploading...')).toBeInTheDocument();
  });

  it('shows adding status indicator', () => {
    vi.mocked(useProjectDocuments).mockReturnValue({
      documents: [],
      isLoading: false,
      isAdding: true,
      isUploading: false,
      isRemoving: false,
      error: null,
      addDocuments: vi.fn(),
      uploadDocuments: vi.fn(),
      removeDocument: vi.fn(),
      canAddMore: true,
      remainingSlots: 25,
      refresh: vi.fn(),
    });

    render(<DocumentPanel projectId="proj-1" />);

    expect(screen.getByText('Adding documents...')).toBeInTheDocument();
  });

  it('has Add Document button', () => {
    render(<DocumentPanel projectId="proj-1" />);

    expect(screen.getByTestId('add-document-button')).toBeInTheDocument();
  });

  it('has hidden file input for uploads', () => {
    render(<DocumentPanel projectId="proj-1" />);

    expect(screen.getByTestId('panel-file-input')).toBeInTheDocument();
  });
});
