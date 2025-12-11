import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Card Component Props
 * Story DR.4: Card & Border Consistency
 */
interface CardProps extends React.ComponentProps<"div"> {
  /**
   * When true, adds hover effects for clickable cards:
   * - hover:border-slate-300 (lighter border on hover)
   * - hover:shadow-sm (subtle shadow on hover)
   * - transition-all (smooth transition)
   * - cursor-pointer (pointer cursor)
   */
  hoverable?: boolean;
}

/**
 * Card Component
 * Story DR.4: Card & Border Consistency
 * - AC-DR.4.1: bg-white background
 * - AC-DR.4.2: border border-slate-200
 * - AC-DR.4.3: rounded-lg corners
 * - AC-DR.4.4: hoverable prop for clickable cards
 * - AC-DR.4.5: p-4 or p-6 padding (via CardContent)
 */
function Card({ className, hoverable, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(
        // Base styles (AC-DR.4.1, DR.4.2, DR.4.3)
        "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100",
        "border border-slate-200 dark:border-slate-700",
        "rounded-lg",
        // Hover effects for clickable cards (AC-DR.4.4)
        hoverable && [
          "hover:border-slate-300 dark:hover:border-slate-600",
          "hover:shadow-sm",
          "transition-all duration-200",
          "cursor-pointer",
        ],
        className
      )}
      {...props}
    />
  )
}

/**
 * CardHeader - Story DR.4
 * Consistent padding with p-6 (matches CardContent)
 */
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 p-6 pb-0 has-data-[slot=card-action]:grid-cols-[1fr_auto]",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

/**
 * CardContent - Story DR.4: AC-DR.4.5
 * Default padding is p-6, can be overridden via className
 */
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("p-6", className)}
      {...props}
    />
  )
}

/**
 * CardFooter - Story DR.4
 * Consistent padding with p-6 (matches CardContent)
 */
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
