import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Mail } from "lucide-react";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });

            if (error) throw error;

            setIsSubmitted(true);
            toast.success("Password reset email sent!");
        } catch (error: any) {
            console.error("Reset password error:", error);
            if (error.message?.includes("rate limit") || error.status === 429) {
                toast.error("Please wait a minute before requesting another link.");
            } else {
                toast.error(error.message || "Failed to send reset email");
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6 gradient-bg">
                <div className="w-full max-w-sm">
                    <Link to="/login" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 text-sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to login
                    </Link>

                    <div className="p-8 rounded-2xl bg-card border border-border shadow-xl text-center">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                            <Mail className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Check your email</h1>
                        <p className="text-muted-foreground mb-6">
                            We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>
                        </p>
                        <Button asChild className="w-full rounded-full">
                            <Link to="/login">Back to Login</Link>
                        </Button>
                        <button
                            onClick={() => setIsSubmitted(false)}
                            className="mt-4 text-sm text-muted-foreground hover:text-primary underline"
                        >
                            Didn't receive the email? Try again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-6 gradient-bg">
            <div className="w-full max-w-sm">
                <Link to="/login" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 text-sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to login
                </Link>

                <div className="p-8 rounded-2xl bg-card border border-border shadow-xl">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
                        <p className="text-muted-foreground text-sm">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                    </div>

                    <form onSubmit={handleResetPassword} className="space-y-4">
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

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 rounded-full font-medium"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending link...
                                </>
                            ) : (
                                "Send Reset Link"
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
