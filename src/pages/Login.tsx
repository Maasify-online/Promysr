import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Mail, Phone, Smartphone } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);

  // Check for errors in URL (e.g. magic link expired)
  useState(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("error=")) {
      const params = new URLSearchParams(hash.substring(1));
      const errorDescription = params.get("error_description");
      const errorCode = params.get("error_code");

      if (errorDescription || errorCode) {
        // Clear the hash to prevent checking again on refresh
        window.history.replaceState(null, "", window.location.pathname);
        // Use setTimeout to allow the toast component to mount/activate if needed, 
        // though in React it usually works immediately if context is ready.
        setTimeout(() => {
          toast.error(errorDescription?.replace(/\+/g, " ") || "Authentication failed");
        }, 100);
      }
    }
  });

  // Email & Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Sync Profile Metadata for Email Login
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('profiles').upsert({
          user_id: session.user.id,
          email: session.user.email,
          signup_method: 'email_password',
          last_login: new Date().toISOString()
        } as any, { onConflict: 'user_id' });

        // LOG SUCCESS
        try {
          await (supabase as any).from("auth_logs").insert({
            event_type: "login_success",
            email: session.user.email,
            details: "Email/Password Login",
            user_agent: navigator.userAgent
          });
        } catch (err) { console.error("Log failed", err); }
      }

      toast.success("Welcome back!");

      // Use window.location for more reliable mobile redirect
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 100);
    } catch (error: any) {
      console.error("Login error:", error);

      // LOG FAILURE
      try {
        await (supabase as any).from("auth_logs").insert({
          event_type: "login_failed",
          email: email,
          details: error.message,
          user_agent: navigator.userAgent
        });
      } catch (logErr) { console.error("Logging failed", logErr); }

      toast.error(error.message || "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  // Magic Link Login
  const handleMagicLink = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      toast.success("Check your email for the magic link!");
    } catch (error: any) {
      console.error("Magic link error:", error);
      toast.error(error.message || "Failed to send magic link");
    } finally {
      setIsLoading(false);
    }
  };

  // Phone Login - Send OTP
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      toast.error("Please enter your phone number");
      return;
    }
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
      });

      if (error) throw error;

      setShowOtpInput(true);
      toast.success("OTP code sent to your phone");
    } catch (error: any) {
      console.error("Phone login error:", error);
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // Phone Login - Verify OTP
  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      toast.error("Please enter the verification code");
      return;
    }
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms',
      });

      if (error) throw error;

      // Sync Profile Metadata for Phone Login
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('profiles').upsert({
          user_id: session.user.id,
          signup_method: 'phone',
          phone_number: phone,
          // Phone auth might not give email immediately unless linked, 
          // but we upsert by user_id so it merges.
          last_login: new Date().toISOString()
        } as any, { onConflict: 'user_id' });

        // LOG SUCCESS
        try {
          await (supabase as any).from("auth_logs").insert({
            event_type: "login_success",
            email: phone, // Use phone as identifier since email might be missing
            details: "Phone OTP Login",
            user_agent: navigator.userAgent
          });
        } catch (err) { console.error("Log failed", err); }
      }

      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast.error(error.message || "Invalid verification code");
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
            <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
            <p className="text-muted-foreground text-sm">Sign in to your Promysr account</p>
          </div>

          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="phone">Phone</TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              <form onSubmit={handleEmailLogin} className="space-y-4">
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
                  <Label htmlFor="password" className="text-sm">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-full font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In with Password"
                  )}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading}
                  onClick={handleMagicLink}
                  className="w-full h-12 rounded-full font-medium"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Sign In with Magic Link
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="phone">
              {!showOtpInput ? (
                <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-12"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Include country code (e.g., +1 for USA)
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-full font-medium"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending Code...
                      </>
                    ) : (
                      <>
                        <Smartphone className="mr-2 h-4 w-4" />
                        Send Verification Code
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-sm">Verification Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="h-12 text-center text-lg tracking-widest"
                      maxLength={6}
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
                        Verifying...
                      </>
                    ) : (
                      "Verify & Sign In"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowOtpInput(false)}
                    className="w-full text-sm text-muted-foreground hover:text-foreground"
                  >
                    Change phone number
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>

          <p className="text-center text-muted-foreground text-sm mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="promysr-gradient-text font-bold hover:opacity-80 transition-opacity">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;