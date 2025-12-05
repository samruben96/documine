# Background & Context

## Problem Statement

On 2025-12-02, a user uploaded a large PDF (`2025 B&B Proposal(83).pdf` - likely 83 pages) which caused:
- Edge function timeout after 150 seconds (status code 546)
- Document stuck in "processing" status indefinitely
- No user feedback about the failure
- No way to recover without manual database intervention

## Root Cause Analysis

| Component | Issue | Impact |
|-----------|-------|--------|
| **Supabase Edge Function** | Hard limit ~150s execution time | Cannot process large documents |
| **Docling Service** | 150s timeout = no buffer for other operations | Entire pipeline times out |
| **Frontend** | No file size/page limit validation | Users can upload any size |
| **UI** | No progress feedback | Users don't know processing status |
| **Error Recovery** | Document stuck in "processing" | Requires manual DB fix |

## Evidence from Logs

```
Edge Function Log:
- Status: 546 (timeout)
- execution_time_ms: 150,209 (2.5 minutes)
- Document stuck in status: "processing"
```

## Current Architecture Limitations

```
┌─────────────────────────────────────────────────────────────┐
│                    SINGLE EDGE FUNCTION                      │
│                      (150s max limit)                        │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Download │→ │  Parse   │→ │  Chunk   │→ │  Embed   │    │
│  │  (~5s)   │  │ (60-300s)│  │  (~5s)   │  │ (10-60s) │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                     ↑                                        │
│                     │                                        │
│              BOTTLENECK: Large PDFs                          │
│              with tables can exceed                          │
│              150s in Docling alone                           │
└─────────────────────────────────────────────────────────────┘
```

---
