# System Architecture Alignment

This epic aligns with the architecture's security-first design principles:

1. **Multi-tenant Isolation:** RLS policy optimizations maintain strict agency_id isolation while improving query performance. Every policy continues to enforce `agency_id = (SELECT get_user_agency_id())` pattern.

2. **Defense in Depth:** Function search_path hardening prevents potential SQL injection vectors. Leaked password protection adds another authentication security layer.

3. **Performance @ Scale:** Current RLS policies re-evaluate `auth.uid()` for every row in result sets. With 10+ documents per agency and 100+ chunks per document, this creates O(n) function call overhead. The `(SELECT auth.uid())` pattern reduces this to O(1).

4. **Cost Control:** Rate limiting protects against runaway AI costs (GPT-5.1 for extraction, OpenAI embeddings for chat). PRD section 3.1.4 explicitly requires usage tracking - rate limiting is the enforcement mechanism.

---
