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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Hash,
  Loader2,
  Mail,
  MessageSquare,
  Plus,
  Send,
  Trash2,
  Webhook,
} from "lucide-react";
import type { AlertType } from "@apimon/shared";

const channelIcons: Record<string, React.ElementType> = {
  telegram: Send,
  slack: Hash,
  discord: MessageSquare,
  email: Mail,
  webhook: Webhook,
};

const channelColors: Record<string, string> = {
  telegram: "text-blue-400",
  slack: "text-purple-400",
  discord: "text-indigo-400",
  email: "text-amber-400",
  webhook: "text-emerald-400",
};

interface MockChannel {
  id: string;
  type: string;
  name: string;
  config: Record<string, string>;
  isVerified: boolean;
}

const mockChannels: MockChannel[] = [
  {
    id: "ch1",
    type: "slack",
    name: "Engineering Slack",
    config: { webhookUrl: "https://hooks.slack.com/services/xxx" },
    isVerified: true,
  },
  {
    id: "ch2",
    type: "telegram",
    name: "Ops Telegram",
    config: { chatId: "-1001234567890" },
    isVerified: true,
  },
  {
    id: "ch3",
    type: "email",
    name: "dev@example.com",
    config: { email: "dev@example.com" },
    isVerified: true,
  },
  {
    id: "ch4",
    type: "discord",
    name: "Alerts Discord",
    config: { webhookUrl: "https://discord.com/api/webhooks/xxx" },
    isVerified: false,
  },
];

export default function AlertsPage() {
  const [channels, setChannels] = useState(mockChannels);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("telegram");
  const [testing, setTesting] = useState<string | null>(null);

  async function handleTest(channelId: string) {
    setTesting(channelId);
    // TODO(@backend): Call test endpoint
    await new Promise((r) => setTimeout(r, 1500));
    setTesting(null);
  }

  function handleDelete(channelId: string) {
    setChannels(channels.filter((c) => c.id !== channelId));
  }

  function handleAdd() {
    // TODO(@backend): Call API to create channel
    setAddOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Alert Channels
          </h1>
          <p className="text-muted-foreground">
            Configure where to receive downtime notifications.
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Channel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Alert Channel</DialogTitle>
              <DialogDescription>
                Set up a new notification channel for downtime alerts.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Channel Type</Label>
                <Select
                  value={selectedType}
                  onValueChange={setSelectedType}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="telegram">
                      Telegram
                    </SelectItem>
                    <SelectItem value="slack">Slack</SelectItem>
                    <SelectItem value="discord">
                      Discord
                    </SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="webhook">
                      Webhook
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="channel-name">Name</Label>
                <Input
                  id="channel-name"
                  placeholder="e.g., Engineering Slack"
                />
              </div>
              {selectedType === "telegram" && (
                <div className="space-y-2">
                  <Label htmlFor="telegram-chat">Chat ID</Label>
                  <Input
                    id="telegram-chat"
                    placeholder="-1001234567890"
                  />
                  <p className="text-xs text-muted-foreground">
                    Add @apimon_bot to your group and use /chatid to
                    get the ID.
                  </p>
                </div>
              )}
              {selectedType === "slack" && (
                <div className="space-y-2">
                  <Label htmlFor="slack-webhook">
                    Webhook URL
                  </Label>
                  <Input
                    id="slack-webhook"
                    placeholder="https://hooks.slack.com/services/..."
                  />
                </div>
              )}
              {selectedType === "discord" && (
                <div className="space-y-2">
                  <Label htmlFor="discord-webhook">
                    Webhook URL
                  </Label>
                  <Input
                    id="discord-webhook"
                    placeholder="https://discord.com/api/webhooks/..."
                  />
                </div>
              )}
              {selectedType === "email" && (
                <div className="space-y-2">
                  <Label htmlFor="email-address">
                    Email Address
                  </Label>
                  <Input
                    id="email-address"
                    type="email"
                    placeholder="alerts@example.com"
                  />
                </div>
              )}
              {selectedType === "webhook" && (
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    type="url"
                    placeholder="https://your-server.com/webhook"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAdd}>Add Channel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Channel list */}
      <div className="space-y-3">
        {channels.map((channel) => {
          const Icon = channelIcons[channel.type] ?? Bell;
          const colorClass = channelColors[channel.type] ?? "text-foreground";
          return (
            <Card key={channel.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg bg-accent ${colorClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{channel.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground capitalize">
                        {channel.type}
                      </span>
                      {channel.isVerified ? (
                        <Badge
                          variant="outline"
                          className="text-xs border-emerald-500/20 text-emerald-400"
                        >
                          Verified
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs border-amber-500/20 text-amber-400"
                        >
                          Unverified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(channel.id)}
                    disabled={testing === channel.id}
                  >
                    {testing === channel.id ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="mr-1 h-3 w-3" />
                    )}
                    Test
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(channel.id)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {channels.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No alert channels
            </h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              Add an alert channel to get notified when your monitors
              go down.
            </p>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add your first channel
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
