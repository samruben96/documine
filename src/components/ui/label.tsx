"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "@/lib/utils"

/**
 * Label Component
 * DR.6.4: text-sm font-medium text-slate-700 mb-1
 * DR.6.5: Required field indicator with text-red-500 asterisk
 * Note: mb-1 should be applied via className when needed for spacing
 */
function Label({
  className,
  required,
  children,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root> & {
  required?: boolean
}) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        // Base styles (DR.6.4)
        "text-sm font-medium text-slate-700",
        "flex items-center gap-2 leading-none select-none",
        // Disabled state
        "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        // Dark mode
        "dark:text-slate-300",
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="text-red-500" aria-hidden="true">
          *
        </span>
      )}
    </LabelPrimitive.Root>
  )
}

/**
 * RequiredIndicator Component
 * DR.6.5: Standalone required field indicator for inline usage
 * Usage: <span>Field Name</span><RequiredIndicator />
 */
function RequiredIndicator() {
  return (
    <span className="text-red-500 ml-1" aria-hidden="true">
      *
    </span>
  )
}

export { Label, RequiredIndicator }
