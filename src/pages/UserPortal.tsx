import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Shield, LogOut, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { format, isToday, isPast, parseISO } from "date-fns";
import type { PromysrPromise, Profile } from "@/types/promysr";

// Local type extending the shared one to include joined data
interface PortalPromise extends PromysrPromise {
    leader?: {
        full_name: string;
    };
}

const UserPortal = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [promises, setPromises] = useState<PortalPromise[]>([]);
    const [loading, setLoading] = useState(true);

    // Focus Mode State
    const [todaysTasks, setTodaysTasks] = useState<PortalPromise[]>([]);
    const [pendingTasks, setPendingTasks] = useState<PortalPromise[]>([]);

    useEffect(() => {
        checkAuthAndLoad();
    }, []);

    // Handle URL parameters from email links
    useEffect(() => {
        const handleEmailAction = async () => {
            const params = new URLSearchParams(window.location.search);
            const action = params.get('action');
            const promiseId = params.get('id');

            if (action && promiseId) {
                // Wait for data to load
                if (loading) return;

                switch (action) {
                    case 'complete':
                        // Mark promise as complete
                        await handleMarkComplete(promiseId);
                        toast.success("Processing your request from email...");
                        break;
                    case 'view':
                        // Scroll to specific promise (future enhancement)
                        toast.info("Viewing promise details");
                        break;
                    default:
                        console.warn('Unknown action:', action);
                }

                // Clear URL parameters after processing
                window.history.replaceState({}, '', '/user-portal');
            }
        };

        if (!loading) {
            handleEmailAction();
        }
    }, [loading, promises]);

    const checkAuthAndLoad = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            navigate("/login");
            return;
        }

        // Load Profile
        const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", session.user.id)
            .single();

        setProfile(profileData);

        // Load User's Promises (My Commitments)
        // Filter: I am the owner (user_id) AND status is NOT Closed
        const { data: myPromises } = await supabase
            .from("promises")
            .select("*, leader:leader_id(full_name)")
            .eq("user_id", session.user.id)
            .neq("status", "Closed")
            .order("due_date", { ascending: true });

        if (myPromises) {
            const typedPromises = myPromises as unknown as PortalPromise[];
            setPromises(typedPromises);

            // Filter for Focus Mode
            const today = typedPromises.filter(p =>
                p.status === 'Open' && (isToday(parseISO(p.due_date)) || isPast(parseISO(p.due_date)))
            );
            setTodaysTasks(today);

            const pending = typedPromises.filter(p => p.status === 'Pending Verification');
            setPendingTasks(pending);
        }

        setLoading(false);
    };

    const handleMarkComplete = async (id: string) => {
        try {
            // Optimistic Update
            setTodaysTasks(prev => prev.filter(p => p.id !== id));
            const completedPromise = promises.find(p => p.id === id);
            if (completedPromise) {
                setPendingTasks(prev => [...prev, { ...completedPromise, status: 'Pending Verification' }]);
            }

            const { error } = await supabase
                .from("promises")
                .update({ status: 'Pending Verification' })
                .eq("id", id);

            if (error) throw error;
            toast.success("Marked as Complete - Leader Notified");

            // Notify Leader (Trigger Review)
            // Fetch full promise to get leader details
            const { data: fullPromise } = await supabase.from('promises').select('*, leader:leader_id(email, full_name)').eq('id', id).single();

            if (fullPromise && fullPromise.leader) {
                const now = new Date();
                await supabase.functions.invoke('send-promise-notification', {
                    body: {
                        type: 'review_needed',
                        promise_text: fullPromise.promise_text,
                        due_date: fullPromise.due_date,
                        owner_email: profile?.email,
                        owner_name: profile?.full_name,
                        leader_email: fullPromise.leader.email,
                        leader_name: fullPromise.leader.full_name,
                        completed_at: now.toISOString(),
                        promise_id: id
                    }
                });
            }

        } catch (err) {
            console.error("Error completing:", err);
            toast.error("Failed to update");
            checkAuthAndLoad(); // Revert on error
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading Portal...</div>;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
            {/* Minimal Header */}
            <header className="px-6 py-6 flex justify-between items-center max-w-2xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <span className="font-bold text-white text-lg">P</span>
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-tight">User Portal</h1>
                        <p className="text-xs text-slate-400 font-medium">Focus Mode</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => navigate('/dashboard')}>
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Full Dash
                    </Button>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={() => supabase.auth.signOut()}>
                        <LogOut className="w-4 h-4" />
                    </Button>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-6 pb-20 space-y-8">

                {/* Integrity Score Hero */}
                <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center p-1 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-white/10 mb-6">
                        <Badge variant="outline" className="border-none text-emerald-400 bg-transparent px-4 py-1">
                            <Shield className="w-3 h-3 mr-2 fill-emerald-400/20" />
                            Premium Member
                        </Badge>
                    </div>

                    <h2 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">My Integrity Score</h2>
                    <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 tracking-tighter">
                        {profile?.integrity_score || 0}%
                    </div>
                    <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">
                        You are in the top <span className="text-white font-medium">10%</span> of promise keepers this week.
                    </p>
                </div>

                {/* Today's Focus */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-500" />
                            Due Today
                        </h3>
                        <Badge className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-0">
                            {todaysTasks.length} Pending
                        </Badge>
                    </div>

                    <div className="space-y-3">
                        {todaysTasks.length === 0 ? (
                            <Card className="bg-slate-900/50 border-slate-800 border-dashed">
                                <CardContent className="py-12 text-center">
                                    <CheckCircle2 className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                                    <p className="text-slate-400">All caught up for today!</p>
                                </CardContent>
                            </Card>
                        ) : (
                            todaysTasks.map(promise => (
                                <Card key={promise.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors group">
                                    <CardContent className="p-5 flex items-start gap-4">
                                        <div
                                            className="mt-1 h-6 w-6 rounded-full border-2 border-slate-600 hover:border-emerald-500 hover:bg-emerald-500/20 cursor-pointer transition-all flex items-center justify-center"
                                            onClick={() => handleMarkComplete(promise.id)}
                                            title="Mark as Complete"
                                        >
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-lg text-slate-200 leading-snug">{promise.promise_text}</p>
                                            <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                                                <span className="bg-slate-800 px-2 py-1 rounded text-slate-400">
                                                    To: {promise.leader?.full_name || 'Leader'}
                                                </span>
                                                {isPast(parseISO(promise.due_date)) && !isToday(parseISO(promise.due_date)) && (
                                                    <span className="text-red-400 font-medium flex items-center gap-1">
                                                        Overdue
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-white">
                                                {format(parseISO(promise.due_date), "h:mm a")}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </section>

                {/* Pending Verification */}
                {pendingTasks.length > 0 && (
                    <section>
                        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4 pl-1">Waiting for Review</h3>
                        <div className="space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                            {pendingTasks.map(promise => (
                                <div key={promise.id} className="flex items-center gap-3 p-4 bg-slate-900/30 rounded-lg border border-slate-800/50">
                                    <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></div>
                                    <span className="text-slate-400 line-through decoration-slate-600">{promise.promise_text}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

            </main>
        </div>
    );
};

export default UserPortal;
