# Epic Q2: Quote Session Management

**Status:** Contexted
**FRs Covered:** FR1-6, FR15
**Stories:** 5
**Depends On:** Epic Q1 (Foundation & Navigation)

---

## Overview

Epic Q2 delivers the core quote session management capabilities for the Quoting Helper feature. This epic enables insurance agents to create, view, and manage quote sessions for prospects, establishing the foundation for the "enter once, use everywhere" workflow.

Building on the database schema and navigation established in Epic Q1, this epic implements the session list page, create flow, detail page structure, status management, and session operations (delete/duplicate).

## Objectives

- Enable agents to create new quote sessions with prospect name and quote type
- Provide a list view of all sessions with status and filtering
- Build the detail page structure with tab navigation
- Implement session lifecycle management (create, view, delete, duplicate)

## Stories

| Story | Title | Description |
|-------|-------|-------------|
| Q2-1 | Quote Sessions List Page | Display all sessions with cards, status badges, action menus |
| Q2-2 | Create New Quote Session | Modal dialog for creating sessions with name and type |
| Q2-3 | Quote Session Detail Page | Tab-based structure for session editing |
| Q2-4 | Quote Session Status | Automatic status progression with visual indicators |
| Q2-5 | Delete and Duplicate | Action menu operations for session management |

## Acceptance Summary

- User can navigate to `/quoting` and see all their quote sessions
- User can create a new session with prospect name and quote type (Home/Auto/Bundle)
- User can view session details with appropriate tabs based on quote type
- Session status updates automatically based on data entered
- User can delete sessions with confirmation
- User can duplicate sessions to create copies

## Dependencies

- **Epic Q1:** Database schema, RLS policies, sidebar navigation must be complete

## Related Documents

- [Tech Spec](./tech-spec.md) - Detailed technical specification
- [PRD](../../../features/quoting/prd.md) - Product requirements
- [Architecture](../../../features/quoting/architecture.md) - System architecture
- [UX Design](../../../features/quoting/ux-design.md) - User experience specification
