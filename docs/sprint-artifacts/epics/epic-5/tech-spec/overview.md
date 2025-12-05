# Overview

Epic 5 delivers docuMINE's core value proposition: the ability for users to ask natural language questions about their insurance documents and receive AI-powered answers with source citations and confidence indicators. This is the defining feature that differentiates docuMINE from generic AI tools - every answer is verifiable, building the trust that insurance agents require for client-facing work.

Building on the document processing infrastructure from Epic 4, this epic implements the conversational AI interface using a split-view layout (document + chat side-by-side), streaming responses via Server-Sent Events for perceived speed, the Trust-Transparent AI Response pattern with source citations and confidence badges, and full conversation history persistence. The implementation uses OpenAI GPT-4o for response generation, pgvector for semantic search retrieval, and follows the UX specification's "Invisible Technology" design philosophy where agents can ask questions and get verified answers in seconds.

This epic addresses the critical user journey: an agent asks "Is flood covered?" and gets the answer in seconds with a direct link to the exact policy language - speed they can feel, accuracy they can verify.
