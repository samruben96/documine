import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        // Status variants (DR.7)
        "status-default":
          "border-transparent bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
        "status-progress":
          "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        "status-success":
          "border-transparent bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        "status-info":
          "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        "status-special":
          "border-transparent bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        "status-error":
          "border-transparent bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

/**
 * StatusType - Union type for status badge variants
 * Story DR.7: Badge & Status Indicator System
 */
type StatusType = 'draft' | 'progress' | 'success' | 'info' | 'special' | 'error';

/**
 * Maps StatusType to badge variant names
 */
const statusToVariant: Record<StatusType, VariantProps<typeof badgeVariants>['variant']> = {
  draft: 'status-default',
  progress: 'status-progress',
  success: 'status-success',
  info: 'status-info',
  special: 'status-special',
  error: 'status-error',
};

/**
 * StatusBadge - Convenience component for status indicators
 * Story DR.7: Badge & Status Indicator System
 *
 * @example
 * ```tsx
 * <StatusBadge status="success">Complete</StatusBadge>
 * <StatusBadge status="progress">Processing</StatusBadge>
 * <StatusBadge status="error">Failed</StatusBadge>
 * ```
 */
function StatusBadge({
  status,
  className,
  children,
  ...props
}: {
  status: StatusType;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentProps<"span">, 'children'>) {
  return (
    <Badge
      variant={statusToVariant[status]}
      className={className}
      data-status={status}
      {...props}
    >
      {children}
    </Badge>
  );
}

export { Badge, badgeVariants, StatusBadge, type StatusType }
