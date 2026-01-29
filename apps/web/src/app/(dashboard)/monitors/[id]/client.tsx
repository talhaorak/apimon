"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MonitorStatusBadge } from "@/components/monitor-status-badge";
import { UptimeBar } from "@/components/uptime-bar";
import { ResponseTimeChart } from "@/components/response-time-chart";
import { generateMockUptimeDays, generateMockResponseTimeData } from "@/lib/mock-data";
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  Loader2,
  Pause,
  Play,
  Settings,
  Trash2,
} from "lucide-react";

// Mock data
const monitor = {
  id: "1",
  name: "Production API",
  url: "https://api.example.com/health",
  method: "GET" as const,
  expectedStatus: 200,
  checkIntervalSeconds: 60,
  timeoutMs: 30000,
  isActive: true,
  uptimePercentage: 99.98,
  status: "up" as const,
  lastCheckAt: new Date(Date.now() - 30000),
  upSince: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14), // 14 days
};

const responseTimeData = generateMockResponseTimeData(24);
const uptimeDays = generateMockUptimeDays(90);

const recentChecks = Array.from({ length: 20 }, (_, i) => {
  const checkedAt = new Date(Date.now() - i * 60000);
  const isUp = i !== 5 && i !== 6;
  return {
    id: `check-${i}`,
    statusCode: isUp ? 200 : null,
    responseTimeMs: isUp ? 100 + Math.floor(Math.random() * 100) : null,
    isUp,
    errorMessage: isUp ? null : "Connection timeout after 30000ms",
    region: "us-east-1",
    checkedAt,
  };
});

const incidents = [
  {
    id: "inc1",
    state: "resolved" as const,
    cause: "Connection timeout — upstream server unresponsive",
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 47),
    duration: "1h 0m",
  },
  {
    id: "inc2",
    state: "resolved" as const,
    cause: "HTTP 503 Service Unavailable",
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7 + 1000 * 60 * 15),
    duration: "15m",
  },
];

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

export default function MonitorDetailClient() {
  const [isPaused, setIsPaused] = useState(!monitor.isActive);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const upDuration = formatDuration(Date.now() - monitor.upSince.getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold tracking-tight">
                {monitor.name}
              </h1>
              <MonitorStatusBadge status={monitor.status} />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="font-mono text-xs">
                {monitor.method}
              </Badge>
              <a
                href={monitor.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors flex items-center gap-1"
              >
                {monitor.url}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-12 sm:ml-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? (
              <>
                <Play className="mr-1 h-3 w-3" />
                Resume
              </>
            ) : (
              <>
                <Pause className="mr-1 h-3 w-3" />
                Pause
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">
              Up for {upDuration}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Uptime (30d)</p>
            <p className="text-xl font-bold mt-1">
              {monitor.uptimePercentage}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Avg Response
            </p>
            <p className="text-xl font-bold mt-1">134ms</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Check Interval
            </p>
            <p className="text-xl font-bold mt-1 flex items-center gap-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {monitor.checkIntervalSeconds}s
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="checks">Recent Checks</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Response Time (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponseTimeChart data={responseTimeData} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Uptime (90 days)</CardTitle>
              <CardDescription>
                Daily uptime percentage for the last 90 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UptimeBar days={uptimeDays} />
              <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                <span>90 days ago</span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    &gt;99.5%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    95-99.5%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-red-400" />
                    &lt;95%
                  </span>
                </div>
                <span>Today</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Checks */}
        <TabsContent value="checks">
          <Card>
            <CardHeader>
              <CardTitle>Recent Checks</CardTitle>
              <CardDescription>
                Last 20 checks for this monitor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Status Code</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Checked At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentChecks.map((check) => (
                    <TableRow key={check.id}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            check.isUp
                              ? "border-emerald-500/20 text-emerald-400"
                              : "border-red-500/20 text-red-400"
                          }
                        >
                          {check.isUp ? "Up" : "Down"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {check.statusCode ?? "—"}
                      </TableCell>
                      <TableCell>
                        {check.responseTimeMs
                          ? `${check.responseTimeMs}ms`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {check.region}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {check.checkedAt.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incidents */}
        <TabsContent value="incidents">
          <Card>
            <CardHeader>
              <CardTitle>Incidents</CardTitle>
              <CardDescription>
                Downtime incidents for this monitor
              </CardDescription>
            </CardHeader>
            <CardContent>
              {incidents.length > 0 ? (
                <div className="space-y-4">
                  {incidents.map((incident) => (
                    <div
                      key={incident.id}
                      className="flex items-start gap-4 rounded-lg border p-4"
                    >
                      <Badge
                        variant="outline"
                        className={
                          incident.state === "resolved"
                            ? "border-emerald-500/20 text-emerald-400"
                            : "border-red-500/20 text-red-400"
                        }
                      >
                        {incident.state === "resolved"
                          ? "Resolved"
                          : "Ongoing"}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {incident.cause}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Started{" "}
                          {incident.startedAt.toLocaleString()} ·
                          Duration: {incident.duration}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No incidents recorded. 🎉
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monitor Settings</CardTitle>
              <CardDescription>
                Update monitor configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  defaultValue={monitor.name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-url">URL</Label>
                <Input
                  id="edit-url"
                  defaultValue={monitor.url}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expected Status</Label>
                  <Input
                    type="number"
                    defaultValue={monitor.expectedStatus}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Timeout (ms)</Label>
                  <Input
                    type="number"
                    defaultValue={monitor.timeoutMs}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Danger zone */}
          <Card className="border-red-500/20">
            <CardHeader>
              <CardTitle className="text-red-400">
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions for this monitor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Monitor
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete monitor?</DialogTitle>
                    <DialogDescription>
                      This will permanently delete &quot;{monitor.name}&quot;
                      and all associated checks and incidents. This
                      action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="ghost"
                      onClick={() => setDeleteOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        // TODO(@backend): Delete monitor
                        setDeleteOpen(false);
                      }}
                    >
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
