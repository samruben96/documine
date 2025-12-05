# Acceptance Criteria

1. **AC-3.5.1:** Usage section shows: Documents uploaded (this month/all time)
   - Displays document count for current calendar month
   - Displays total document count for all time
   - Uses clear labels distinguishing time periods

2. **AC-3.5.2:** Usage section shows: Queries asked (this month/all time)
   - Counts chat_messages with role='user' for the agency
   - Shows monthly count and all-time count
   - Clear numeric display

3. **AC-3.5.3:** Usage section shows: Active users (last 7 days)
   - Counts users who have activity in the last 7 days
   - Activity defined as: uploaded document or asked a query
   - Displays as "X active users" or "X of Y users active"

4. **AC-3.5.4:** Usage section shows: Storage used (MB/GB)
   - Calculates total storage from documents table metadata or Supabase Storage API
   - Displays in appropriate unit (MB for < 1GB, GB otherwise)
   - Shows formatted value (e.g., "125 MB" or "1.5 GB")

5. **AC-3.5.5:** Metrics refresh on page load
   - Data fetched fresh when navigating to settings page
   - No stale cache displayed
   - Loading state shown during fetch

6. **AC-3.5.6:** Non-admin users do not see agency-wide metrics
   - Usage tab/section not visible to non-admin users
   - Or displays "Admin access required" message
