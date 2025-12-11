# Known Issues & Bug Fixes Index

This directory contains documented bug fixes organized by domain.

## Categories

| File | Domain | Issues |
|------|--------|--------|
| [document-processing.md](document-processing.md) | Document Processing | LlamaParse→Docling migration, PDF page-dimensions errors |
| [chat-ai.md](chat-ai.md) | Chat & AI | Chat integration, streaming, personality, confidence scores |
| [supabase-rls.md](supabase-rls.md) | Supabase & RLS | 406 errors, permission recursion, admin checks, audit logging |
| [ui-fixes.md](ui-fixes.md) | UI/UX | Settings page whitespace, layout issues |
| [reporting.md](reporting.md) | Reporting | Chart data population |

## Quick Reference

### Most Common Patterns

**Supabase RLS Issues:**
- Use `.maybeSingle()` instead of `.single()` when row may not exist
- Use `createServiceClient()` for permission checks in API routes
- Avoid RLS policies that query the same table they protect

**Next.js Client/Server Boundary:**
- Functions in `'use client'` files cannot be called from server code
- Extract shared utilities to non-client modules

**AI Response Handling:**
- Don't override LLM behavior with forced responses
- Let system prompt guide natural conversation
