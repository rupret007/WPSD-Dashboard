"use client";

import type { ServiceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatusBarProps {
  status?: ServiceStatus | null;
}

export function StatusBar({ status }: StatusBarProps) {
  const mmdvm = status?.mmdvmHost ?? "unknown";
  const isOk = mmdvm === "running";
  const isErr = mmdvm === "stopped";
  const isLogDirMissing =
    status?.errorMessage?.toLowerCase().includes("log dir") ?? false;

  const message =
    mmdvm === "running"
      ? "Online"
      : mmdvm === "stopped"
        ? "Service Offline"
        : isLogDirMissing
          ? null
          : status?.errorMessage ?? "Unknown";

  if (message == null) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-4 py-2 text-sm",
        isOk && "bg-emerald-500/10 text-emerald-500",
        isErr && "bg-destructive/10 text-destructive",
        !isOk && !isErr && "bg-muted text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          isOk && "bg-emerald-500",
          isErr && "bg-destructive",
          !isOk && !isErr && "bg-muted-foreground"
        )}
      />
      <span className="font-medium">MMDVM Host: {message}</span>
      {status?.lastActivity && (
        <span className="text-xs opacity-80 ml-auto">
          Last activity: {new Date(status.lastActivity).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
