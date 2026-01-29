"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MonitorStatusBadge } from "@/components/monitor-status-badge";
import { Sparkline } from "@/components/sparkline";
import {
  Activity,
  ArrowUpRight,
  Clock,
  Plus,
  Search,
  AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type { MonitorResponse } from "@apimon/shared";

// Mock data
const mockMonitors: (MonitorResponse & {
  status: "up" | "down" | "paused";
  recentResponseTimes: number[];
})[] = [
  {
    id: "1",
    userId: "u1",
    name: "Production API",
    url: "https://api.example.com/health",
    method: "GET",
    headers: null,
    body: null,
    expectedStatus: 200,
    checkIntervalSeconds: 60,
    timeoutMs: 30000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    uptimePercentage: 99.98,
    status: "up",
    recentResponseTimes: [
      120, 135, 142, 128, 115, 140, 132, 125, 138, 145, 130, 122, 118, 142,
      135, 128, 140, 132,
    ],
    lastCheck: {
      id: "c1",
      monitorId: "1",
      statusCode: 200,
      responseTimeMs: 142,
      isUp: true,
      errorMessage: null,
      responseBody: null,
      region: "us-east-1",
      checkedAt: new Date(),
    },
  },
  {
    id: "2",
    userId: "u1",
    name: "Webhook Service",
    url: "https://webhook.example.com/ping",
    method: "GET",
    headers: null,
    body: null,
    expectedStatus: 200,
    checkIntervalSeconds: 300,
    timeoutMs: 30000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    uptimePercentage: 99.95,
    status: "up",
    recentResponseTimes: [
      89, 92, 95, 88, 91, 87, 93, 90, 94, 86, 91, 88, 93, 90, 87, 92, 89,
      91,
    ],
    lastCheck: {
      id: "c2",
      monitorId: "2",
      statusCode: 200,
      responseTimeMs: 89,
      isUp: true,
      errorMessage: null,
      responseBody: null,
      region: "us-east-1",
      checkedAt: new Date(),
    },
  },
  {
    id: "3",
    userId: "u1",
    name: "Auth Service",
    url: "https://auth.example.com/status",
    method: "GET",
    headers: null,
    body: null,
    expectedStatus: 200,
    checkIntervalSeconds: 60,
    timeoutMs: 30000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    uptimePercentage: 98.5,
    incidentCount: 2,
    status: "down",
    recentResponseTimes: [
      250, 280, 350, 420, 0, 0, 0, 0, 380, 290, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    lastCheck: {
      id: "c3",
      monitorId: "3",
      statusCode: null,
      responseTimeMs: null,
      isUp: false,
      errorMessage: "Connection timeout",
      responseBody: null,
      region: "us-east-1",
      checkedAt: new Date(),
    },
  },
  {
    id: "4",
    userId: "u1",
    name: "CDN Origin",
    url: "https://cdn.example.com/health",
    method: "GET",
    headers: null,
    body: null,
    expectedStatus: 200,
    checkIntervalSeconds: 300,
    timeoutMs: 30000,
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    uptimePercentage: 100,
    status: "paused",
    recentResponseTimes: [45, 48, 42, 50, 47, 43, 49, 44, 46, 51],
    lastCheck: null,
  },
  {
    id: "5",
    userId: "u1",
    name: "Payment Gateway",
    url: "https://payments.example.com/v1/health",
    method: "POST",
    headers: { Authorization: "Bearer token" },
    body: '{"check": true}',
    expectedStatus: 200,
    checkIntervalSeconds: 30,
    timeoutMs: 10000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    uptimePercentage: 99.99,
    status: "up",
    recentResponseTimes: [
      200, 210, 195, 205, 198, 215, 202, 208, 195, 210, 205, 198, 202, 215,
      200, 208, 195, 210,
    ],
    lastCheck: {
      id: "c5",
      monitorId: "5",
      statusCode: 200,
      responseTimeMs: 200,
      isUp: true,
      errorMessage: null,
      responseBody: null,
      region: "us-east-1",
      checkedAt: new Date(),
    },
  },
];

const statsData = {
  totalMonitors: 5,
  monitorsUp: 3,
  monitorsDown: 1,
  avgResponseTimeMs: 134,
};

export default function DashboardPage() {
  const monitors = mockMonitors;
  const hasMonitors = monitors.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Monitors</h1>
          <p className="text-muted-foreground">
            Monitor your API endpoints in real-time.
          </p>
        </div>
        <Button asChild>
          <Link href="/monitors/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Monitor
          </Link>
        </Button>
      </div>

      {hasMonitors ? (
        <>
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Monitors
                    </p>
                    <p className="text-2xl font-bold">
                      {statsData.totalMonitors}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-muted-foreground/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Up</p>
                    <p className="text-2xl font-bold text-emerald-400">
                      {statsData.monitorsUp}
                    </p>
                  </div>
                  <ArrowUpRight className="h-8 w-8 text-emerald-400/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Down</p>
                    <p className="text-2xl font-bold text-red-400">
                      {statsData.monitorsDown}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-400/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Avg Response
                    </p>
                    <p className="text-2xl font-bold">
                      {statsData.avgResponseTimeMs}ms
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-muted-foreground/30" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search monitors..." className="pl-9" />
          </div>

          {/* Monitor list */}
          <div className="space-y-3">
            {monitors.map((monitor) => (
              <Link key={monitor.id} href={`/monitors/${monitor.id}`}>
                <Card className="hover:bg-accent/30 transition-colors cursor-pointer">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <MonitorStatusBadge status={monitor.status} />
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {monitor.name}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {monitor.method} {monitor.url}
                        </p>
                      </div>
                    </div>
                    <div className="hidden items-center gap-8 sm:flex">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {monitor.uptimePercentage !== undefined
                            ? `${monitor.uptimePercentage.toFixed(2)}%`
                            : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          uptime
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {monitor.lastCheck?.responseTimeMs
                            ? `${monitor.lastCheck.responseTimeMs}ms`
                            : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          response
                        </p>
                      </div>
                      <Sparkline
                        data={monitor.recentResponseTimes}
                        className="hidden lg:block"
                      />
                      {monitor.incidentCount ? (
                        <Badge
                          variant="outline"
                          className="border-red-500/20 text-red-400"
                        >
                          {monitor.incidentCount} incident
                          {monitor.incidentCount > 1 ? "s" : ""}
                        </Badge>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      ) : (
        /* Empty state */
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Activity className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No monitors yet</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              Add your first monitor to start tracking API uptime and
              response times.
            </p>
            <div className="flex flex-col items-center gap-3">
              <Button asChild>
                <Link href="/monitors/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add your first monitor
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                or use the CLI:{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  apimon add https://api.example.com
                </code>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
