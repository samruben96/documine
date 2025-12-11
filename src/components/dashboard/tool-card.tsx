'use client';

import Link from 'next/link';
import { MessageSquare, GitCompare, FileText, Bot, FolderOpen, Calculator, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { typography, spacing } from '@/lib/typography';

/**
 * Tool Card Component
 * Story 9.2: AC-9.2.3 - Tool cards with icon, title, description
 * Story DR.8: Typography and spacing standardization
 * AC-9.2.4: Navigates to correct pages
 * AC-9.2.6: Responsive layout with hover effects
 */

// Icon map to avoid passing functions from server to client
const iconMap: Record<string, LucideIcon> = {
  MessageSquare,
  GitCompare,
  FileText,
  Bot,
  FolderOpen,
  Calculator,
};

interface ToolCardProps {
  icon: string; // Icon name as string
  title: string;
  description: string;
  href: string;
  color?: 'blue' | 'green' | 'purple' | 'emerald' | 'slate' | 'amber';
}

const colorVariants = {
  blue: {
    icon: 'text-electric-blue',
    bg: 'bg-electric-blue/10',
    border: 'group-hover:border-electric-blue/30',
  },
  green: {
    icon: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'group-hover:border-emerald-300',
  },
  purple: {
    icon: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'group-hover:border-violet-300',
  },
  emerald: {
    icon: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'group-hover:border-emerald-300',
  },
  slate: {
    icon: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'group-hover:border-slate-300',
  },
  amber: {
    icon: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'group-hover:border-amber-300',
  },
};

export function ToolCard({
  icon,
  title,
  description,
  href,
  color = 'blue',
}: ToolCardProps) {
  const colors = colorVariants[color];
  const Icon = iconMap[icon] || MessageSquare;

  return (
    <Link href={href} className="group block">
      <Card
        hoverable
        className={cn(
          'h-full',
          colors.border
        )}
        data-testid="tool-card"
      >
        <CardContent className="flex flex-col items-start gap-4 pt-6">
          {/* Icon */}
          <div className={cn('rounded-lg p-3', colors.bg)}>
            <Icon className={cn('h-6 w-6', colors.icon)} />
          </div>

          {/* Content - DR.8.2: Section title, DR.8.4: Body text */}
          <div>
            <h2 className={cn(typography.sectionTitle, 'group-hover:text-electric-blue transition-colors')}>
              {title}
            </h2>
            <p className={cn(typography.muted, 'mt-1')}>
              {description}
            </p>
          </div>

          {/* Arrow indicator */}
          <div className="mt-auto pt-2">
            <span className="text-sm font-medium text-electric-blue opacity-0 group-hover:opacity-100 transition-opacity">
              Get started →
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
