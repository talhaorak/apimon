import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingFeature {
  text: string;
  included: boolean;
}

interface PricingCardProps {
  name: string;
  price: number; // in cents
  description: string;
  features: PricingFeature[];
  popular?: boolean;
  ctaText?: string;
  ctaHref?: string;
}

export function PricingCard({
  name,
  price,
  description,
  features,
  popular = false,
  ctaText = "Get started",
  ctaHref = "/signup",
}: PricingCardProps) {
  const displayPrice = price === 0 ? "Free" : `$${price / 100}`;

  return (
    <Card
      className={cn(
        "relative flex flex-col",
        popular && "border-primary shadow-lg shadow-primary/10"
      )}
    >
      {popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
          Most popular
        </Badge>
      )}
      <CardHeader>
        <CardTitle className="text-xl">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="pt-4">
          <span className="text-4xl font-bold">{displayPrice}</span>
          {price > 0 && (
            <span className="text-muted-foreground ml-1">/mo</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check
                className={cn(
                  "h-4 w-4 mt-0.5 shrink-0",
                  feature.included
                    ? "text-emerald-400"
                    : "text-muted-foreground/30"
                )}
              />
              <span
                className={cn(
                  "text-sm",
                  !feature.included && "text-muted-foreground/50"
                )}
              >
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={popular ? "default" : "outline"}
          asChild
        >
          <a href={ctaHref}>{ctaText}</a>
        </Button>
      </CardFooter>
    </Card>
  );
}
