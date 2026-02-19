"use client";

import React from "react";
import { useConfig, useUpdateConfig } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function SettingsPanel() {
  const { data, refetch } = useConfig();
  const mutation = useUpdateConfig();
  const [host, setHost] = React.useState("");
  const [msg, setMsg] = React.useState<{ text: string; ok: boolean } | null>(null);

  React.useEffect(() => {
    setHost(data?.wpsdHost ?? "");
  }, [data?.wpsdHost]);

  const handleUpdate = () => {
    const v = host.trim();
    if (!v) {
      setMsg({ text: "Enter a URL (e.g. http://192.168.5.82)", ok: false });
      return;
    }
    setMsg(null);
    mutation.mutate(v, {
      onSuccess: () => setMsg({ text: "Saved", ok: true }),
      onError: (e) => setMsg({ text: (e as Error).message, ok: false }),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Update the hotspot IP when switching networks (e.g., mobile hotspot).
        </p>
        <div className="flex gap-2 flex-wrap">
          <Input
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="http://192.168.5.82"
            className="max-w-[280px]"
          />
          <Button onClick={handleUpdate} disabled={mutation.isPending}>
            Update
          </Button>
          <Button variant="outline" onClick={() => refetch()}>
            Test
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={data?.reachable ? "success" : "destructive"}>
            {data?.reachable ? "WPSD reachable" : "WPSD not reachable"}
          </Badge>
          {msg && (
            <span className={msg.ok ? "text-emerald-500" : "text-destructive"}>
              {msg.text}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
