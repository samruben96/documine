# Story 22.2: Admin Panel Skeletons

**Epic:** [Epic 22 - UI Polish Sprint](../epic.md)
**Points:** 3
**Priority:** P0

---

## User Story

**As an** admin user viewing Admin panels,
**I want to** see skeleton loading states while data loads,
**So that** I have consistent loading feedback across all admin views.

## Background

Admin sub-panels (Users, Usage Analytics, Audit Log) fetch data on mount. While data loads, users see either nothing or a spinner. Skeleton loaders provide better perceived performance.

## Acceptance Criteria

### AC-22.2.1: Shared Admin Skeleton
- [ ] Create `admin-panel-skeleton.tsx` with configurable options
- [ ] Support table skeleton (rows configurable, default 5)
- [ ] Support search header skeleton
- [ ] Reusable across all admin panels

### AC-22.2.2: User Management Panel
- [ ] UserManagementPanel shows skeleton while loading users
- [ ] Skeleton shows search bar + table structure
- [ ] Smooth transition to actual content

### AC-22.2.3: Usage Analytics Panel
- [ ] Already has some loading - verify skeleton pattern
- [ ] Fix any gaps in loading state coverage
- [ ] Ensure chart area has proper skeleton

### AC-22.2.4: Audit Log Panel
- [ ] AuditLogPanel shows skeleton while loading logs
- [ ] Skeleton shows filters + table structure
- [ ] Smooth transition to actual content

### AC-22.2.5: Tests
- [ ] Unit test for AdminPanelSkeleton component
- [ ] Integration tests for each panel's loading state

## Technical Notes

**Files to Create:**
- `src/components/admin/admin-panel-skeleton.tsx`

**Files to Modify:**
- `src/components/admin/user-management-panel.tsx`
- `src/components/admin/analytics/usage-analytics-panel.tsx`
- `src/components/admin/audit-log/audit-log-panel.tsx`

**Skeleton Component Design:**
```typescript
interface AdminPanelSkeletonProps {
  showSearch?: boolean;
  rows?: number;
  columns?: number;
}

export function AdminPanelSkeleton({
  showSearch = true,
  rows = 5,
  columns = 5
}: AdminPanelSkeletonProps) {
  return (
    <div className="space-y-4">
      {showSearch && (
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-64" /> {/* Search */}
          <Skeleton className="h-10 w-32" /> {/* Button */}
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            {[...Array(columns)].map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(rows)].map((_, i) => (
            <TableRow key={i}>
              {[...Array(columns)].map((_, j) => (
                <TableCell key={j}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

## Test Commands

```bash
npm run test:admin
```

## Definition of Done

- [ ] AdminPanelSkeleton component created
- [ ] All three admin panels use skeleton during loading
- [ ] Unit tests passing
- [ ] Visual verification in browser
- [ ] Code reviewed
