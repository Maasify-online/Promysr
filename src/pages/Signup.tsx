import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";

const Signup = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);

  /* 
   * SECURITY NOTE: 
   * This is a frontend-level check to deter casual abuse of the free trial.
   * A robust solution requires Edge Functions to check IP against a DB table.
   * For MVP, we check a simpler localStorage flag and an external IP API.
   */
  const checkIpEligibility = async () => {
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      const userIp = data.ip;

      // 1. Check LocalStorage (Simplest deterrent)
      if (localStorage.getItem('promysr_trial_claimed') === 'true') {
        return false;
      }

      // 2. Ideally, check DB: supabase.rpc('check_ip_eligibility', { ip: userIp })
      // For now, we simulate success but log it.
      console.log(`Checking eligibility for IP: ${userIp}`);
      return true;
    } catch (e) {
      // Fail open if IP service is down, don't block users due to API error
      return true;
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      /* 
       * IP CHECK REMOVED
       * We now check trial expiration in the Dashboard instead of blocking signup.
       */
      // const isEligible = await checkIpEligibility();


      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: phoneNumber,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      // Mark device as used
      // Device tracking removed for new trial logic

      // Check if session is missing (indicates email verification is required)
      if (data && !data.session) {
        setIsVerificationSent(true);
        toast.success("Verification email sent!");
      } else {
        toast.success("Account created! Welcome to Promysr.");
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 gradient-bg">
      <div className="w-full max-w-sm">
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 text-sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Link>

        <div className="p-8 rounded-2xl bg-card border border-border shadow-xl">
          <div className="text-center mb-8 flex flex-col items-center">
            <img src="/promysr-logo.png" alt="PromySr Logo" className="h-14 w-auto mb-6" />
            <h1 className="text-2xl font-bold mb-2">Create account</h1>
            <p className="text-muted-foreground text-sm">Start tracking promises in minutes</p>
          </div>

          {isVerificationSent ? (
            <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold">Check your email</h2>
              <p className="text-muted-foreground text-sm">
                We've sent a verification link to <span className="font-medium text-foreground">{email}</span>. Please click the link to activate your account.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/login")}
              >
                Return to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="h-12"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12"
                  minLength={6}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-full font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          )}

          <p className="text-center text-muted-foreground text-sm mt-6">
            Already have an account?{" "}
            <Link to="/login" className="promysr-gradient-text font-bold hover:opacity-80 transition-opacity">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;