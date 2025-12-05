# Dependencies and Integrations

## Existing Dependencies (No Changes)

| Package | Version | Purpose |
|---------|---------|---------|
| @react-pdf/renderer | 4.3.1 | PDF generation |
| file-saver | 2.0.5 | Download trigger |
| react-dropzone | 14.3.8 | Logo upload |
| lucide-react | 0.554.0 | Icons |

## New Dependencies

None required - all functionality achievable with existing packages.

## Internal Module Dependencies

| From | To | Data Flow |
|------|----|-----------|
| `/one-pager` page | `useAgencyBranding` | Agency branding data |
| `/one-pager` page | `useOnePagerData` | Comparison/document data |
| `OnePagerForm` | `OnePagerPreview` | Form state for live preview |
| `OnePagerPreview` | `generateOnePager` | Data → PDF blob |
| `generateOnePager` | `OnePagerTemplate` | Render PDF document |

## External Integrations

| Service | Integration Point | Notes |
|---------|------------------|-------|
| Supabase Storage | Logo upload/retrieval | `branding/` bucket |
| Supabase Database | Branding data | `agencies` table columns |

---
