import { Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PricingProps {
  onGetStarted: () => void;
}

const tiers = [
  {
    name: "Basic",
    price: "₹999",
    description: "For small teams getting started.",
    features: [
      "Up to 10 users",
      "100 promises",
      "Automatic reminders",
      "Team Pulse",
      "Email notifications",
    ],
    cta: "Start Basic",
    highlight: false,
  },
  {
    name: "Pro Team",
    price: "₹1999",
    description: "For growing teams needing insights.",
    features: [
      "Up to 25 users",
      "Unlimited promises",
      "Automatic reminders",
      "Team Pulse",
      "Analytics",
      "User Dashboard",
      "Email notifications",
    ],
    cta: "Start Pro",
    highlight: true, // Most popular
  },
  {
    name: "Ultimate Team",
    price: "₹3999",
    description: "For established organizations.",
    features: [
      "Up to 100 users",
      "Unlimited promises",
      "Automatic reminders",
      "Team Pulse",
      "Analytics",
      "User Dashboard",
      "Email notifications",
      "Whatsapp Enablement (Optional)"
    ],
    cta: "Start Ultimate",
    highlight: false,
  },
  {
    name: "Custom",
    price: "Custom",
    description: "For enterprise scale & security.",
    features: [
      "100+ users",
      "Dedicated Support",
      "SLA Agreements",
      "Custom Integrations",
      "On-premise Options"
    ],
    cta: "Request Quote",
    highlight: false,
    custom: true,
  }
];

export function Pricing({ onGetStarted }: PricingProps) {
  return (
    <section className="py-24 px-6 bg-secondary/30" id="pricing">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          Plans for Every <span className="text-accent">Stage</span>
        </h2>
        <p className="text-xl text-muted-foreground mb-16 max-w-2xl mx-auto">
          Choose the integrity infrastructure that fits your team's size.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col p-8 rounded-3xl bg-card border shadow-xl transition-all duration-300 hover:scale-105 ${tier.highlight ? 'border-primary shadow-primary/20 scale-105 z-10' : 'border-border'}`}
            >
              {tier.highlight && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-sm">
                  Most Popular
                </Badge>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground/80 mb-2">{tier.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  {tier.custom ? (
                    <span className="text-4xl font-bold">Contact</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold">{tier.price}</span>
                      <span className="text-muted-foreground">/mo</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2 min-h-[40px]">{tier.description}</p>
              </div>

              <ul className="text-left space-y-4 mb-8 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-foreground/90">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                onClick={onGetStarted}
                variant={tier.highlight ? "default" : "outline"}
                className={`w-full font-semibold rounded-full ${tier.highlight ? 'shadow-lg shadow-primary/25' : ''}`}
              >
                {tier.cta}
              </Button>
            </div>
          ))}
        </div>

        <p className="text-muted-foreground text-sm mt-12 flex items-center justify-center gap-2">
          <Info className="w-4 h-4" /> All plans come with a 14-day free trial. No credit card required.
        </p>
      </div>
    </section>
  );
}