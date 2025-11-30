import { describe, it, expect } from 'vitest';
import {
  DocumentNotFoundError,
  UnauthorizedError,
  ProcessingError,
  ValidationError,
  LlamaParseError,
  EmbeddingError,
} from '@/lib/errors';

describe('DocumentNotFoundError', () => {
  it('should have correct code', () => {
    const error = new DocumentNotFoundError('doc-123');
    expect(error.code).toBe('DOCUMENT_NOT_FOUND');
  });

  it('should format message with documentId', () => {
    const error = new DocumentNotFoundError('doc-456');
    expect(error.message).toBe('Document doc-456 not found');
  });

  it('should have correct name', () => {
    const error = new DocumentNotFoundError('doc-789');
    expect(error.name).toBe('DocumentNotFoundError');
  });

  it('should extend Error', () => {
    const error = new DocumentNotFoundError('doc-abc');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('UnauthorizedError', () => {
  it('should have correct code', () => {
    const error = new UnauthorizedError();
    expect(error.code).toBe('UNAUTHORIZED');
  });

  it('should use default message when none provided', () => {
    const error = new UnauthorizedError();
    expect(error.message).toBe('Unauthorized access');
  });

  it('should use custom message when provided', () => {
    const error = new UnauthorizedError('Custom unauthorized message');
    expect(error.message).toBe('Custom unauthorized message');
  });

  it('should have correct name', () => {
    const error = new UnauthorizedError();
    expect(error.name).toBe('UnauthorizedError');
  });

  it('should extend Error', () => {
    const error = new UnauthorizedError();
    expect(error).toBeInstanceOf(Error);
  });
});

describe('ProcessingError', () => {
  it('should have correct code', () => {
    const error = new ProcessingError('Processing failed');
    expect(error.code).toBe('PROCESSING_ERROR');
  });

  it('should store message correctly', () => {
    const error = new ProcessingError('Document processing failed');
    expect(error.message).toBe('Document processing failed');
  });

  it('should have correct name', () => {
    const error = new ProcessingError('Error');
    expect(error.name).toBe('ProcessingError');
  });

  it('should extend Error', () => {
    const error = new ProcessingError('Error');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('ValidationError', () => {
  it('should have correct code', () => {
    const error = new ValidationError('Invalid input');
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('should store message correctly', () => {
    const error = new ValidationError('Email format is invalid');
    expect(error.message).toBe('Email format is invalid');
  });

  it('should have correct name', () => {
    const error = new ValidationError('Error');
    expect(error.name).toBe('ValidationError');
  });

  it('should extend Error', () => {
    const error = new ValidationError('Error');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('LlamaParseError', () => {
  it('should have correct code', () => {
    const error = new LlamaParseError('LlamaParse API failed');
    expect(error.code).toBe('LLAMAPARSE_ERROR');
  });

  it('should store message correctly', () => {
    const error = new LlamaParseError('PDF extraction failed');
    expect(error.message).toBe('PDF extraction failed');
  });

  it('should have correct name', () => {
    const error = new LlamaParseError('Error');
    expect(error.name).toBe('LlamaParseError');
  });

  it('should extend Error', () => {
    const error = new LlamaParseError('Error');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('EmbeddingError', () => {
  it('should have correct code', () => {
    const error = new EmbeddingError('Embedding generation failed');
    expect(error.code).toBe('EMBEDDING_ERROR');
  });

  it('should store message correctly', () => {
    const error = new EmbeddingError('OpenAI API returned error');
    expect(error.message).toBe('OpenAI API returned error');
  });

  it('should have correct name', () => {
    const error = new EmbeddingError('Error');
    expect(error.name).toBe('EmbeddingError');
  });

  it('should extend Error', () => {
    const error = new EmbeddingError('Error');
    expect(error).toBeInstanceOf(Error);
  });
});
