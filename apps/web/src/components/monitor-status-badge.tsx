import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type MonitorStatus = "up" | "down" | "paused" | "degraded";

interface MonitorStatusBadgeProps {
  status: MonitorStatus;
  className?: string;
}

const statusConfig: Record<
  MonitorStatus,
  { label: string; className: string; dotClassName: string }
> = {
  up: {
    label: "Operational",
    className:
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20",
    dotClassName: "bg-emerald-400",
  },
  down: {
    label: "Down",
    className:
      "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20",
    dotClassName: "bg-red-400",
  },
  paused: {
    label: "Paused",
    className:
      "bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/20",
    dotClassName: "bg-slate-400",
  },
  degraded: {
    label: "Degraded",
    className:
      "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20",
    dotClassName: "bg-amber-400",
  },
};

export function MonitorStatusBadge({
  status,
  className,
}: MonitorStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-medium", config.className, className)}
    >
      <span
        className={cn("h-2 w-2 rounded-full", config.dotClassName)}
      />
      {config.label}
    </Badge>
  );
}
