import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from("waitlist")
        .insert({ email, company_name: companyName || null });
      
      if (error) {
        if (error.code === "23505") {
          toast.info("You're already on the waitlist!");
        } else {
          throw error;
        }
      } else {
        toast.success("You're on the list! We'll be in touch soon.");
        setEmail("");
        setCompanyName("");
      }
    } catch (error) {
      console.error("Waitlist error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="waitlist" className="py-24 px-6">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Join the <span className="text-accent">Waitlist</span>
        </h2>
        <p className="text-lg text-muted-foreground mb-10">
          Be the first to know when Promysr launches. 
          Early access for founding members.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-card border-border h-14 text-center text-base rounded-xl"
            required
          />
          
          <Input
            type="text"
            placeholder="Company name (optional)"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="bg-card border-border h-14 text-center text-base rounded-xl"
          />
          
          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className="w-full font-semibold text-lg py-6 rounded-full shadow-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                Get Early Access
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </form>
      </div>
    </section>
  );
}