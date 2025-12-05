# Acceptance Criteria

## AC-7.6.1: Export Dropdown
**Given** I am viewing a completed comparison
**When** I click the Export button
**Then** a dropdown menu appears with options:
- "Export as PDF"
- "Export as CSV"

**And** the dropdown is styled consistently with other UI elements

## AC-7.6.2: PDF Content
**Given** I click "Export as PDF"
**When** the PDF is generated
**Then** the PDF includes:
- docuMINE header/branding
- Export date
- Carrier names (document names)
- Full comparison table with all rows
- Gaps and conflicts summary section

## AC-7.6.3: PDF Visual Formatting
**Given** the PDF is generated
**When** I view the PDF
**Then** visual indicators are preserved:
- Best value indicators (green dot or checkmark)
- Worst value indicators (red dot or X)
- Gap rows with warning styling
- "Not found" cells clearly marked
- Professional, print-ready formatting

## AC-7.6.4: CSV Content
**Given** I click "Export as CSV"
**When** the CSV is generated
**Then** the file contains:
- Header row: Field, [Carrier1], [Carrier2], [Carrier3], [Carrier4]
- Data rows for all comparison fields
- Values as plain text (no formatting)
- Proper escaping for commas and quotes in values

## AC-7.6.5: Automatic Download
**Given** I click an export option
**When** export generation completes
**Then** the file downloads automatically
**And** filename format is:
- PDF: `docuMINE-comparison-YYYY-MM-DD.pdf`
- CSV: `docuMINE-comparison-YYYY-MM-DD.csv`

## AC-7.6.6: Loading State
**Given** I click an export option
**When** export is being generated
**Then** the Export button shows a loading spinner
**And** the button is disabled during generation
**And** for PDF: "Generating PDF..." appears
**And** for CSV: loading is near-instant (no noticeable delay)

---
