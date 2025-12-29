import { ArrowRight, Shield, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  onGetStarted: () => void;
}

export function Hero({ onGetStarted }: HeroProps) {
  return (
    <section className="relative min-h-[85vh] flex items-center gradient-bg overflow-hidden py-10 lg:py-0">
      <div className="max-w-7xl mx-auto px-4 md:px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="opacity-0 animate-fade-in text-center lg:text-left flex flex-col items-center lg:items-start">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs md:text-sm font-medium text-primary">
                The Accountability Layer for Business Promises™
              </span>
            </div>

            {/* Main headline */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 md:mb-6 tracking-tight">
              Promises exist everywhere.
              <br className="hidden md:block" />
              <span className="text-accent block mt-1">Accountability does not.</span>
            </h1>

            {/* Subhead */}
            <p className="text-base md:text-xl text-muted-foreground max-w-xl mb-8 leading-relaxed">
              Promysr™ closes loops so promises don’t slip through. Logging a commitment takes 5 seconds.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                size="lg"
                onClick={onGetStarted}
                className="group font-semibold text-base px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
              >
                Start Closing Loops
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>

          {/* Right Visual - Product Card */}
          <div className="opacity-0 animate-fade-in-right lg:pl-4 mt-8 lg:mt-0 w-full" style={{ animationDelay: '0.2s' }}>
            <div className="relative max-w-md mx-auto lg:max-w-none">
              {/* Floating decorative elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/10 rounded-full blur-xl" />
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-accent/10 rounded-full blur-2xl" />

              {/* Main Card */}
              <div className="relative bg-card rounded-2xl shadow-card p-6 md:p-8 border border-border/50 animate-float">
                <div className="text-center mb-6">
                  <h2 className="text-3xl md:text-4xl font-bold mb-2">
                    Prom<span className="text-accent">ysr</span><span className="text-[10px] align-super">™</span>
                  </h2>
                  <p className="text-xs md:text-sm text-muted-foreground">Powered by</p>
                  <p className="text-base md:text-lg font-semibold text-primary">Integrity Infrastructure™</p>
                </div>

                {/* Stats preview */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                    <span className="text-sm font-medium">47 Promises Kept This Week</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                    <Clock className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-sm font-medium">12 Awaiting Handshake</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg">
                    <Shield className="w-5 h-5 text-accent shrink-0" />
                    <span className="text-sm font-medium">94% Integrity Score</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}