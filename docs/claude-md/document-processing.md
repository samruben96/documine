# Document Processing

Document processing uses **Docling** (self-hosted) instead of LlamaParse. See `docs/deployment/docling.md` for deployment details.

- **Docling Service Repo:** https://github.com/samruben96/docling-for-documine
- **Production URL:** https://docling-for-documine-production.up.railway.app
- **TypeScript client:** `src/lib/docling/client.ts`
- **Edge Function:** `supabase/functions/process-document/index.ts`

**Local development:**
```bash
# Clone docling repo as sibling directory
cd .. && git clone https://github.com/samruben96/docling-for-documine.git
cd documine && docker-compose up docling
# Set DOCLING_SERVICE_URL=http://localhost:8000 in .env.local
```
