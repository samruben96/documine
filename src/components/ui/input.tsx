import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Input Component
 * DR.6.1: border border-slate-200 rounded-lg
 * DR.6.2: px-3 py-2 text-sm
 * DR.6.3: focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles (DR.6.1, DR.6.2)
        "border border-slate-200 rounded-lg",
        "h-9 w-full min-w-0 bg-transparent px-3 py-2 text-sm shadow-xs outline-none",
        // Placeholder, selection, file input
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        // Focus state (DR.6.3)
        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
        // Disabled state
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
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

export { Input }
