# Background & Context

## Current Experience

Currently, users see:
- ✅ Upload progress bar (0-100%)
- ❌ "Analyzing..." spinner with no details
- ❌ No indication of processing stage
- ❌ No progress within the "Analyzing" phase

## Problem Statement

With Story 5.8.1 optimizations, documents can take **5-8 minutes** to process (large files on paid tier). Users need:
1. **Stage visibility**: What's happening now? (Downloading, Parsing, Embedding)
2. **Progress indication**: How much is complete?
3. **Time awareness**: Estimated time remaining

## User Impact

**Before (Current):**
- User uploads 30MB document
- Sees "Analyzing..." for 6 minutes
- Gets frustrated/confused
- May close browser thinking it's stuck

**After (This Story):**
- User uploads 30MB document
- Sees: "Parsing document... 45% complete (2 min remaining)"
- Feels informed and patient
- Waits confidently

---
