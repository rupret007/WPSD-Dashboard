"use client";

import type { DigitalVoicePacket } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatTime(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return ts;
  }
}

export function TrafficRow({ packet }: { packet: DigitalVoicePacket }) {
  return (
    <div className="grid grid-cols-[100px_80px_120px_100px_80px_60px_60px_80px] gap-2 px-4 py-2 hover:bg-muted/50 transition-colors border-b border-border items-center">
      <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
        {formatTime(packet.timestamp)}
      </span>
      <span
        className={cn(
          "inline-flex w-fit px-2 py-0.5 rounded text-xs font-medium",
          packet.mode === "DMR" && "bg-blue-500/20 text-blue-400",
          packet.mode === "D-Star" && "bg-amber-500/20 text-amber-400",
          packet.mode === "YSF" && "bg-emerald-500/20 text-emerald-400",
          packet.mode === "P25" && "bg-purple-500/20 text-purple-400",
          packet.mode === "NXDN" && "bg-cyan-500/20 text-cyan-400"
        )}
      >
        {packet.mode}
      </span>
      <span className="font-mono text-sm truncate">
        {(packet.callsign || packet.src?.toString()) ?? "—"}
      </span>
      <span className="font-mono text-sm text-muted-foreground truncate">
        {packet.target || "—"}
      </span>
      <span className="font-mono text-sm">
        {packet.duration != null ? `${packet.duration}s` : "—"}
      </span>
      <span className="font-mono text-sm">
        {packet.ber != null ? `${packet.ber}%` : "—"}
      </span>
      <span className="font-mono text-sm">
        {packet.loss != null ? `${packet.loss}%` : "—"}
      </span>
      <span
        className={cn(
          "text-xs",
          packet.origin === "RF" ? "text-emerald-400" : "text-blue-400"
        )}
      >
        {packet.origin}
      </span>
    </div>
  );
}
