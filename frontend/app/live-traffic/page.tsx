"use client";

import { Suspense, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { TrafficTable, type ModeFilter, type OriginFilter } from "@/components/live-traffic/TrafficTable";
import { cn } from "@/lib/utils";

const MODES: { value: ModeFilter; label: string }[] = [
  { value: "All", label: "All" },
  { value: "DMR", label: "DMR" },
  { value: "D-Star", label: "D-Star" },
  { value: "YSF", label: "YSF" },
  { value: "P25", label: "P25" },
  { value: "NXDN", label: "NXDN" },
];

const ORIGINS: { value: OriginFilter; label: string }[] = [
  { value: "All", label: "All" },
  { value: "RF", label: "RF" },
  { value: "Network", label: "Network" },
];

function LiveTrafficContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode") ?? "All";
  const originParam = searchParams.get("origin") ?? "All";
  const mode: ModeFilter = MODES.some((m) => m.value === modeParam) ? (modeParam as ModeFilter) : "All";
  const origin: OriginFilter = ORIGINS.some((o) => o.value === originParam) ? (originParam as OriginFilter) : "All";

  const setMode = useCallback(
    (value: ModeFilter) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value === "All") next.delete("mode");
      else next.set("mode", value);
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
    },
    [pathname, router, searchParams]
  );
  const setOrigin = useCallback(
    (value: OriginFilter) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value === "All") next.delete("origin");
      else next.set("origin", value);
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
    },
    [pathname, router, searchParams]
  );

  return (
    <>
      <p className="text-sm text-muted-foreground mb-2">
        Scroll horizontally for more columns on small screens.
      </p>

      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <span className="text-sm font-medium text-muted-foreground">Mode:</span>
        <div className="inline-flex rounded-md bg-muted p-1 gap-1 flex-wrap">
          {MODES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={cn(
                "px-3 py-1.5 rounded text-sm font-medium",
                mode === value ? "bg-primary text-primary-foreground" : "hover:bg-muted-foreground/20"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-sm font-medium text-muted-foreground ml-2">Origin:</span>
        <div className="inline-flex rounded-md bg-muted p-1 gap-1">
          {ORIGINS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setOrigin(value)}
              className={cn(
                "px-3 py-1.5 rounded text-sm font-medium",
                origin === value ? "bg-primary text-primary-foreground" : "hover:bg-muted-foreground/20"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <TrafficTable limit={100} modeFilter={mode} originFilter={origin} />
    </>
  );
}

export default function LiveTrafficPage() {
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <AppHeader
        title="Live Traffic"
        subtitle="Parsed MMDVMHost log entries"
      />
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <LiveTrafficContent />
      </Suspense>
    </div>
  );
}
