# UX Design Decisions (Party Mode 2025-12-02)

**Participants:** Sally (UX), Amelia (Dev), Winston (Architect), John (PM), Bob (SM), Murat (Test)

## Approved Visual Design

**Pattern:** Step indicator + progress bar (honest about stages, precise where possible)

**Desktop Layout:**
```
┌──────────────────────────────────────────────────┐
│   📄 insurance-policy.pdf                        │
│                                                  │
│   ✓────●────○────○                               │
│   ↓    ↓    ↓    ↓                               │
│  Load  Read  Prep  Index                         │
│                                                  │
│   Reading document...                            │
│   ████████░░░░░░░░░░  45%                        │
│                                                  │
│   ~2-4 min remaining                             │
└──────────────────────────────────────────────────┘
```

**Mobile Layout (Condensed):**
```
┌──────────────────────┐
│ 📄 insurance-pol...  │
│ ✓─●─○─○  Reading...  │
│ ████░░░░░░░ ~2-4 min │
└──────────────────────┘
```

**Stage Name Mapping:**
| Technical | User-Friendly | Display Text |
|-----------|---------------|--------------|
| downloading | Load | "Loading file..." |
| parsing | Read | "Reading document..." |
| chunking | Prep | "Preparing content..." |
| embedding | Index | "Indexing for search..." |

## Design System Colors (Trustworthy Slate)

| Element | Color | Hex |
|---------|-------|-----|
| Completed stage | emerald-500 | #10b981 |
| Active stage | slate-600 + shimmer | #475569 |
| Pending stage | slate-300 | #cbd5e1 |
| Progress bar fill | slate-600 | #475569 |
| Time estimate text | slate-400 | #94a3b8 |

## Key Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Visual pattern | Step indicator + progress bar | Honest about stages without false precision |
| Stage names | User-friendly (Load, Read, Prep, Index) | More approachable than technical jargon |
| Placement | Inline in document list | No modal interruption, natural flow |
| Time display | Ranges ("2-4 min") not exact | Manage expectations honestly |
| Hover behavior | Nothing extra (MVP) | Ship simple, iterate later |
| Slow processing | "Taking longer than usual - hang tight!" | Reassuring, not alarming |

## Progress Data Accuracy by Stage

| Stage | Progress Source | Accuracy |
|-------|-----------------|----------|
| Downloading | bytes downloaded / total | Precise |
| Parsing | Time-based estimation | Approximate (Docling no page callback) |
| Chunking | Fast, just show complete | N/A (5-15s) |
| Embedding | batches / total batches | Precise (20 chunks/batch) |

## Technical Implementation Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data storage | `progress_data` JSONB column | Flexible, easy to extend |
| Realtime subscription | New channel, client-side filter | Simple, low volume, no schema change |
| Component | New `ProcessingProgress` component | Clean separation from status badge |
| Integration point | `document-list-item.tsx` | Replace badge when processing |

## Accessibility Requirements

- `aria-label` with full context: "Document processing: stage 2 of 4, parsing document, 45 percent complete, approximately 2 to 4 minutes remaining"
- `aria-live="polite"` on stage changes
- Minimum 44x44px touch targets
- Color contrast ≥ 4.5:1 (WCAG AA)

## New Files to Create

```
src/components/documents/processing-progress.tsx  // New component
src/hooks/use-processing-progress.ts              // Realtime subscription
```

---
