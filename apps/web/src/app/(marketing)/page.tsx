import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Terminal,
  Zap,
  Globe,
  Bell,
  Shield,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { TerminalDemo } from "@/components/terminal-demo";
import { PricingCard } from "@/components/pricing-card";
import {
  PLAN_PRICES_CENTS,
  PLAN_MONITOR_LIMITS,
  PLAN_STATUS_PAGE_LIMITS,
  PLAN_HISTORY_DAYS,
  PLAN_MIN_INTERVAL,
} from "@apimon/shared/constants";

const features = [
  {
    icon: Terminal,
    title: "CLI-First",
    description:
      "Add monitors, check status, manage alerts — all from your terminal. No browser required.",
  },
  {
    icon: Zap,
    title: "Instant Alerts",
    description:
      "Get notified on Telegram, Slack, Discord, email, or webhook within seconds of downtime.",
  },
  {
    icon: Globe,
    title: "Beautiful Status Pages",
    description:
      "Share public status pages with your users. Custom slugs, 90-day uptime history.",
  },
  {
    icon: Bell,
    title: "Multi-Channel Alerts",
    description:
      "Configure multiple alert channels per monitor. Never miss a critical outage.",
  },
  {
    icon: Shield,
    title: "Reliable Monitoring",
    description:
      "Checks run every 30 seconds with intelligent incident detection and auto-recovery.",
  },
  {
    icon: BarChart3,
    title: "Detailed Analytics",
    description:
      "Response time charts, uptime history, and SLA reports to keep you informed.",
  },
];

function formatInterval(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${seconds / 60} min`;
}

function getLimit(map: Record<string, number>, key: string): number {
  return map[key] ?? 0;
}

function getPrice(key: string): number {
  return PLAN_PRICES_CENTS[key] ?? 0;
}

const pricingTiers = [
  {
    name: "Free",
    price: getPrice("free"),
    description: "For side projects and personal APIs",
    features: [
      { text: `${getLimit(PLAN_MONITOR_LIMITS, "free")} monitors`, included: true },
      {
        text: `${formatInterval(getLimit(PLAN_MIN_INTERVAL, "free"))} check interval`,
        included: true,
      },
      {
        text: `${getLimit(PLAN_STATUS_PAGE_LIMITS, "free")} status page`,
        included: true,
      },
      {
        text: `${getLimit(PLAN_HISTORY_DAYS, "free") * 24}h history`,
        included: true,
      },
      { text: "Email & Telegram alerts", included: true },
      { text: "Team features", included: false },
      { text: "Custom domains", included: false },
    ],
  },
  {
    name: "Pro",
    price: getPrice("pro"),
    description: "For growing projects and startups",
    popular: true,
    features: [
      { text: `${getLimit(PLAN_MONITOR_LIMITS, "pro")} monitors`, included: true },
      {
        text: `${formatInterval(getLimit(PLAN_MIN_INTERVAL, "pro"))} check interval`,
        included: true,
      },
      {
        text: `${getLimit(PLAN_STATUS_PAGE_LIMITS, "pro")} status pages`,
        included: true,
      },
      {
        text: `${getLimit(PLAN_HISTORY_DAYS, "pro")}-day history`,
        included: true,
      },
      { text: "All alert channels", included: true },
      { text: "Team features", included: true },
      { text: "Custom domains", included: false },
    ],
  },
  {
    name: "Business",
    price: getPrice("business"),
    description: "For teams that need everything",
    features: [
      { text: "Unlimited monitors", included: true },
      {
        text: `${formatInterval(getLimit(PLAN_MIN_INTERVAL, "business"))} check interval`,
        included: true,
      },
      { text: "Unlimited status pages", included: true },
      {
        text: `${getLimit(PLAN_HISTORY_DAYS, "business")}-day history`,
        included: true,
      },
      { text: "All alert channels", included: true },
      { text: "Team features", included: true },
      { text: "Custom domains & SLA reports", included: true },
    ],
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 pt-24 pb-16 text-center">
          <Badge
            variant="outline"
            className="mb-6 gap-1 border-emerald-500/30 text-emerald-400"
          >
            <Terminal className="h-3 w-3" />
            Open Source & CLI-First
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            API monitoring for
            <br />
            <span className="text-emerald-400">developers who live</span>
            <br />
            in the terminal
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Monitor your APIs from the command line. Get instant alerts on
            Telegram, Slack, Discord & email. Share beautiful status pages with
            your users.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start monitoring
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#cli-demo">See it in action</Link>
            </Button>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Free forever for up to 5 monitors · No credit card required
          </div>
        </div>
      </section>

      {/* CLI Demo */}
      <section id="cli-demo" className="mx-auto max-w-3xl px-4 py-16">
        <TerminalDemo />
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to keep your APIs alive
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Built by developers, for developers. No fluff, just monitoring.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="bg-card/50 border-border/50 hover:border-border transition-colors"
            >
              <CardContent className="pt-6">
                <feature.icon className="h-10 w-10 mb-4 text-emerald-400" />
                <h3 className="font-semibold text-lg mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Start free. Upgrade when you need more.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
          {pricingTiers.map((tier) => (
            <PricingCard key={tier.name} {...tier} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Card className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-emerald-500/20">
          <CardContent className="py-12 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Start monitoring in 30 seconds
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Install the CLI, add your first monitor, and get alerts. It&apos;s
              that simple.
            </p>
            <div className="inline-flex items-center gap-2 rounded-lg bg-[#0d1117] border px-4 py-3 font-mono text-sm mb-8">
              <span className="text-muted-foreground">$</span>
              <span>npx apimon check https://your-api.com/health</span>
            </div>
            <div className="flex justify-center">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Get started free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
