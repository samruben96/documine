# Acceptance Criteria

## AC-6.2.1: Separate Score Properties
**Given** the retrieval pipeline returns chunks
**When** chunks are processed through reranking
**Then** each chunk has separate `vectorSimilarity` and `rerankerScore` properties

**Verification:** Unit test + code review

## AC-6.2.2: Correct Confidence for Vector-Only Mode
**Given** reranking is disabled (fallback mode)
**When** confidence is calculated
**Then** confidence uses vector similarity thresholds (>= 0.75 High, 0.50-0.74 Review, < 0.50 Not Found)

**Verification:** Unit test

## AC-6.2.3: Correct Confidence for Reranker Mode
**Given** reranking is enabled and returns results
**When** confidence is calculated
**Then** confidence uses Cohere-calibrated thresholds (>= 0.30 High, 0.10-0.29 Review, < 0.10 Not Found)

**Verification:** Unit test

## AC-6.2.4: Accurate Answer Shows Appropriate Badge
**Given** I ask a question with a clear answer in the document (e.g., "What is the total annual premium?")
**When** the AI provides the correct answer with sources
**Then** confidence badge shows "High Confidence" or "Needs Review" - NOT "Not Found"

**Verification:** Playwright E2E test

## AC-6.2.5: Greeting Shows No Confidence or "Conversational"
**Given** I send a greeting like "Hello!" or "Hi there"
**When** the AI responds conversationally
**Then** confidence badge is hidden OR shows "Conversational" indicator (not "Not Found")

**Verification:** Playwright E2E test

## AC-6.2.6: Logging for Debugging
**Given** a query is processed
**When** confidence is calculated
**Then** server logs include vector similarity, reranker score (if used), query intent, and final confidence level

**Verification:** Check server logs during E2E test

---
