/**
 * Audit Log Table Component
 * Story 14.5: Component Scaffolding
 *
 * Displays audit log entries in a table format.
 * Stub implementation - full functionality in Epic 20.
 */

import { cn } from '@/lib/utils';

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface AuditLogTableProps {
  entries: AuditLogEntry[];
  onEntryClick?: (entry: AuditLogEntry) => void;
  className?: string;
}

export function AuditLogTable({
  entries,
  onEntryClick,
  className,
}: AuditLogTableProps) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--chat-border)]">
            <th className="text-left py-3 px-4 text-[var(--text-muted)] font-medium">
              User
            </th>
            <th className="text-left py-3 px-4 text-[var(--text-muted)] font-medium">
              Action
            </th>
            <th className="text-left py-3 px-4 text-[var(--text-muted)] font-medium">
              Timestamp
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.id}
              onClick={() => onEntryClick?.(entry)}
              className={cn(
                'border-b border-[var(--chat-border)]',
                onEntryClick && 'cursor-pointer hover:bg-[var(--sidebar-hover)]'
              )}
            >
              <td className="py-3 px-4 text-[var(--text-primary)]">
                {entry.userName || entry.userId}
              </td>
              <td className="py-3 px-4 text-[var(--text-primary)]">
                {entry.action}
              </td>
              <td className="py-3 px-4 text-[var(--text-muted)]">
                {entry.timestamp.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
