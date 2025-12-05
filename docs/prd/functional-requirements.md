# Functional Requirements

## User Account & Access

- **FR1:** Users can create accounts with email and password
- **FR2:** Users can log in securely and maintain sessions across browser sessions
- **FR3:** Users can reset passwords via email verification
- **FR4:** Users can update their profile information
- **FR5:** Agency admins can invite new users to their agency
- **FR6:** Agency admins can remove users from their agency
- **FR7:** Agency admins can manage subscription and billing

## Document Management

- **FR8:** Users can upload PDF documents (policies, quotes, certificates)
- **FR9:** Users can view a list of their uploaded documents
- **FR10:** Users can delete documents they've uploaded
- **FR11:** Users can organize documents (basic naming/labeling)
- **FR12:** System processes and indexes uploaded documents for querying

## Document Q&A

- **FR13:** Users can ask natural language questions about an uploaded document
- **FR14:** System returns answers extracted from the document
- **FR15:** Every answer includes source citation linking to exact document location
- **FR16:** Every answer includes confidence indicator (High Confidence / Needs Review / Not Found)
- **FR17:** Users can click source citations to view the relevant document section
- **FR18:** Users can ask follow-up questions in a conversational flow
- **FR19:** System clearly indicates when information is not found in the document

## Quote Comparison

- **FR20:** Users can select multiple documents (2-4) for side-by-side comparison
- **FR21:** System automatically extracts key quote data: coverage types, limits, deductibles, exclusions, premium
- **FR22:** System displays extracted data in aligned comparison view
- **FR23:** System highlights differences between quotes
- **FR24:** System identifies and flags coverage gaps or conflicts
- **FR25:** Users can view source citations for any extracted data point
- **FR26:** Users can export comparison results (PDF or structured format)

## Agency Management

- **FR27:** Agencies have isolated document storage and data
- **FR28:** Agency admins can view usage metrics for their agency
- **FR29:** Agency admins can manage agency settings and preferences
- **FR30:** System enforces seat limits based on subscription tier

## Platform & Infrastructure

- **FR31:** System accessible via modern web browsers (Chrome, Firefox, Safari, Edge)
- **FR32:** System provides responsive design for desktop and tablet use
- **FR33:** System maintains document processing queue during high load
- **FR34:** System provides clear error messages when operations fail

---
