import { describe, it, expect } from 'vitest';
import { sanitizeFilename } from '@/lib/documents/upload';

describe('Document Upload Service', () => {
  describe('sanitizeFilename', () => {
    describe('path traversal prevention', () => {
      it('removes .. sequences', () => {
        expect(sanitizeFilename('../../../etc/passwd.pdf')).toBe('etcpasswd.pdf');
      });

      it('removes forward slashes', () => {
        expect(sanitizeFilename('path/to/file.pdf')).toBe('pathtofile.pdf');
      });

      it('removes backslashes', () => {
        expect(sanitizeFilename('path\\to\\file.pdf')).toBe('pathtofile.pdf');
      });

      it('handles mixed path separators', () => {
        expect(sanitizeFilename('..\\../path/file.pdf')).toBe('pathfile.pdf');
      });
    });

    describe('whitespace handling', () => {
      it('trims leading whitespace', () => {
        expect(sanitizeFilename('  document.pdf')).toBe('document.pdf');
      });

      it('trims trailing whitespace', () => {
        expect(sanitizeFilename('document.pdf  ')).toBe('document.pdf');
      });

      it('preserves internal spaces', () => {
        expect(sanitizeFilename('my document name.pdf')).toBe('my document name.pdf');
      });
    });

    describe('character replacement', () => {
      it('keeps alphanumeric characters', () => {
        expect(sanitizeFilename('Document123.pdf')).toBe('Document123.pdf');
      });

      it('keeps dots, hyphens, and underscores', () => {
        expect(sanitizeFilename('my-doc_v1.2.pdf')).toBe('my-doc_v1.2.pdf');
      });

      it('replaces special characters with underscores', () => {
        expect(sanitizeFilename('doc@#$%^&*.pdf')).toBe('doc_______.pdf');
      });

      it('replaces unicode characters with underscores', () => {
        expect(sanitizeFilename('документ.pdf')).toBe('________.pdf');
      });

      it('replaces emoji with underscores', () => {
        expect(sanitizeFilename('📄document📄.pdf')).toBe('__document__.pdf');
      });
    });

    describe('empty/invalid filename handling', () => {
      it('returns fallback for empty string', () => {
        expect(sanitizeFilename('')).toBe('document.pdf');
      });

      it('returns fallback for only dots', () => {
        expect(sanitizeFilename('...')).toBe('document.pdf');
      });

      it('returns fallback for only spaces', () => {
        expect(sanitizeFilename('   ')).toBe('document.pdf');
      });

      it('returns fallback for only dots and spaces', () => {
        expect(sanitizeFilename('. . .')).toBe('document.pdf');
      });
    });

    describe('common filename patterns', () => {
      it('handles typical PDF filename', () => {
        expect(sanitizeFilename('Insurance_Policy_2024.pdf')).toBe(
          'Insurance_Policy_2024.pdf'
        );
      });

      it('handles filename with date', () => {
        expect(sanitizeFilename('quote-2024-01-15.pdf')).toBe('quote-2024-01-15.pdf');
      });

      it('handles filename with version', () => {
        expect(sanitizeFilename('contract_v2.1_final.pdf')).toBe(
          'contract_v2.1_final.pdf'
        );
      });

      it('handles filename with parentheses', () => {
        expect(sanitizeFilename('document (1).pdf')).toBe('document _1_.pdf');
      });
    });

    describe('edge cases', () => {
      it('handles very long filename', () => {
        const longName = 'a'.repeat(300) + '.pdf';
        const result = sanitizeFilename(longName);
        // Should keep all characters since they are valid
        expect(result).toBe(longName);
      });

      it('handles filename with only extension', () => {
        expect(sanitizeFilename('.pdf')).toBe('.pdf');
      });

      it('handles multiple consecutive path traversals', () => {
        expect(sanitizeFilename('............file.pdf')).toBe('file.pdf');
      });
    });
  });
});
