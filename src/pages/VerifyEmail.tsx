import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft, MailCheck, AlertTriangle } from "lucide-react";

const VerifyEmail = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [verifying, setVerifying] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleVerification = async () => {
            // Check for error in URL parameters
            const errorDescription = searchParams.get("error_description");
            if (errorDescription) {
                setError(errorDescription);
                setVerifying(false);
                return;
            }

            // Check if we have a session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
                setError(sessionError.message);
                setVerifying(false);
                return;
            }

            if (session) {
                toast.success("Email verified successfully!");
                navigate("/dashboard");
                return;
            }

            // If no session but no error, we might be waiting for the auto-login from the link or just arrived here.
            // Listen for auth state changes which happen when the hash fragment is processed by Sudabase client
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
                    if (session) {
                        toast.success("Email verified successfully!");
                        navigate("/dashboard");
                    }
                }
            });

            return () => {
                subscription.unsubscribe();
            };
        };

        handleVerification();
    }, [navigate, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center px-6 gradient-bg">
            <div className="w-full max-w-md">
                <Link to="/login" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 text-sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to login
                </Link>

                <div className="p-8 rounded-2xl bg-card border border-border shadow-xl text-center">
                    <div className="flex flex-col items-center justify-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            {error ? (
                                <AlertTriangle className="w-8 h-8 text-destructive" />
                            ) : (
                                <MailCheck className="w-8 h-8 text-primary" />
                            )}
                        </div>
                        <h1 className="text-2xl font-bold mb-2">
                            {error ? "Verification Failed" : "Verifying Email"}
                        </h1>
                        <p className="text-muted-foreground">
                            {error
                                ? "There was a problem verifying your email address."
                                : "Please wait while we verify your email address..."}
                        </p>
                    </div>

                    {verifying && !error && (
                        <div className="flex justify-center my-8">
                            <Loader2 className="w-12 h-12 animate-spin text-primary" />
                        </div>
                    )}

                    {error && (
                        <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-lg mb-6 text-left">
                            <p className="font-semibold mb-1">Error details:</p>
                            <p>{error.replace(/\+/g, ' ')}</p>
                        </div>
                    )}

                    {error && (
                        <Button
                            onClick={() => navigate("/login")}
                            className="w-full h-12 rounded-full font-medium"
                        >
                            Back to Login
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
