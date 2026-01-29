"use client";

import { useState } from "react";
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
import {
  Check,
  Copy,
  CreditCard,
  Key,
  Loader2,
  Plus,
  Trash2,
  User,
} from "lucide-react";

// Mock data
const mockApiKeys = [
  {
    id: "k1",
    name: "CLI Tool",
    keyPrefix: "am_live_7x9k",
    lastUsedAt: new Date(Date.now() - 1000 * 60 * 30),
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "k2",
    name: "CI/CD Pipeline",
    keyPrefix: "am_live_3m2p",
    lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    createdAt: new Date("2024-02-01"),
  },
];

const mockUser = {
  name: "John Doe",
  email: "john@example.com",
  plan: "pro" as const,
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, API keys, and billing.
        </p>
      </div>

      <Tabs defaultValue="api-keys" className="space-y-4">
        <TabsList>
          <TabsTrigger value="api-keys" className="gap-1.5">
            <Key className="h-3.5 w-3.5" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-1.5">
            <User className="h-3.5 w-3.5" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* API Keys */}
        <TabsContent value="api-keys">
          <ApiKeysTab />
        </TabsContent>

        {/* Profile */}
        <TabsContent value="profile">
          <ProfileTab user={mockUser} />
        </TabsContent>

        {/* Billing */}
        <TabsContent value="billing">
          <BillingTab plan={mockUser.plan} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ApiKeysTab() {
  const [keys, setKeys] = useState(mockApiKeys);
  const [createOpen, setCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleCreate() {
    setIsCreating(true);
    // TODO(@backend): Call API to create key
    await new Promise((r) => setTimeout(r, 1000));
    setIsCreating(false);
    setNewKeyValue("am_live_abc123def456ghi789jkl012mno345");
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleRevoke(id: string) {
    setKeys(keys.filter((k) => k.id !== id));
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              Manage API keys for CLI and programmatic access.
            </CardDescription>
          </div>
          <Dialog
            open={createOpen}
            onOpenChange={(open) => {
              setCreateOpen(open);
              if (!open) {
                setNewKeyValue(null);
                setNewKeyName("");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 h-3 w-3" />
                Create Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {newKeyValue
                    ? "API Key Created"
                    : "Create API Key"}
                </DialogTitle>
                <DialogDescription>
                  {newKeyValue
                    ? "Copy this key now. You won't be able to see it again."
                    : "Give your key a name to identify it later."}
                </DialogDescription>
              </DialogHeader>
              {newKeyValue ? (
                <div className="space-y-4 py-4">
                  <div className="flex items-center gap-2 rounded-lg border bg-muted p-3 font-mono text-sm">
                    <code className="flex-1 truncate">
                      {newKeyValue}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleCopy(newKeyValue, "new")
                      }
                    >
                      {copiedId === "new" ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => {
                        setCreateOpen(false);
                        setNewKeyValue(null);
                        setNewKeyName("");
                      }}
                    >
                      Done
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="key-name">Key name</Label>
                    <Input
                      id="key-name"
                      value={newKeyName}
                      onChange={(e) =>
                        setNewKeyName(e.target.value)
                      }
                      placeholder="e.g., CLI Tool"
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      variant="ghost"
                      onClick={() => setCreateOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={
                        !newKeyName.trim() || isCreating
                      }
                    >
                      {isCreating && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {keys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div>
                <p className="font-medium text-sm">{key.name}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <code className="font-mono">
                    {key.keyPrefix}...
                  </code>
                  <span>·</span>
                  <span>
                    Last used{" "}
                    {key.lastUsedAt
                      ? key.lastUsedAt.toLocaleDateString()
                      : "Never"}
                  </span>
                  <span>·</span>
                  <span>
                    Created {key.createdAt.toLocaleDateString()}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRevoke(key.id)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Revoke
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileTab({
  user,
}: {
  user: { name: string; email: string };
}) {
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    // TODO(@backend): Call API to update profile
    await new Promise((r) => setTimeout(r, 1000));
    setIsSaving(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Update your account information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Name</Label>
            <Input
              id="profile-name"
              defaultValue={user.name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              type="email"
              defaultValue={user.email}
            />
          </div>
          <Separator />
          <Button type="submit" disabled={isSaving}>
            {isSaving && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function BillingTab({ plan }: { plan: string }) {
  const planNames: Record<string, string> = {
    free: "Free",
    pro: "Pro",
    business: "Business",
  };
  const planPrices: Record<string, string> = {
    free: "$0/mo",
    pro: "$12/mo",
    business: "$29/mo",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            Manage your subscription and billing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                <CreditCard className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-lg">
                  {planNames[plan] ?? plan} Plan
                </p>
                <p className="text-sm text-muted-foreground">
                  {planPrices[plan] ?? "Custom"}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="border-emerald-500/20 text-emerald-400"
            >
              Active
            </Badge>
          </div>
        </CardContent>
      </Card>

      {plan !== "business" && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade</CardTitle>
            <CardDescription>
              Get more monitors, faster check intervals, and advanced
              features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/pricing">View Plans</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
