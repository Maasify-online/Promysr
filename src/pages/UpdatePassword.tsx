import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Lock } from "lucide-react";

const UpdatePassword = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isValidating, setIsValidating] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (session) {
                setIsValidating(false);
                return;
            }

            // Parse hash for errors
            const hash = window.location.hash;

            if (hash) {
                const params = new URLSearchParams(hash.substring(1)); // remove #
                const errorDescription = params.get("error_description");
                const error = params.get("error");

                if (error || errorDescription) {
                    toast.error(`Error: ${errorDescription || error}`);
                    // Don't navigate away immediately so user can see error
                    return;
                }

                if (hash.includes("type=recovery")) {
                    return;
                }
            }

            // Fallback: If no session and no recovery params
            toast.error("Invalid or expired session. Please request a new password reset.");
            navigate("/forgot-password");
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
                if (session) {
                    setIsValidating(false);
                }
            }
        });

        checkSession();

        return () => {
            subscription.unsubscribe();
        };
    }, [navigate]);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            toast.success("Password updated successfully!");
            navigate("/dashboard");
        } catch (error: any) {
            console.error("Update password error:", error);
            toast.error(error.message || "Failed to update password");
        } finally {
            setIsLoading(false);
        }
    };

    if (isValidating) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6 gradient-bg">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
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
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                            <Lock className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Set New Password</h1>
                        <p className="text-muted-foreground text-sm">
                            Please enter your new password below.
                        </p>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm">New Password</Label>
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

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
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
                                    Updating...
                                </>
                            ) : (
                                "Update Password"
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UpdatePassword;
