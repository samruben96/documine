# Epics Overview

**Last Updated:** 2025-12-10

This document provides the complete epic breakdown for docuMINE.

## Phase 1: MVP (Epics 1-13) - Completed

Core document intelligence platform for insurance agencies.

| Epic | Title | User Value |
|------|-------|------------|
| 1 | Foundation & Infrastructure | Project setup enabling all subsequent work |
| 2 | User Authentication & Onboarding | Users can sign up, log in, and access the platform |
| 3 | Agency & Team Management | Admins can manage their agency, invite users, handle billing |
| 4 | Document Upload & Management | Users can upload, view, organize, and delete documents |
| 5 | Document Q&A with Trust Transparency | Users can chat with documents and verify answers |
| 6 | Cleanup & Stabilization | Fix bugs, add E2E tests, ensure trust transparency works |
| 7 | Quote Comparison | Users can compare multiple quotes side-by-side |
| 8 | Tech Debt & Production Hardening | Security hardening, performance optimization |
| 9 | One-Pager Generation | Generate branded summary documents |
| 10 | Enhanced Quote Extraction | Improved data extraction accuracy |
| 11 | Processing Reliability | Async processing with progress tracking |
| 12 | Document AI Migration | (Abandoned - GCP costs) |
| 13 | LlamaParse Migration | Migrated to hosted parsing service |
| F2 | Document Library & Intelligence | Document categorization and AI tagging |

## Phase 2: AI Buddy (Epics 14-23) - Completed

Conversational AI assistant with project-based organization.

| Epic | Title | User Value |
|------|-------|------------|
| 14 | AI Buddy Foundation | Database schema, navigation, layout shell |
| 15 | AI Buddy Core Chat | Streaming chat with citations and confidence |
| 16 | AI Buddy Projects | Project-based conversation organization |
| 17 | Document Intelligence | Document upload and AI context |
| 18 | Personalization & Onboarding | Personalized AI experience |
| 19 | Guardrails & Compliance | Admin-controlled E&O protection |
| 20 | Admin Dashboard | User management and analytics |
| 21 | Admin Dashboard Phase 2 | Audit logs and advanced controls |
| 22 | UI Polish | Animation, transitions, accessibility |
| 23 | Custom Reporting | AI-powered analytics and visualization |

## Future Phases

See `sprint-status-future.yaml` for:
- F3: Document Viewer Enhancements
- F4: Email Infrastructure
- F5: Billing Infrastructure
- F7: Mobile Optimization
- F8: Multi-Agent Workflows

---

_For story-level detail, see the individual epic folders in `epics/` or [sprint-status.yaml](./sprint-status.yaml)._
