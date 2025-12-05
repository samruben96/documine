# Domain-Specific Requirements (InsureTech)

The insurance domain imposes specific requirements that shape every aspect of docuMINE:

**Accuracy & Liability**
- 95%+ accuracy threshold required for production use - below this, agents won't trust output for client work
- E&O (Errors & Omissions) liability implications: incorrect coverage information could expose agents to legal risk
- Must clearly indicate confidence levels and limitations - never present uncertain information as definitive
- Source citations mandatory on all extracted information

**Document Complexity**
- Handle varied carrier formats: each of 15+ carriers uses different document structures
- Understand ISO standard forms vs. proprietary carrier forms
- Parse endorsements, riders, and policy modifications correctly
- Extract from declarations pages, full policies, quote documents, certificates

**Insurance Terminology**
- Recognize insurance-specific language: limits, deductibles, exclusions, endorsements, riders, named insureds
- Understand coverage types: liability, property, auto, umbrella, professional liability, etc.
- Handle carrier-specific terminology variations

**Trust Requirements**
- Every answer must be verifiable against source document
- Clear "I don't know" responses when information isn't found (no hallucination)
- Audit trail of what was analyzed and when

---
