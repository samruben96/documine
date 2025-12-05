# System Architecture Alignment

## Architecture References

| Component | Document Section | Notes |
|-----------|------------------|-------|
| PDF Generation | ADR-007 | @react-pdf/renderer pattern proven in Story 7.6 |
| Data Extraction | ADR-007 | GPT-5.1 structured outputs feed one-pager |
| Multi-Tenancy | Data Architecture | agency_id on all branding data |
| File Storage | Storage Policies | Logo storage in `branding/` bucket |
| UI Architecture | UI/UX Architecture | Split-view pattern for preview |

## Integration with Existing Systems

```
┌─────────────────────────────────────────────────────────────┐
│  Epic 7 Infrastructure (Quote Comparison)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ extraction  │  │ diff.ts     │  │ pdf-export.tsx      │ │
│  │ .ts         │  │ (table data)│  │ (pattern to follow) │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────┘ │
│         │                │                     │           │
└─────────┼────────────────┼─────────────────────┼───────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Epic 9: One-Pager Generation                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ useOnePager │  │ template.tsx│  │ generator.ts        │ │
│  │ Data.ts     │  │ (PDF doc)   │  │ (service)           │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│         ▲                                                   │
│         │                                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ useAgencyBranding.ts (NEW)                              ││
│  │ - Fetches branding from agencies table                  ││
│  │ - Provides logo URL, colors, contact info               ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---
