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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ExternalLink,
  GripVertical,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";

// Mock data
const mockPage = {
  id: "sp1",
  slug: "acme-corp",
  title: "Acme Corp Status",
  description: "Current status of all Acme Corp services",
  isPublic: true,
  monitorIds: ["1", "2", "5"],
};

const allMonitors = [
  { id: "1", name: "Production API", url: "https://api.example.com/health" },
  {
    id: "2",
    name: "Webhook Service",
    url: "https://webhook.example.com/ping",
  },
  { id: "3", name: "Auth Service", url: "https://auth.example.com/status" },
  { id: "4", name: "CDN Origin", url: "https://cdn.example.com/health" },
  {
    id: "5",
    name: "Payment Gateway",
    url: "https://payments.example.com/v1/health",
  },
];

export default function StatusPageBuilderPage() {
  const [title, setTitle] = useState(mockPage.title);
  const [description, setDescription] = useState(
    mockPage.description ?? ""
  );
  const [slug, setSlug] = useState(mockPage.slug);
  const [isPublic, setIsPublic] = useState(mockPage.isPublic);
  const [selectedMonitors, setSelectedMonitors] = useState<string[]>(
    mockPage.monitorIds
  );
  const [isSaving, setIsSaving] = useState(false);

  function toggleMonitor(id: string) {
    setSelectedMonitors((prev) =>
      prev.includes(id)
        ? prev.filter((m) => m !== id)
        : [...prev, id]
    );
  }

  async function handleSave() {
    setIsSaving(true);
    // TODO(@backend): Call API to update status page
    await new Promise((r) => setTimeout(r, 1000));
    setIsSaving(false);
  }

  const selectedMonitorsList = selectedMonitors
    .map((id) => allMonitors.find((m) => m.id === id))
    .filter(Boolean);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/status-pages">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Edit Status Page
            </h1>
            <p className="text-muted-foreground">
              Configure your public status page
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <a
            href={`/status/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="mr-1 h-3 w-3" />
            Preview
          </a>
        </Button>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your services"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                /status/
              </span>
              <Input
                id="slug"
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "")
                  )
                }
                className="font-mono"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Your status page will be available at{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono">
                /status/{slug}
              </code>
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Visibility</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isPublic
                  ? "Anyone with the link can view"
                  : "Only accessible to authenticated users"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              onClick={() => setIsPublic(!isPublic)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                isPublic ? "bg-emerald-500" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                  isPublic ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Monitor selector */}
      <Card>
        <CardHeader>
          <CardTitle>Monitors</CardTitle>
          <CardDescription>
            Select which monitors to display on the status page. Drag to
            reorder.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Selected monitors */}
          {selectedMonitorsList.length > 0 && (
            <div className="space-y-2 mb-4">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Selected ({selectedMonitorsList.length})
              </Label>
              {selectedMonitorsList.map((monitor) => (
                <div
                  key={monitor!.id}
                  className="flex items-center gap-3 rounded-md border p-3"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {monitor!.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {monitor!.url}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleMonitor(monitor!.id)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Separator />

          {/* Available monitors */}
          <div className="space-y-2 pt-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Available monitors
            </Label>
            {allMonitors
              .filter((m) => !selectedMonitors.includes(m.id))
              .map((monitor) => (
                <div
                  key={monitor.id}
                  className="flex items-center justify-between rounded-md border border-dashed p-3 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => toggleMonitor(monitor.id)}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {monitor.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {monitor.url}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Add
                  </Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="ghost" asChild>
          <Link href="/status-pages">Cancel</Link>
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
