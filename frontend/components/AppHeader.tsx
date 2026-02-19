"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { HelpPopover } from "@/components/HelpPopover";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
}

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/quick", label: "Quick TG" },
  { href: "/live-traffic", label: "Live Traffic" },
  { href: "/config", label: "Config" },
] as const;

export function AppHeader({ title = "WPSD Dashboard", subtitle = "Link talkgroups, monitor hotspot" }: AppHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8">
      <div>
        <h1 className="text-2xl font-semibold text-primary tracking-tight">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {subtitle}
        </p>
      </div>
      <nav className="flex flex-wrap gap-2 items-center">
        {NAV_LINKS.map(({ href, label }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                buttonVariants({ variant: "outline" }),
                isActive && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground border-primary"
              )}
            >
              {label}
            </Link>
          );
        })}
        <HelpPopover />
      </nav>
    </header>
  );
}
