import type { Metadata } from "next";
import { PricingCard } from "@/components/pricing-card";
import { Check, Minus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PLAN_PRICES_CENTS,
  PLAN_MONITOR_LIMITS,
  PLAN_STATUS_PAGE_LIMITS,
  PLAN_HISTORY_DAYS,
  PLAN_MIN_INTERVAL,
} from "@apimon/shared/constants";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing. Start free and upgrade when you need more monitors.",
};

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
      { text: "SLA reports", included: false },
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
      { text: "SLA reports", included: false },
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
      { text: "Custom domains", included: true },
      { text: "SLA reports", included: true },
    ],
  },
];

interface ComparisonRow {
  feature: string;
  free: string | boolean;
  pro: string | boolean;
  business: string | boolean;
}

const comparisonRows: ComparisonRow[] = [
  {
    feature: "Monitors",
    free: `${getLimit(PLAN_MONITOR_LIMITS, "free")}`,
    pro: `${getLimit(PLAN_MONITOR_LIMITS, "pro")}`,
    business: "Unlimited",
  },
  {
    feature: "Check interval",
    free: formatInterval(getLimit(PLAN_MIN_INTERVAL, "free")),
    pro: formatInterval(getLimit(PLAN_MIN_INTERVAL, "pro")),
    business: formatInterval(getLimit(PLAN_MIN_INTERVAL, "business")),
  },
  {
    feature: "Status pages",
    free: `${getLimit(PLAN_STATUS_PAGE_LIMITS, "free")}`,
    pro: `${getLimit(PLAN_STATUS_PAGE_LIMITS, "pro")}`,
    business: "Unlimited",
  },
  {
    feature: "History retention",
    free: `${getLimit(PLAN_HISTORY_DAYS, "free") * 24}h`,
    pro: `${getLimit(PLAN_HISTORY_DAYS, "pro")} days`,
    business: `${getLimit(PLAN_HISTORY_DAYS, "business")} days`,
  },
  { feature: "Email alerts", free: true, pro: true, business: true },
  { feature: "Telegram alerts", free: true, pro: true, business: true },
  { feature: "Slack alerts", free: false, pro: true, business: true },
  { feature: "Discord alerts", free: false, pro: true, business: true },
  { feature: "Webhook alerts", free: false, pro: true, business: true },
  { feature: "Team members", free: false, pro: true, business: true },
  { feature: "Custom domains", free: false, pro: false, business: true },
  { feature: "SLA reports", free: false, pro: false, business: true },
  { feature: "API access", free: false, pro: false, business: true },
  { feature: "Priority support", free: false, pro: false, business: true },
];

function CellValue({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="h-4 w-4 text-emerald-400 mx-auto" />
    ) : (
      <Minus className="h-4 w-4 text-muted-foreground/30 mx-auto" />
    );
  }
  return <span className="text-sm">{value}</span>;
}

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
          Start free and upgrade when you need more. No hidden fees, no
          surprises.
        </p>
      </div>

      {/* Pricing cards */}
      <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto mb-20">
        {pricingTiers.map((tier) => (
          <PricingCard key={tier.name} {...tier} />
        ))}
      </div>

      {/* Comparison table */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">
          Compare plans
        </h2>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[240px]">Feature</TableHead>
                <TableHead className="text-center">Free</TableHead>
                <TableHead className="text-center">Pro</TableHead>
                <TableHead className="text-center">Business</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonRows.map((row) => (
                <TableRow key={row.feature}>
                  <TableCell className="font-medium">
                    {row.feature}
                  </TableCell>
                  <TableCell className="text-center">
                    <CellValue value={row.free} />
                  </TableCell>
                  <TableCell className="text-center">
                    <CellValue value={row.pro} />
                  </TableCell>
                  <TableCell className="text-center">
                    <CellValue value={row.business} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
