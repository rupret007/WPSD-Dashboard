"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface StatusMessageProps {
  /** Message to show; when null/empty, nothing is rendered (but live region stays for announcements). */
  text: string | null | undefined;
  ok: boolean;
  className?: string;
}

/**
 * Inline success/error message with aria-live so screen readers announce changes.
 */
export function StatusMessage({ text, ok, className }: StatusMessageProps) {
  if (text == null || text === "") return null;
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        ok ? "text-emerald-500" : "text-destructive",
        className
      )}
    >
      {text}
    </div>
  );
}
