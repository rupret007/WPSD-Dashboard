"use client";

import React from "react";
import { useWPSDAction } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ACTION_SUCCESS_MESSAGES: Record<string, string> = {
  reboot: "Reboot initiated",
  shutdown: "Shutdown initiated",
  restart_wpsd_services: "Services restarting",
  stop_wpsd_services: "Services stopped",
  update_wpsd: "WPSD update started",
  update_hostfiles: "Hostfiles update started",
  reload_wifi: "Wi‑Fi reload started",
  get_ip: "IP retrieved",
};

function formatSuccessMessage(action: string, data: unknown): string {
  const mapped = ACTION_SUCCESS_MESSAGES[action];
  if (mapped) return mapped;
  if (data == null) return "Done";
  if (typeof data === "string") return data;
  if (typeof data === "object") {
    const str = JSON.stringify(data);
    return str.length > 80 ? str.slice(0, 77) + "…" : str;
  }
  return "Done";
}

export function AdminPanel() {
  const mutation = useWPSDAction();
  const [msg, setMsg] = React.useState<{ text: string; ok: boolean } | null>(null);
  const [confirm, setConfirm] = React.useState<{ action: string; title: string } | null>(null);
  const confirmCancelRef = React.useRef<HTMLButtonElement>(null);
  const previousActiveRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!confirm) return;
    previousActiveRef.current = document.activeElement as HTMLElement | null;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setConfirm(null);
        previousActiveRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [confirm]);

  React.useEffect(() => {
    if (confirm) {
      const t = setTimeout(() => confirmCancelRef.current?.focus(), 0);
      return () => clearTimeout(t);
    } else {
      previousActiveRef.current?.focus();
      previousActiveRef.current = null;
    }
  }, [confirm]);

  const runAction = (action: string, title: string, dangerous = false) => {
    if (dangerous) {
      setConfirm({ action, title });
      return;
    }
    setMsg(null);
    mutation.mutate(action, {
      onSuccess: (data) =>
        setMsg({ text: formatSuccessMessage(action, data), ok: true }),
      onError: (e) => setMsg({ text: (e as Error).message, ok: false }),
    });
  };

  const closeConfirm = () => {
    setConfirm(null);
    previousActiveRef.current?.focus();
    previousActiveRef.current = null;
  };

  const confirmAction = () => {
    if (!confirm) return;
    setMsg(null);
    mutation.mutate(confirm.action, {
      onSuccess: (data) =>
        setMsg({
          text: formatSuccessMessage(confirm.action, data),
          ok: true,
        }),
      onError: (e) => setMsg({ text: (e as Error).message, ok: false }),
    });
    closeConfirm();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Button onClick={() => runAction("restart_wpsd_services", "Restart Services")}>
            Restart Services
          </Button>
          <Button onClick={() => runAction("stop_wpsd_services", "Stop Services")}>
            Stop Services
          </Button>
          <Button onClick={() => runAction("update_wpsd", "WPSD Update")}>
            WPSD Update
          </Button>
          <Button onClick={() => runAction("update_hostfiles", "Update Hostfiles")}>
            Update Hostfiles
          </Button>
          <Button onClick={() => runAction("reload_wifi", "Reload Wi‑Fi")}>
            Reload Wi‑Fi
          </Button>
        </div>
        <div className="pt-4 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase">
            Danger Zone
          </p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() =>
                runAction("reboot", "Reboot the hotspot?", true)
              }
            >
              Reboot
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                runAction("shutdown", "Shutdown the hotspot?", true)
              }
            >
              Shutdown
            </Button>
          </div>
        </div>
        {msg && (
          <p className={msg.ok ? "text-emerald-500" : "text-destructive"}>
            {msg.text}
          </p>
        )}
        {confirm && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <div className="bg-card border border-border rounded-lg p-6 max-w-sm w-full text-center">
              <p id="confirm-title" className="mb-4">{confirm.title}</p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  ref={confirmCancelRef}
                  onClick={closeConfirm}
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmAction}>
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
