# Acceptance Criteria

1. **AC-3.3.1:** Team tab displays all agency users with: Name, Email, Role (Admin/Member), Joined date
   - Uses the existing Team tab component from Story 3.2
   - Displays in a table or list format with all user information
   - Sorted by joined date (most recent first) or alphabetically by name

2. **AC-3.3.2:** "Remove" button shows confirmation modal for each team member
   - Button only visible/enabled for admin users
   - Opens modal dialog on click
   - Uses shadcn/ui Dialog component

3. **AC-3.3.3:** Confirmation modal displays: "Remove {name} from {agency_name}? They will lose access to all agency documents."
   - Shows member's full name and agency name
   - Clear warning about data access loss
   - "Cancel" and "Remove" buttons

4. **AC-3.3.4:** Cannot remove yourself (button disabled or hidden for current user's row)
   - Self-removal prevented at UI level (disabled state)
   - Server-side validation as backup

5. **AC-3.3.5:** Cannot remove if it would leave no admins
   - Check admin count before allowing removal
   - Error toast: "Cannot remove the last admin. Promote another member to admin first."

6. **AC-3.3.6:** Role toggle (Admin ↔ Member) available for each team member
   - Dropdown or toggle UI element
   - Only visible/enabled for admin users
   - Shows current role as selected state

7. **AC-3.3.7:** Cannot change your own role (dropdown/toggle disabled for current user's row)
   - Prevents self-demotion that could lock out admin
   - Server-side validation as backup

8. **AC-3.3.8:** Non-admin users see Team tab in view-only mode
   - Team list is visible but all action buttons/toggles are hidden or disabled
   - No "Invite User" button for non-admins
   - Clear visual indication of view-only state (optional)
