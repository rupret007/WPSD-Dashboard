"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  DigitalVoicePacket,
  DigitalVoiceMode,
  SystemStats,
  ServiceStatus,
  MMDVMHostConfig,
} from "./types";

const API_BASE = "/api";
const API_TIMEOUT_MS = 15000;

async function fetchApi<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.signal ? undefined : API_TIMEOUT_MS);
  try {
    const res = await fetch(API_BASE + path, {
      ...opts,
      signal: opts.signal ?? ctrl.signal,
      headers: opts.body
        ? { "Content-Type": "application/json", ...opts.headers }
        : opts.headers,
    });
    clearTimeout(t);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
    return data as T;
  } catch (e) {
    clearTimeout(t);
    if (e instanceof Error && e.name === "AbortError") throw new Error("Request timed out");
    throw e;
  }
}

// Live Traffic (poll every 2s for near real-time dashboard metrics)
export function useLiveTraffic(limit = 50) {
  return useQuery({
    queryKey: ["live-traffic", limit],
    queryFn: ({ signal }) =>
      fetchApi<DigitalVoicePacket[]>(`/live-traffic?limit=${limit}`, { signal }),
    refetchInterval: 2000,
    refetchOnWindowFocus: true,
  });
}

// System Stats (poll every 2s for live CPU temp etc.)
export function useSystemStats() {
  return useQuery({
    queryKey: ["system-stats"],
    queryFn: ({ signal }) => fetchApi<SystemStats>("/system", { signal }),
    refetchInterval: 2000,
    refetchOnWindowFocus: true,
  });
}

// Service Status
export function useServiceStatus() {
  return useQuery({
    queryKey: ["service-status"],
    queryFn: ({ signal }) => fetchApi<ServiceStatus>("/system/service", { signal }),
    refetchInterval: 10000,
  });
}

// MMDVM Config
export function useMMDVMConfig() {
  return useQuery({
    queryKey: ["mmdvm-config"],
    queryFn: ({ signal }) => fetchApi<MMDVMHostConfig>("/mmdvm-config", { signal }),
  });
}

export function useUpdateMMDVMConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: MMDVMHostConfig) =>
      fetchApi<{ ok: boolean }>("/mmdvm-config", {
        method: "PUT",
        body: JSON.stringify(config),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mmdvm-config"] }),
  });
}

// TGIF
export interface TGIFStatus {
  dmrId: string;
  connected: boolean;
  slot1: string | null;
  slot2: string | null;
  /** Set when user links via this dashboard; shown when hotspot can't report TGIF status */
  lastLinkedSlot1?: string | null;
  lastLinkedSlot2?: string | null;
}

export function useTGIFStatus() {
  return useQuery({
    queryKey: ["tgif-status"],
    queryFn: ({ signal }) => fetchApi<TGIFStatus>("/tgif/status", { signal }),
    refetchInterval: 15000,
  });
}

export function useTGIFLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tg, timeslot }: { tg: string; timeslot?: number }) =>
      fetchApi<{ ok: boolean; tg: string; slot: number }>("/tgif/link", {
        method: "POST",
        body: JSON.stringify({ tg, timeslot }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tgif-status"] }),
  });
}

export function useTGIFUnlink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (timeslot?: number) =>
      fetchApi<{ ok: boolean; slot: number }>("/tgif/unlink", {
        method: "POST",
        body: JSON.stringify({ timeslot }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tgif-status"] }),
  });
}

// WPSD Config
export function useConfig() {
  return useQuery({
    queryKey: ["config"],
    queryFn: ({ signal }) =>
      fetchApi<{ wpsdHost: string; reachable: boolean }>("/config", { signal }),
  });
}

export function useUpdateConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (wpsdHost: string) =>
      fetchApi<{ ok: boolean; wpsdHost: string }>("/config", {
        method: "PUT",
        body: JSON.stringify({ wpsdHost }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["config"] }),
  });
}

// WPSD Last Heard (fallback when log parsing has no data)
export interface WPSDLastHeardRow {
  time_utc?: string;
  mode?: string;
  callsign?: string;
  target?: string;
  src?: number | string;
  duration?: number | string;
  name?: string;
  [key: string]: unknown;
}

const MODES: DigitalVoiceMode[] = ["DMR", "D-Star", "YSF", "P25", "NXDN"];
function toMode(s: string | undefined): DigitalVoiceMode {
  if (!s) return "DMR";
  const u = s.toUpperCase().replace(/\s/g, "-");
  return (MODES.includes(u as DigitalVoiceMode) ? u : "DMR") as DigitalVoiceMode;
}

export function normalizeWPSDLastHeard(rows: WPSDLastHeardRow[]): DigitalVoicePacket[] {
  return rows.map((r) => ({
    timestamp: r.time_utc ?? "",
    mode: toMode(r.mode),
    callsign: r.callsign ?? "",
    src: typeof r.src === "number" ? r.src : r.src != null ? parseInt(String(r.src), 10) : undefined,
    target: r.target ?? "",
    duration: typeof r.duration === "number" ? r.duration : r.duration != null ? parseInt(String(r.duration), 10) : undefined,
    name: r.name,
    origin: "Network" as const,
  }));
}

export function useWPSDLastHeard(limit = 50) {
  return useQuery({
    queryKey: ["wpsd-last-heard", limit],
    queryFn: async ({ signal }) => {
      const rows = await fetchApi<WPSDLastHeardRow[]>(
        `/wpsd/last-heard?limit=${limit}`,
        { signal }
      );
      return normalizeWPSDLastHeard(rows);
    },
    refetchInterval: 2000,
    refetchOnWindowFocus: true,
  });
}

// WPSD Actions
export function useWPSDAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (action: string) =>
      fetchApi<unknown>("/wpsd/action", {
        method: "POST",
        body: JSON.stringify({ action }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["config"] });
      qc.invalidateQueries({ queryKey: ["live-traffic"] });
    },
  });
}
