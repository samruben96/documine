# Objectives and Scope

**In Scope:**
- Next.js 15 (App Router) project initialization with TypeScript strict mode
- Supabase integration: PostgreSQL database, pgvector extension, Storage, Auth
- Complete database schema with 7 core tables (agencies, users, documents, document_chunks, conversations, chat_messages, processing_jobs)
- Row Level Security policies for multi-tenant agency isolation
- Supabase client configuration for browser, server, and middleware contexts
- Storage bucket with agency-scoped policies
- Error handling framework with custom error classes and consistent API response format
- Structured logging utility
- Deployment pipeline to Vercel with preview deployments
- Security headers configuration

**Out of Scope:**
- User authentication UI (Epic 2)
- Document upload functionality (Epic 4)
- AI/LLM integration with OpenAI and LlamaParse (Epic 4, 5)
- Chat interface and Q&A features (Epic 5)
- Quote comparison features (Epic 6)
- Agency management UI (Epic 3)
- Email integration with Resend (Epic 2)
