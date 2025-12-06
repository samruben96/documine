# Background & Context

## Problem Statement

The current fixed-size chunking (1000 characters) has several issues:
- Semantic units (paragraphs, sections) are split inappropriately
- Tables are broken across chunks, destroying their structure
- Insurance documents have specific patterns (coverage sections, exclusions) that get fragmented
- Questions about table data often return "Not Found" due to chunking issues

## Research Findings

Based on technical research (2025-12-01):

1. **RecursiveCharacterTextSplitter**: 85-90% recall with 400-512 token chunks
2. **Table-Aware Chunking**: +20% improvement for table queries when tables preserved
3. **Overlap**: 10-20% overlap (50 tokens for 500-token chunks) maintains context

**Key Insight**: When table structure is destroyed by improper chunking, LLMs cannot perceive meaningful information. Insurance documents contain critical tables (coverage limits, deductibles, exclusions).

---
