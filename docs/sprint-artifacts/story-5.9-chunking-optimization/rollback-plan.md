# Rollback Plan

If chunking changes cause issues:

1. **Feature Flag**: Switch back to old chunks via flag
2. **Preserve Old Chunks**: Don't delete until cutover confirmed
3. **Revert Code**: Can revert chunking.ts changes independently
4. **Migration Safe**: New columns are additive, won't break existing

---
