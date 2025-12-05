# Executive Summary

docuMINE is an AI-powered document analysis platform for independent insurance agents, built on a Supabase-native stack (Next.js, TypeScript, Supabase, Tailwind CSS). The architecture prioritizes accuracy-first AI responses with mandatory source citations, multi-tenant agency isolation via Row Level Security, and a zero-learning-curve user experience.

The system follows a monolithic full-stack architecture deployed on Vercel, with Supabase providing PostgreSQL database, pgvector for semantic search, file storage for documents, and authentication - all unified under one platform. This simplifies multi-tenancy since RLS policies protect database rows, vector embeddings, AND file storage with the same agency_id logic.
