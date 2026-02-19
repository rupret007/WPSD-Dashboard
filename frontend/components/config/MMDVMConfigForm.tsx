"use client";

import React from "react";
import { useMMDVMConfig, useUpdateMMDVMConfig } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { StatusMessage } from "@/components/StatusMessage";
import type { MMDVMHostConfig } from "@/lib/types";

const CALLSIGN_REGEX = /^[A-Z0-9]{1,2}[0-9][A-Z]{1,4}$/i;
const FREQ_REGEX = /^\d+(\.\d+)?$/;

function validateCallsign(callsign: string): boolean {
  return CALLSIGN_REGEX.test(callsign.trim());
}

function validateFrequency(freq: string | number): boolean {
  if (typeof freq === "number") return freq >= 0;
  return FREQ_REGEX.test(String(freq).trim());
}

export function MMDVMConfigForm() {
  const { data: config, isLoading, error, refetch } = useMMDVMConfig();
  const mutation = useUpdateMMDVMConfig();
  const [localCallsign, setLocalCallsign] = React.useState("");
  const [localFreq, setLocalFreq] = React.useState("");
  const [msg, setMsg] = React.useState<{ text: string; ok: boolean } | null>(null);

  React.useEffect(() => {
    if (config?.general) {
      setLocalCallsign(String(config.general.callsign ?? ""));
      setLocalFreq(String(config.general.frequency ?? ""));
    }
  }, [config]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!validateCallsign(localCallsign)) {
      setMsg({ text: "Invalid callsign format", ok: false });
      return;
    }
    if (localFreq && !validateFrequency(localFreq)) {
      setMsg({ text: "Invalid frequency format", ok: false });
      return;
    }
    const freq = localFreq ? parseFloat(localFreq) : undefined;
    const updated: MMDVMHostConfig = {
      ...config,
      general: {
        ...(config?.general ?? {}),
        callsign: localCallsign.trim().toUpperCase(),
        ...(freq !== undefined && { frequency: freq }),
      },
    };
    mutation.mutate(updated, {
      onSuccess: () => setMsg({ text: "Saved", ok: true }),
      onError: (err) => setMsg({ text: (err as Error).message, ok: false }),
    });
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          <p className="text-destructive">
            Failed to load config: {(error as Error).message}
          </p>
          <p className="text-sm text-muted-foreground">
            MMDVM ini path may not exist or be readable on this system.
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading && !config) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center gap-2 text-muted-foreground">
          <Spinner />
          <span>Loading config…</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>MMDVM Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <label className="text-sm font-medium">Callsign</label>
            <Input
              value={localCallsign}
              onChange={(e) => setLocalCallsign(e.target.value)}
              placeholder="K6JM"
              maxLength={10}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Frequency (kHz)</label>
            <Input
              type="text"
              inputMode="numeric"
              value={localFreq}
              onChange={(e) => setLocalFreq(e.target.value)}
              placeholder="145000000"
            />
          </div>
          <StatusMessage text={msg?.text} ok={msg?.ok ?? false} />
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Apply Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
