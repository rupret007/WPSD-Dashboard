"use client";

import type { SystemStats } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SystemWidgetsProps {
  stats?: SystemStats | null;
}

function formatUptime(seconds?: number): string {
  if (seconds == null || seconds < 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 24) {
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h`;
  }
  return `${h}h ${m}m`;
}

export function SystemWidgets({ stats }: SystemWidgetsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              CPU Load
            </p>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min(100, stats?.cpuLoad ?? 0)}%` }}
              />
            </div>
            <p className="text-sm font-mono">{stats?.cpuLoad ?? "—"}%</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              CPU Temp
            </p>
            <p className="text-lg font-mono font-semibold">
              {stats?.cpuTemp != null ? `${stats.cpuTemp}°C` : "—"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Disk Used
            </p>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-amber-500/80 transition-all"
                style={{ width: `${Math.min(100, stats?.diskUsedPercent ?? 0)}%` }}
              />
            </div>
            <p className="text-sm font-mono">{stats?.diskUsedPercent ?? "—"}%</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Memory
            </p>
            <p className="text-sm font-mono">
              {stats?.memoryUsedPercent != null
                ? `${stats.memoryUsedPercent}%`
                : "—"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Uptime
            </p>
            <p className="text-sm font-mono">
              {formatUptime(stats?.uptimeSeconds)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
