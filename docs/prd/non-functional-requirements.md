# Non-Functional Requirements

## Performance

- **NFR1:** Document upload completes within 30 seconds for files up to 50MB
- **NFR2:** Document processing/indexing completes within 2 minutes for typical policy documents (up to 100 pages)
- **NFR3:** Q&A responses return within 10 seconds for 90% of queries
- **NFR4:** Quote comparison extraction completes within 60 seconds per document
- **NFR5:** UI remains responsive during background processing

## Security

- **NFR6:** All data encrypted in transit (TLS 1.2+)
- **NFR7:** All data encrypted at rest
- **NFR8:** User passwords hashed using industry-standard algorithms (bcrypt or equivalent)
- **NFR9:** Session tokens expire after period of inactivity
- **NFR10:** Strict tenant isolation - no cross-agency data access possible
- **NFR11:** Document storage access controlled and auditable
- **NFR12:** Regular security updates and vulnerability patching

## Accuracy

- **NFR13:** Document extraction accuracy of 95%+ for standard insurance document formats
- **NFR14:** Q&A accuracy of 95%+ for factual questions with answers present in document
- **NFR15:** System correctly identifies "not found" for questions without answers in document (minimize false positives)
- **NFR16:** Confidence scoring accurately reflects actual confidence levels

## Scalability

- **NFR17:** System supports concurrent users per agency without degradation
- **NFR18:** Document storage scales with customer growth
- **NFR19:** Processing capacity can be increased to handle demand spikes

## Reliability

- **NFR20:** 99.5% uptime during business hours (M-F 8am-8pm across US time zones)
- **NFR21:** Graceful degradation during partial outages
- **NFR22:** No data loss for uploaded documents

---
