import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Input Component
 * AC-6.8.14: Enhanced input focus states
 * - Border color change to Electric Blue on focus
 * - Subtle glow effect (ring-2 ring-primary/20)
 * - Smooth transition animation
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "transition-all duration-200 ease-in-out",
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
