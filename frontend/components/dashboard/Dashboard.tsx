"use client";

import React from "react";
import { useLiveTraffic, useWPSDLastHeard, useTGIFLink } from "@/lib/api";
import type { DigitalVoicePacket } from "@/lib/types";
import { useSystemStats } from "@/lib/api";
import { useServiceStatus } from "@/lib/api";
import { StatusBar } from "./StatusBar";
import { SystemWidgets } from "./SystemWidgets";
import { TGIFPanel } from "@/components/config/TGIFPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function lastUpdatedLabel(ts: number): string {
  const sec = Math.round((Date.now() - ts) / 1000);
  if (sec < 5) return "Updated just now";
  if (sec < 60) return `Updated ${sec}s ago`;
  return `Updated ${Math.floor(sec / 60)}m ago`;
}

/** Extract DMR talkgroup id from a packet (TGIF is DMR). Returns null if not DMR or no TG. */
function getTalkgroupId(p: DigitalVoicePacket): number | null {
  if (p.mode !== "DMR") return null;
  if (p.targetId != null && p.targetId > 0) return p.targetId;
  const m = (p.target || "").match(/TG\s*(\d+)/i) || (p.target || "").match(/^(\d+)$/);
  return m ? parseInt(m[1], 10) : null;
}

/** From combined traffic + lastHeard, return top N most used DMR talkgroups (for TGIF). */
function mostUsedTalkgroups(
  traffic: DigitalVoicePacket[] | undefined,
  lastHeard: DigitalVoicePacket[],
  topN: number
): { tg: number; count: number }[] {
  const combined = [...(traffic ?? []), ...lastHeard];
  const counts = new Map<number, number>();
  for (const p of combined) {
    const tg = getTalkgroupId(p);
    if (tg != null) counts.set(tg, (counts.get(tg) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([tg, count]) => ({ tg, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

export function Dashboard() {
  const { data: traffic, isLoading: trafficLoading, dataUpdatedAt: trafficUpdated } = useLiveTraffic(10);
  const { data: lastHeard = [], dataUpdatedAt: lastHeardUpdated } = useWPSDLastHeard(10);
  const { data: stats, isLoading: statsLoading } = useSystemStats();
  const { data: status } = useServiceStatus();
  const linkMutation = useTGIFLink();
  const [joinTs, setJoinTs] = React.useState<1 | 2>(2);
  const [joinMsg, setJoinMsg] = React.useState<{ text: string; ok: boolean } | null>(null);

  React.useEffect(() => {
    if (!joinMsg?.ok) return;
    const t = setTimeout(() => setJoinMsg(null), 4000);
    return () => clearTimeout(t);
  }, [joinMsg?.ok, joinMsg?.text]);

  const fromLogs = (traffic?.length ?? 0) > 0;
  const fallback = !trafficLoading && !fromLogs && lastHeard.length > 0;
  const lastPacket = fromLogs ? traffic?.[0] : fallback ? lastHeard[0] : undefined;
  const mode = trafficLoading ? "…" : (lastPacket?.mode ?? "—");
  const lastCaller = trafficLoading ? "…" : ((lastPacket?.callsign || lastPacket?.src?.toString()) ?? "—");
  const ber = trafficLoading ? null : lastPacket?.ber ?? null;
  const statsPlaceholder = statsLoading ? "…" : null;
  const sourceLabel = fallback ? " (from hotspot)" : "";
  const dataTs = Math.max(trafficUpdated ?? 0, lastHeardUpdated ?? 0);
  const lastUpdated = dataTs > 0 ? lastUpdatedLabel(dataTs) : "";
  const topTGs = mostUsedTalkgroups(traffic ?? undefined, lastHeard, 10);

  const handleJoinTG = (tg: number) => {
    setJoinMsg(null);
    linkMutation.mutate(
      { tg: String(tg), timeslot: joinTs },
      {
        onSuccess: () => setJoinMsg({ text: `Linked TG${tg} on TS${joinTs}`, ok: true }),
        onError: (e) => setJoinMsg({ text: (e as Error).message, ok: false }),
      }
    );
  };

  return (
    <div className="space-y-4">
      <StatusBar status={status} />

      <TGIFPanel accent />

      {lastUpdated && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {lastUpdated} · Polling every 2s
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle>Current Mode{sourceLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-mono font-semibold">{mode}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle>Last Caller{sourceLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-mono font-semibold">{lastCaller}</p>
            {lastPacket?.target && (
              <p className="text-sm text-muted-foreground mt-1">
                → {lastPacket.target}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle>BER</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-mono font-semibold">
              {ber != null ? `${ber}%` : trafficLoading ? "…" : "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>CPU Temp</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-mono font-semibold">
              {stats?.cpuTemp != null ? `${stats.cpuTemp}°C` : (statsPlaceholder ? "…" : "—")}
            </p>
          </CardContent>
        </Card>
      </div>

      {topTGs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Most active talkgroups (TGIF)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              By recent traffic on your hotspot (TGIF has no public API for &quot;most people&quot;). Click a TG to join it.
            </p>
            <div className="flex flex-wrap gap-2 items-center mb-2">
              <span className="text-sm text-muted-foreground">Link to:</span>
              <div className="inline-flex rounded-md bg-muted p-0.5 gap-0.5">
                <button
                  type="button"
                  onClick={() => setJoinTs(1)}
                  className={cn(
                    "px-3 py-1 rounded text-sm font-medium",
                    joinTs === 1 ? "bg-primary text-primary-foreground" : ""
                  )}
                >
                  TS1
                </button>
                <button
                  type="button"
                  onClick={() => setJoinTs(2)}
                  className={cn(
                    "px-3 py-1 rounded text-sm font-medium",
                    joinTs === 2 ? "bg-primary text-primary-foreground" : ""
                  )}
                >
                  TS2
                </button>
              </div>
            </div>
            <ul className="flex flex-wrap gap-2 text-mono">
              {topTGs.map(({ tg, count }) => (
                <li key={tg}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleJoinTG(tg)}
                    disabled={linkMutation.isPending}
                    className="font-mono h-auto py-1.5"
                  >
                    <span className="font-medium">TG{tg}</span>
                    <span className="text-muted-foreground ml-1">({count})</span>
                  </Button>
                </li>
              ))}
            </ul>
            {joinMsg && (
              <p className={cn("text-sm mt-2", joinMsg.ok ? "text-emerald-500" : "text-destructive")}>
                {joinMsg.text}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <SystemWidgets stats={stats} />
    </div>
  );
}
