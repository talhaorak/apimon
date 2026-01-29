"use client";

import { cn } from "@/lib/utils";

export interface UptimeDay {
  date: string;
  uptimePercent: number;
  checksTotal: number;
  checksFailed: number;
}

interface UptimeBarProps {
  days: UptimeDay[];
  className?: string;
}

function getBarColor(percent: number): string {
  if (percent >= 99.5) return "bg-emerald-400";
  if (percent >= 95) return "bg-amber-400";
  if (percent > 0) return "bg-red-400";
  return "bg-slate-600";
}

export function UptimeBar({ days, className }: UptimeBarProps) {
  return (
    <div className={cn("flex items-center gap-[2px]", className)}>
      {days.map((day) => (
        <div key={day.date} className="group relative flex-1">
          <div
            className={cn(
              "h-8 rounded-[2px] transition-opacity group-hover:opacity-80",
              getBarColor(day.uptimePercent)
            )}
          />
          <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-md bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            <p className="font-medium">{day.date}</p>
            <p className="text-muted-foreground">
              {day.uptimePercent.toFixed(2)}% uptime
            </p>
            {day.checksFailed > 0 && (
              <p className="text-red-400">
                {day.checksFailed} failed / {day.checksTotal} checks
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
