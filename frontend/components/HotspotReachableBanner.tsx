"use client";

import React from "react";
import Link from "next/link";
import { useConfig } from "@/lib/api";
import { cn } from "@/lib/utils";

export function HotspotReachableBanner({ children }: { children: React.ReactNode }) {
  const { data: config, isLoading } = useConfig();
  const unreachable = !isLoading && config && config.reachable === false;

  return (
    <>
      {unreachable && (
        <div
          role="alert"
          className={cn(
            "rounded-lg border border-amber-500/50 bg-amber-500/10 text-amber-200 px-4 py-3 mb-4",
            "flex flex-wrap items-center gap-2 justify-between"
          )}
        >
          <span className="text-sm font-medium">
            Hotspot not reachable. TGIF, Last Heard, and admin actions may fail.
          </span>
          <Link
            href="/config"
            className="text-sm underline hover:text-amber-100 font-medium"
          >
            Open Settings to check IP and network
          </Link>
        </div>
      )}
      {children}
    </>
  );
}
