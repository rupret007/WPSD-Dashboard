"use client";

import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TERMS: { term: string; definition: string }[] = [
  { term: "BER", definition: "Bit Error Rate — percentage of received bits that were incorrect. Lower is better; high BER can mean weak or noisy signal." },
  { term: "Loss", definition: "Packet loss percentage. Indicates how much of the transmission was lost in transit." },
  { term: "TS", definition: "Time Slot. DMR uses two time slots (TS1 and TS2) so two conversations can share the same frequency." },
  { term: "Reflector", definition: "A server that links repeaters and hotspots so users on different systems can talk on the same talkgroup." },
  { term: "Talkgroup", definition: "A channel or group ID (e.g. TG 91, TG 3100). Linking a talkgroup on a time slot connects your hotspot to that channel." },
  { term: "Callsign", definition: "Your amateur radio license identifier, shown when you transmit." },
];

interface HelpPopoverProps {
  className?: string;
}

export function HelpPopover({ className }: HelpPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClickOutside = (e: MouseEvent) => {
      const el = panelRef.current;
      const btn = buttonRef.current;
      if (el?.contains(e.target as Node) || btn?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onEscape);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [open]);

  return (
    <div className={cn("relative", className)}>
      <Button
        ref={buttonRef}
        type="button"
        variant="outline"
        className="min-w-[44px]"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Glossary: BER, Loss, TS, etc."
      >
        ?
      </Button>
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Term definitions"
          className="absolute right-0 top-full z-50 mt-2 w-[min(90vw,340px)] rounded-lg border border-border bg-card p-4 shadow-lg"
        >
          <p className="text-sm font-semibold text-foreground mb-3">Term definitions</p>
          <dl className="space-y-3 text-sm">
            {TERMS.map(({ term, definition }) => (
              <div key={term}>
                <dt className="font-medium text-foreground">{term}</dt>
                <dd className="text-muted-foreground mt-0.5">{definition}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
            <a
              href="https://tgif.network"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              TGIF
            </a>
            {" · "}
            <a
              href="https://www.pistar.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Pi-Star
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
