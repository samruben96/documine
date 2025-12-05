# Technical Approach (High-Level)

## Option 1: Server-Sent Progress (Recommended)

**Edge Function Changes:**
- Add progress reporting to each stage
- Store progress in `processing_jobs.progress_data` JSON field
- Update periodically during long operations

**Frontend Changes:**
- Subscribe to `processing_jobs` table changes via Supabase Realtime
- Parse `progress_data` JSON to extract:
  - Current stage
  - Stage progress (0-100)
  - Estimated time remaining
- Update UI reactively

**Example `progress_data` structure:**
```json
{
  "stage": "parsing",
  "stage_progress": 45,
  "stage_name": "Parsing document",
  "estimated_seconds_remaining": 120,
  "total_progress": 30
}
```

## Option 2: Client-Side Estimation

**Edge Function Changes:**
- Minimal - just report stage transitions

**Frontend Changes:**
- Estimate progress based on file size + elapsed time
- Less accurate but simpler implementation

---
