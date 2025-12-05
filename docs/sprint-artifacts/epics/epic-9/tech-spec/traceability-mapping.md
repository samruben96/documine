# Traceability Mapping

| AC | Spec Section | Component(s) | Test Idea |
|----|--------------|--------------|-----------|
| AC-9.1.1 | APIs - Branding | BrandingForm, /settings/branding | Navigate as admin, verify form renders |
| AC-9.1.2 | Data Models - Branding | LogoUpload | Upload valid image, verify storage path |
| AC-9.1.3 | Data Models - AgencyBranding | ColorPicker | Select colors, verify hex values saved |
| AC-9.1.6 | Workflows | useAgencyBranding | Generate PDF, verify logo/colors applied |
| AC-9.2.1 | UI Architecture | WelcomeHeader | Render header, verify agency name displayed |
| AC-9.2.3 | Detailed Design | ToolCard | Click card, verify navigation |
| AC-9.3.2 | Workflows | useOnePagerData | Navigate with comparisonId, verify data loaded |
| AC-9.3.7 | Workflows | OnePagerPreview | Type in form, verify preview updates |
| AC-9.4.1 | Detailed Design | AgencyHeader (PDF) | Generate with/without logo, verify fallback |
| AC-9.4.7 | NFR Performance | OnePagerTemplate | Generate with typical data, verify single page |

---
