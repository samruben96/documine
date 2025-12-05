# Context

This is the sixth and final story in Epic 7: Quote Comparison. It adds export functionality to the comparison feature, allowing users to download their comparison results in professional formats suitable for client presentations or record-keeping.

Building on the ComparisonTable from Stories 7.3-7.5, this story adds:

1. **Export Dropdown** - Button offering PDF and CSV export options
2. **PDF Export** - Professional formatted document with branding, full table, gap/conflict summary
3. **CSV Export** - Raw data export for spreadsheet analysis
4. **Loading States** - Progress indication during export generation
5. **Automatic Download** - Files download with timestamped filenames

The PDF export uses `@react-pdf/renderer` for consistent, printable output. CSV export is client-side for instant download.

---
