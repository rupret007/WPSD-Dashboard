"use client";

import React from "react";
import { useTGIFStatus, useTGIFLink, useTGIFUnlink } from "@/lib/api";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatusMessage } from "@/components/StatusMessage";

const QUICK_PRESETS = [
  { tg: "777", label: "Link 777 Parrot" },
  { tg: "91", label: "91 NA" },
  { tg: "3100", label: "3100" },
] as const;

export default function QuickPage() {
  const { data: status, isLoading: statusLoading } = useTGIFStatus();
  const linkMutation = useTGIFLink();
  const unlinkMutation = useTGIFUnlink();
  const [ts, setTs] = React.useState<1 | 2>(2);
  const [msg, setMsg] = React.useState<{ text: string; ok: boolean } | null>(null);

  React.useEffect(() => {
    if (!msg?.ok) return;
    const t = setTimeout(() => setMsg(null), 4000);
    return () => clearTimeout(t);
  }, [msg?.ok, msg?.text]);

  const handleLink = (tg: string) => {
    setMsg(null);
    linkMutation.mutate(
      { tg, timeslot: ts },
      {
        onSuccess: () => setMsg({ text: `Linked TG ${tg} on TS${ts}`, ok: true }),
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
        ? `TS1: TG${status.lastLinkedSlot1}`
        : "TS1: —";
  const slot2 =
    status?.slot2 != null
      ? `TS2: TG${status.slot2}`
      : status?.lastLinkedSlot2
        ? `TS2: TG${status.lastLinkedSlot2}`
        : "TS2: —";

  const pending = linkMutation.isPending || unlinkMutation.isPending;

  return (
    <div className="min-h-screen flex flex-col p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground">Quick TG</h1>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Dashboard
        </Link>
      </div>

      {statusLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-4">
          <Spinner />
          <span>Loading…</span>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground font-mono mb-4">
          {slot1} · {slot2}
        </p>
      )}

      <div className="flex rounded-lg bg-muted p-1.5 gap-1.5 mb-6 w-full max-w-[280px]">
        <button
          type="button"
          onClick={() => setTs(1)}
          className={`flex-1 py-3 rounded-md text-base font-medium min-h-[48px] transition-colors ${
            ts === 1 ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground"
          }`}
        >
          TS1
        </button>
        <button
          type="button"
          onClick={() => setTs(2)}
          className={`flex-1 py-3 rounded-md text-base font-medium min-h-[48px] transition-colors ${
            ts === 2 ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground"
          }`}
        >
          TS2
        </button>
      </div>

      <div className="space-y-3 flex-1">
        <Button
          type="button"
          variant="success"
          onClick={() => handleLink("777")}
          disabled={pending}
          className="w-full min-h-[56px] text-lg rounded-xl"
        >
          Link 777 Parrot
        </Button>

        {QUICK_PRESETS.filter((p) => p.tg !== "777").map(({ tg, label }) => (
          <Button
            key={tg}
            type="button"
            variant="outline"
            onClick={() => handleLink(tg)}
            disabled={pending}
            className="w-full min-h-[48px] rounded-xl"
          >
            {label}
          </Button>
        ))}

        <Button
          type="button"
          variant="destructive"
          onClick={handleUnlink}
          disabled={pending}
          className="w-full min-h-[48px] rounded-xl bg-transparent hover:bg-destructive/10"
        >
          Unlink TS{ts}
        </Button>
      </div>

      <div className="mt-4 text-center text-sm font-medium">
        <StatusMessage text={msg?.text} ok={msg?.ok ?? false} />
      </div>
    </div>
  );
}
