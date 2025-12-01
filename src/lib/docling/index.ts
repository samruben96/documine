/**
 * Docling Document Parsing Module
 *
 * Exports the Docling client for document parsing.
 * This module replaces @/lib/llamaparse for document processing.
 *
 * @module @/lib/docling
 */

export {
  parseDocument,
  checkHealth,
  extractPageInfo,
} from './client';

export type {
  DoclingResult,
  PageMarker,
  BoundingBox,
  ParseOptions,
} from './client';
