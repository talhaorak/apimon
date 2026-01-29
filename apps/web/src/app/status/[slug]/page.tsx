import { Activity, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UptimeBar } from "@/components/uptime-bar";
import { generateMockUptimeDays } from "@/lib/mock-data";

// Mock data for public status page
const statusPageData = {
  title: "Acme Corp Status",
  description: "Current status of all Acme Corp services",
  slug: "acme-corp",
  overallStatus: "operational" as "operational" | "partial" | "major",
  monitors: [
    {
      id: "1",
      name: "Production API",
      status: "up" as const,
      uptimePercentage: 99.98,
      uptimeDays: generateMockUptimeDays(90),
    },
    {
      id: "2",
      name: "Webhook Service",
      status: "up" as const,
      uptimePercentage: 99.95,
      uptimeDays: generateMockUptimeDays(90),
    },
    {
      id: "3",
      name: "Auth Service",
      status: "down" as const,
      uptimePercentage: 98.5,
      uptimeDays: generateMockUptimeDays(90),
    },
    {
      id: "5",
      name: "Payment Gateway",
      status: "up" as const,
      uptimePercentage: 99.99,
      uptimeDays: generateMockUptimeDays(90),
    },
  ],
  incidents: [
    {
      id: "inc1",
      title: "Auth Service Outage",
      status: "investigating" as const,
      date: new Date(),
      updates: [
        {
          status: "investigating",
          message:
            "We are investigating reports of authentication failures.",
          time: new Date(Date.now() - 1000 * 60 * 15),
        },
        {
          status: "identified",
          message:
            "The issue has been identified as a database connection pool exhaustion.",
          time: new Date(Date.now() - 1000 * 60 * 5),
        },
      ],
    },
    {
      id: "inc2",
      title: "API Latency Increase",
      status: "resolved" as const,
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      updates: [
        {
          status: "investigating",
          message:
            "We are seeing elevated response times on the Production API.",
          time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        },
        {
          status: "resolved",
          message:
            "Response times have returned to normal after scaling up the backend.",
          time: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 45
          ),
        },
      ],
    },
  ],
};

const overallStatusConfig = {
  operational: {
    label: "All Systems Operational",
    icon: CheckCircle2,
    className: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    iconClassName: "text-emerald-400",
  },
  partial: {
    label: "Partial System Outage",
    icon: AlertTriangle,
    className: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    iconClassName: "text-amber-400",
  },
  major: {
    label: "Major System Outage",
    icon: XCircle,
    className: "bg-red-500/10 border-red-500/30 text-red-400",
    iconClassName: "text-red-400",
  },
};

const monitorStatusDot: Record<string, string> = {
  up: "bg-emerald-400",
  down: "bg-red-400",
  degraded: "bg-amber-400",
  paused: "bg-slate-500",
};

const incidentStatusColors: Record<string, string> = {
  investigating: "bg-amber-400",
  identified: "bg-blue-400",
  monitoring: "bg-blue-400",
  resolved: "bg-emerald-400",
};

export function generateStaticParams() {
  return [{ slug: "acme-corp" }];
}

export default function PublicStatusPage() {
  const data = statusPageData;
  // Determine overall status based on monitors
  const hasDown = data.monitors.some((m) => m.status === "down");
  const overallStatus = hasDown ? "partial" : "operational";
  const statusConfig = overallStatusConfig[overallStatus];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="h-6 w-6 text-emerald-400" />
            <h1 className="text-2xl font-bold">{data.title}</h1>
          </div>
          {data.description && (
            <p className="text-muted-foreground">{data.description}</p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 space-y-8">
        {/* Overall status banner */}
        <div
          className={`flex items-center gap-3 rounded-lg border p-4 ${statusConfig.className}`}
        >
          <StatusIcon className={`h-6 w-6 ${statusConfig.iconClassName}`} />
          <span className="font-semibold text-lg">
            {statusConfig.label}
          </span>
        </div>

        {/* Monitors */}
        <div className="space-y-6">
          {data.monitors.map((monitor) => (
            <Card key={monitor.id} className="bg-card/50">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${monitorStatusDot[monitor.status]}`}
                    />
                    <span className="font-medium">{monitor.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {monitor.uptimePercentage.toFixed(2)}% uptime
                  </span>
                </div>
                <UptimeBar days={monitor.uptimeDays} />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>90 days ago</span>
                  <span>Today</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator />

        {/* Incident timeline */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Incidents</h2>
          {data.incidents.length > 0 ? (
            data.incidents.map((incident) => (
              <Card key={incident.id} className="bg-card/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {incident.title}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={
                        incident.status === "resolved"
                          ? "border-emerald-500/20 text-emerald-400"
                          : "border-amber-500/20 text-amber-400"
                      }
                    >
                      {incident.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {incident.updates.map((update, index) => (
                      <div
                        key={index}
                        className="flex gap-3"
                      >
                        <div className="flex flex-col items-center">
                          <div
                            className={`h-2.5 w-2.5 rounded-full mt-1.5 ${
                              incidentStatusColors[update.status] ??
                              "bg-slate-400"
                            }`}
                          />
                          {index < incident.updates.length - 1 && (
                            <div className="w-px flex-1 bg-border mt-1" />
                          )}
                        </div>
                        <div className="pb-4">
                          <p className="text-sm font-medium capitalize">
                            {update.status}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {update.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {update.time.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No incidents to report. 🎉
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-8 pb-4">
          <a
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
          >
            Powered by{" "}
            <Activity className="h-3 w-3 text-emerald-400" />
            <span className="font-medium">apimon</span>
          </a>
        </div>
      </main>
    </div>
  );
}
