# Overview

Epic 7 delivers the second core pillar of docuMINE's value proposition: side-by-side quote comparison for insurance documents. While Epic 5 enabled agents to interrogate individual documents, this epic enables them to compare multiple carrier quotes simultaneously—a daily workflow that currently involves tedious manual spreadsheet work.

The comparison feature automatically extracts structured data from 2-4 insurance quote documents (coverage types, limits, deductibles, exclusions, premiums), displays them in an aligned table view, highlights differences, identifies coverage gaps/conflicts, and allows verification of any extracted value via source citations. This maintains the trust-transparent approach established in Epic 5: every extracted data point is verifiable.

This epic builds directly on the document processing infrastructure from Epic 4 (Docling parsing, chunking, embeddings) and the RAG pipeline from Epic 5 (retrieval, Claude integration). The novel component is GPT-4o function calling for structured data extraction from insurance quotes.
