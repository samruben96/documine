import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Textarea Component
 * DR.6.1: border border-slate-200 rounded-lg
 * DR.6.2: px-3 py-2 text-sm
 * DR.6.3: focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Base styles (DR.6.1, DR.6.2)
        "border border-slate-200 rounded-lg",
        "flex field-sizing-content min-h-16 w-full bg-transparent px-3 py-2 text-sm shadow-xs outline-none",
        // Placeholder
        "placeholder:text-muted-foreground",
        // Focus state (DR.6.3)
        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Invalid state
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        // Dark mode
        "dark:bg-input/30 dark:border-slate-700 dark:focus:border-primary",
        // Transition
        "transition-colors duration-200 ease-in-out",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
