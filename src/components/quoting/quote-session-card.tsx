'use client';

import { useRouter } from 'next/navigation';
import { MoreVertical, Edit, Copy, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from './status-badge';
import { QuoteTypeBadge } from './quote-type-badge';
import type { QuoteSession } from '@/types/quoting';

/**
 * Quote Session Card Component
 * Story Q2.1: Quote Sessions List Page
 *
 * AC-Q2.1-2: Card shows prospect name, quote type badge, status indicator, created date, carrier count
 * AC-Q2.1-3: Action menu with Edit, Duplicate, Delete options
 * AC-Q2.1-5: Click navigates to /quoting/[id]
 */

interface QuoteSessionCardProps {
  session: QuoteSession;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

export function QuoteSessionCard({
  session,
  onDelete,
  onDuplicate,
}: QuoteSessionCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/quoting/${session.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/quoting/${session.id}`);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate?.(session.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(session.id);
  };

  return (
    <Card
      hoverable
      onClick={handleCardClick}
      className="relative"
      data-testid="quote-session-card"
      data-session-id={session.id}
    >
      <CardContent className="p-4">
        {/* Header: Prospect Name + Action Menu */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 truncate">
            {session.prospectName}
          </h3>

          {/* Action Menu (⋮) - AC-Q2.1-3 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={(e) => e.stopPropagation()}
                data-testid="session-action-menu"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Session actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Badges Row: Quote Type + Status */}
        <div className="flex items-center gap-2 mb-3">
          <QuoteTypeBadge type={session.quoteType} />
          <StatusBadge status={session.status} />
        </div>

        {/* Footer: Date + Carrier Count */}
        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <span>Created {format(new Date(session.createdAt), 'MMM d, yyyy')}</span>
          <span>
            {session.carrierCount ?? 0} {session.carrierCount === 1 ? 'carrier' : 'carriers'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
