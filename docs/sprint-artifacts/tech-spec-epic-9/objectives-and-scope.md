# Objectives and Scope

## Objectives

1. **Client-Ready Output** - Generate professional PDFs agents can send directly to clients
2. **Agency Branding** - Consistent branding across all generated outputs
3. **Zero Manual Formatting** - Data flows automatically from extraction to PDF
4. **Trust Transparency** - Source attribution for extracted data in one-pagers
5. **Navigation Hub** - Dashboard providing clear access to all docuMINE tools

## In Scope

| Feature | Description | Story |
|---------|-------------|-------|
| Agency Branding | Admin-configurable logo, colors, contact info | 9.1 |
| Dashboard Page | `/dashboard` with tool cards and agency welcome | 9.2 |
| One-Pager Page | `/one-pager` with 3 entry points and live preview | 9.3 |
| PDF Template | @react-pdf/renderer document with branding | 9.4 |
| Entry Point Buttons | Quick access from compare, docs, history | 9.5 |
| Testing & Polish | Unit, component, E2E coverage | 9.6 |

## Out of Scope

- CRM integration for auto-populating client data (Future Epic)
- Multiple template variants (premium, summary, detailed)
- Email direct-send from app
- Digital signature integration
- Custom branding per comparison (always uses agency branding)
- Mobile-first design (desktop/tablet priority)

---
