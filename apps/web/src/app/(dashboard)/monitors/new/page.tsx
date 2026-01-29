"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { HTTP_METHODS, CHECK_INTERVALS } from "@apimon/shared/constants";

const intervalOptions = [
  { label: "30 seconds", value: CHECK_INTERVALS.THIRTY_SECONDS },
  { label: "1 minute", value: CHECK_INTERVALS.ONE_MINUTE },
  { label: "5 minutes", value: CHECK_INTERVALS.FIVE_MINUTES },
  { label: "15 minutes", value: CHECK_INTERVALS.FIFTEEN_MINUTES },
  { label: "30 minutes", value: CHECK_INTERVALS.THIRTY_MINUTES },
  { label: "1 hour", value: CHECK_INTERVALS.ONE_HOUR },
];

// Mock alert channels
const mockChannels = [
  { id: "ch1", name: "Team Slack", type: "slack" },
  { id: "ch2", name: "Ops Telegram", type: "telegram" },
  { id: "ch3", name: "dev@example.com", type: "email" },
];

export default function NewMonitorPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [method, setMethod] = useState("GET");
  const [headers, setHeaders] = useState<{ key: string; value: string }[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  function addHeader() {
    setHeaders([...headers, { key: "", value: "" }]);
  }

  function removeHeader(index: number) {
    setHeaders(headers.filter((_, i) => i !== index));
  }

  function updateHeader(
    index: number,
    field: "key" | "value",
    value: string
  ) {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index]!, [field]: value };
    setHeaders(newHeaders);
  }

  function toggleChannel(id: string) {
    setSelectedChannels((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    // TODO(@backend): Call API to create monitor
    await new Promise((r) => setTimeout(r, 1000));
    setIsLoading(false);
    router.push("/dashboard");
  }

  const showBody = method === "POST" || method === "PUT" || method === "PATCH";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Add Monitor
          </h1>
          <p className="text-muted-foreground">
            Configure a new API endpoint to monitor.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Basic settings */}
        <Card>
          <CardHeader>
            <CardTitle>Endpoint</CardTitle>
            <CardDescription>
              The API endpoint you want to monitor.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Monitor name</Label>
              <Input
                id="name"
                placeholder="Production API"
                required
              />
            </div>
            <div className="flex gap-3">
              <div className="w-32">
                <Label>Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HTTP_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://api.example.com/health"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expectedStatus">
                  Expected status code
                </Label>
                <Input
                  id="expectedStatus"
                  type="number"
                  min={100}
                  max={599}
                  defaultValue={200}
                />
              </div>
              <div className="space-y-2">
                <Label>Check interval</Label>
                <Select defaultValue={String(CHECK_INTERVALS.FIVE_MINUTES)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {intervalOptions.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={String(opt.value)}
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Headers */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Headers</CardTitle>
                <CardDescription>
                  Custom HTTP headers sent with each check.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addHeader}
              >
                <Plus className="mr-1 h-3 w-3" />
                Add
              </Button>
            </div>
          </CardHeader>
          {headers.length > 0 && (
            <CardContent className="space-y-3">
              {headers.map((header, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder="Header name"
                    value={header.key}
                    onChange={(e) =>
                      updateHeader(index, "key", e.target.value)
                    }
                  />
                  <Input
                    placeholder="Value"
                    value={header.value}
                    onChange={(e) =>
                      updateHeader(index, "value", e.target.value)
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeHeader(index)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </CardContent>
          )}
        </Card>

        {/* Request body (conditional) */}
        {showBody && (
          <Card>
            <CardHeader>
              <CardTitle>Request Body</CardTitle>
              <CardDescription>
                JSON body sent with {method} requests.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="min-h-[120px] w-full rounded-md border bg-transparent px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder='{"key": "value"}'
              />
            </CardContent>
          </Card>
        )}

        {/* Alert channels */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Channels</CardTitle>
            <CardDescription>
              Select channels to receive alerts when this monitor goes down.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mockChannels.length > 0 ? (
              <div className="space-y-3">
                {mockChannels.map((channel) => (
                  <label
                    key={channel.id}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border"
                      checked={selectedChannels.includes(channel.id)}
                      onChange={() => toggleChannel(channel.id)}
                    />
                    <span className="text-sm font-medium">
                      {channel.name}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {channel.type}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No alert channels configured.{" "}
                <Link
                  href="/alerts"
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  Add one first
                </Link>
              </p>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" asChild>
            <Link href="/dashboard">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Monitor
          </Button>
        </div>
      </form>
    </div>
  );
}
