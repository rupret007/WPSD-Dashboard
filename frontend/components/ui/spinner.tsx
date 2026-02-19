import * as React from "react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  /** Size: default (w-5 h-5) or sm (w-4 h-4) */
  size?: "default" | "sm";
}

export function Spinner({ className, size = "default" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary",
        size === "default" && "h-5 w-5",
        size === "sm" && "h-4 w-4",
        className
      )}
    />
  );
}
