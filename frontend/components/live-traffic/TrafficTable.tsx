"use client";

import { useLiveTraffic, useWPSDLastHeard } from "@/lib/api";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useMemo } from "react";
import type { DigitalVoicePacket, DigitalVoiceMode } from "@/lib/types";
import { TrafficRow } from "./TrafficRow";
import { Button } from "@/components/ui/button";

const COLUMNS = ["timestamp", "mode", "callsign", "target", "duration", "ber", "loss", "origin"];

export type ModeFilter = "All" | DigitalVoiceMode;
export type OriginFilter = "All" | "RF" | "Network";

export function TrafficTable({
  limit = 100,
  modeFilter = "All",
  originFilter = "All",
}: {
  limit?: number;
  modeFilter?: ModeFilter;
  originFilter?: OriginFilter;
}) {
  const { data: traffic = [], isLoading: trafficLoading, error, refetch } = useLiveTraffic(limit);
  const { data: lastHeard = [] } = useWPSDLastHeard(limit);
  const fromLogs = traffic.length > 0;
  const rawPackets: DigitalVoicePacket[] = useMemo(
    () => (fromLogs ? traffic : lastHeard),
    [fromLogs, traffic, lastHeard]
  );
  const packets = useMemo(() => {
    return rawPackets.filter((p) => {
      if (modeFilter !== "All" && p.mode !== modeFilter) return false;
      if (originFilter !== "All" && p.origin !== originFilter) return false;
      return true;
    });
  }, [rawPackets, modeFilter, originFilter]);
  const sourceLabel = !trafficLoading && !fromLogs && lastHeard.length > 0 ? "From hotspot (last-heard)" : null;
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: packets.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 10,
  });

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive space-y-2">
        <p>Failed to load traffic: {(error as Error).message}</p>
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (trafficLoading && packets.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (rawPackets.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        No recent activity. MMDVM logs may not be available on this system.
      </div>
    );
  }

  if (packets.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        No entries match the current filter (Mode: {modeFilter}, Origin: {originFilter}).
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sourceLabel && (
        <p className="text-sm text-muted-foreground">{sourceLabel}</p>
      )}
      <Button variant="outline" onClick={() => refetch()} disabled={trafficLoading}>
        {trafficLoading ? "Refreshing…" : "Refresh"}
      </Button>
      <div
        ref={parentRef}
        className="h-[60vh] overflow-auto rounded-lg border border-border"
      >
      <div className="min-w-[800px]">
        <div className="sticky top-0 z-10 grid grid-cols-[100px_80px_120px_100px_80px_60px_60px_80px] gap-2 bg-muted/95 px-4 py-2 backdrop-blur">
          {COLUMNS.map((col) => (
            <span
              key={col}
              className="text-xs font-semibold uppercase text-muted-foreground tracking-wider"
            >
              {col.replace(/_/g, " ")}
            </span>
          ))}
        </div>
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virt) => (
            <div
              key={virt.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virt.start}px)`,
              }}
            >
              <TrafficRow packet={packets[virt.index]} />
            </div>
          ))}
        </div>
      </div>
    </div>
    </div>
  );
}
