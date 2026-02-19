"use client";

import React from "react";
import {
  useTGIFStatus,
  useTGIFLink,
  useTGIFUnlink,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { StatusMessage } from "@/components/StatusMessage";
import { cn } from "@/lib/utils";

const TGIF_PRESETS = [
  { tg: "777", label: "777 Parrot" },
  { tg: "91", label: "91 NA" },
  { tg: "3100", label: "3100" },
  { tg: "3160", label: "3160" },
  { tg: "98003", label: "98003" },
] as const;

interface TGIFPanelProps {
  /** When true, use primary accent and subtitle for main-page emphasis */
  accent?: boolean;
}

export function TGIFPanel({ accent }: TGIFPanelProps) {
  const { data: status, isLoading: statusLoading, isError: statusError, refetch: refetchStatus } = useTGIFStatus();
  const linkMutation = useTGIFLink();
  const unlinkMutation = useTGIFUnlink();
  const [tgInput, setTgInput] = React.useState("");
  const [ts, setTs] = React.useState<1 | 2>(2);
  const [msg, setMsg] = React.useState<{ text: string; ok: boolean } | null>(null);

  React.useEffect(() => {
    if (!msg?.ok) return;
    const t = setTimeout(() => setMsg(null), 4000);
    return () => clearTimeout(t);
  }, [msg?.ok, msg?.text]);

  const handleLinkPreset = (tg: string, label?: string) => {
    setMsg(null);
    linkMutation.mutate(
      { tg, timeslot: ts },
      {
        onSuccess: () => setMsg({ text: `Linked TG ${tg} on TS${ts}`, ok: true }),
        onError: (e) => setMsg({ text: (e as Error).message, ok: false }),
      }
    );
  };

  const handleLinkCustom = () => {
    const v = tgInput.trim();
    if (!v) {
      setMsg({ text: "Enter a TG number", ok: false });
      return;
    }
    setMsg(null);
    linkMutation.mutate(
      { tg: v, timeslot: ts },
      {
        onSuccess: () => setMsg({ text: `Linked TG ${v} on TS${ts}`, ok: true }),
        onError: (e) => setMsg({ text: (e as Error).message, ok: false }),
      }
    );
  };

  const handleUnlink = () => {
    setMsg(null);
    unlinkMutation.mutate(ts, {
      onSuccess: () => setMsg({ text: `Unlinked TS${ts}`, ok: true }),
      onError: (e) => setMsg({ text: (e as Error).message, ok: false }),
    });
  };

  const slot1 =
    status?.slot1 != null
      ? `TS1: TG${status.slot1}`
      : status?.lastLinkedSlot1
        ? `TS1: TG${status.lastLinkedSlot1} (last linked)`
        : "TS1: None";
  const slot2 =
    status?.slot2 != null
      ? `TS2: TG${status.slot2}`
      : status?.lastLinkedSlot2
        ? `TS2: TG${status.lastLinkedSlot2} (last linked)`
        : "TS2: None";
  const showHelper =
    !status?.slot1 &&
    !status?.slot2 &&
    !status?.lastLinkedSlot1 &&
    !status?.lastLinkedSlot2;

  return (
    <Card className={cn(accent && "border-l-4 border-l-primary")}>
      <CardHeader>
        <CardTitle>Link / Unlink Talkgroups</CardTitle>
        {accent && (
          <p className="text-sm text-muted-foreground mt-0.5">
            Change TS1/TS2 talkgroups (TGIF)
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 font-mono text-sm items-center">
          {statusLoading ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Spinner size="sm" />
              Loading…
            </span>
          ) : statusError ? (
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">
                Could not reach hotspot for status. Link/unlink may still work.
              </span>
              <Button variant="outline" onClick={() => refetchStatus()}>
                Retry
              </Button>
            </span>
          ) : (
            <>
              <span>{slot1}</span>
              <span>{slot2}</span>
              {showHelper && (
                <span className="text-muted-foreground text-xs ml-2">
                  Slot status from hotspot. Link or unlink to see last linked here if status is unavailable.
                </span>
              )}
            </>
          )}
        </div>
        <div className="inline-flex rounded-md bg-muted p-1 gap-1">
          <button
            type="button"
            onClick={() => setTs(1)}
            className={`px-4 py-2 rounded text-sm font-medium min-h-[44px] ${
              ts === 1 ? "bg-primary text-primary-foreground" : ""
            }`}
          >
            TS1
          </button>
          <button
            type="button"
            onClick={() => setTs(2)}
            className={`px-4 py-2 rounded text-sm font-medium min-h-[44px] ${
              ts === 2 ? "bg-primary text-primary-foreground" : ""
            }`}
          >
            TS2
          </button>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {TGIF_PRESETS.map(({ tg, label }) => (
            <Button
              key={tg}
              variant={tg === "777" ? "success" : "outline"}
              onClick={() => handleLinkPreset(tg, label)}
              disabled={linkMutation.isPending}
            >
              {label ?? tg}
            </Button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleLinkCustom} disabled={linkMutation.isPending}>
            Link
          </Button>
          <Input
            value={tgInput}
            onChange={(e) => setTgInput(e.target.value)}
            placeholder="TG"
            className="w-20"
            maxLength={6}
            inputMode="numeric"
          />
          <Button
            variant="outline"
            onClick={handleUnlink}
            disabled={unlinkMutation.isPending}
          >
            Unlink
          </Button>
        </div>
        <StatusMessage text={msg?.text} ok={msg?.ok ?? false} />
      </CardContent>
    </Card>
  );
}
