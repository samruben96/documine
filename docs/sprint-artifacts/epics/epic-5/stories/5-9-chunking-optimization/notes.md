# Notes

- Table summary generation adds ~$0.001 per table (GPT-4o-mini)
- Re-processing all documents may take hours depending on count
- Consider processing new documents first, backfill later
- Large tables may impact context window - monitor token usage
- **NEW:** Chunking must complete in <20s to avoid timeout issues (Story 5.8.1)

---
