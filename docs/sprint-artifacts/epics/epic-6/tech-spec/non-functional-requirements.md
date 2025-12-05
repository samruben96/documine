# Non-Functional Requirements

## Performance
- **No performance degradation**: All fixes maintain existing response times
- **Realtime indicator**: Connection state updates within 500ms of actual state change
- **Tooltip hover delay**: Standard 300ms delay for filename tooltips

## Security
- **RLS policy verification**: Story 6.1 must verify policy allows SELECT for user's own rows only
- **No cross-user data access**: Conversation loading must not expose other users' data
- **Audit logging**: Failed RLS attempts should be logged for security review

## Reliability
- **Graceful degradation**: If conversation loading fails, show empty state with retry option
- **Connection recovery**: Realtime indicator must show reconnection attempts
- **Error boundaries**: UI errors should not crash entire document page

## Observability
- **Score logging**: Story 6.2 must log vector similarity, reranker score, and final confidence for debugging
- **RLS error logging**: 406 errors should log policy name that rejected
- **Client-side error tracking**: Console errors captured for debugging

---
