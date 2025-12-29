import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const scrollToWaitlist = () => {
    document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold">
            Prom<span className="text-accent">ysr</span>
          </span>
          <span className="text-[10px] text-muted-foreground align-super">™</span>
        </Link>
        
        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollToSection("how-it-works")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            How It Works
          </button>
          <button onClick={() => scrollToSection("features")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Features
          </button>
          <button onClick={() => scrollToSection("pricing")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </button>
        </div>
        
        {/* Auth */}
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" className="text-sm font-medium">
              Sign In
            </Button>
          </Link>
          <Button onClick={scrollToWaitlist} className="text-sm font-medium rounded-full px-6">
            Get Started
          </Button>
        </div>
      </div>
    </nav>
  );
}