# Overview

Epic 3 delivers the complete agency and team management system for docuMINE. This epic enables agency admins to configure their organization settings, invite team members, manage user access, handle subscription billing, and view usage metrics. This is the B2B multi-user capability that differentiates docuMINE from single-user tools.

Building on the authentication foundation from Epic 2, this epic extends the multi-tenant architecture by implementing the admin-specific features that allow agencies to scale from a single user to a full team. The seat-based subscription model is enforced at the database level, and all team management operations respect the existing RLS policies for agency isolation.
