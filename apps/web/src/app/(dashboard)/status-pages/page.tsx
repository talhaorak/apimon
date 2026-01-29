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
import { ExternalLink, Globe, Loader2, Plus } from "lucide-react";

const mockStatusPages = [
  {
    id: "sp1",
    slug: "acme-corp",
    title: "Acme Corp Status",
    description: "System status for Acme Corp services",
    isPublic: true,
    monitorCount: 4,
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "sp2",
    slug: "internal",
    title: "Internal Services",
    description: null,
    isPublic: false,
    monitorCount: 2,
    createdAt: new Date("2024-02-01"),
  },
];

export default function StatusPagesListPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsCreating(true);
    // TODO(@backend): Call API to create status page
    await new Promise((r) => setTimeout(r, 1000));
    setIsCreating(false);
    setCreateOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Status Pages
          </h1>
          <p className="text-muted-foreground">
            Public status pages for your users.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Status Page
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Status Page</DialogTitle>
              <DialogDescription>
                Set up a new public status page for your services.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="sp-title">Title</Label>
                <Input
                  id="sp-title"
                  placeholder="My Service Status"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sp-slug">Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    /status/
                  </span>
                  <Input
                    id="sp-slug"
                    placeholder="my-service"
                    pattern="[a-z0-9-]+"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sp-desc">
                  Description{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="sp-desc"
                  placeholder="Current status of all our services"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {mockStatusPages.map((page) => (
          <Link key={page.id} href={`/status-pages/${page.id}`}>
            <Card className="hover:bg-accent/30 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {page.title}
                    </CardTitle>
                    {page.description && (
                      <CardDescription className="mt-1">
                        {page.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      page.isPublic
                        ? "border-emerald-500/20 text-emerald-400"
                        : "border-amber-500/20 text-amber-400"
                    }
                  >
                    {page.isPublic ? "Public" : "Private"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>{page.monitorCount} monitors</span>
                    <span>
                      Created{" "}
                      {page.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                    <Globe className="h-3 w-3" />
                    <span className="text-xs font-mono">
                      /status/{page.slug}
                    </span>
                    <ExternalLink className="h-3 w-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {mockStatusPages.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Globe className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No status pages
            </h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              Create a public status page to keep your users informed
              about service health.
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create your first status page
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
