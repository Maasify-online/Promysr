import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowRight, Lock } from "lucide-react";
import { addDays } from "date-fns";
import { toast } from "sonner";
import type { Profile, OrganizationMember } from "@/types/promysr";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface PromiseInputProps {
    onSubmit: (data: any) => Promise<void>;
    userEmail?: string;
    onAddPromise?: (data: any) => Promise<void>;
    userRole?: 'admin' | 'member';
    members?: OrganizationMember[];
    subscriptionPlan?: string;
    promiseCount?: number;
    isLocked?: boolean;
}

export function PromiseInput({ onSubmit, userEmail, userRole = 'member', members = [], subscriptionPlan = 'starter_999', promiseCount = 0, isLocked: externalLocked }: PromiseInputProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [text, setText] = useState("");

    // State for Admin Mode (Who acts as Owner?)
    const [selectedOwnerId, setSelectedOwnerId] = useState<string>("me");

    // State for Member Mode (Who acts as Leader?)
    const [accountabilityTarget, setAccountabilityTarget] = useState<'self' | 'leader'>('self');

    // Smart Default: Today
    const defaultDate = new Date().toISOString().split('T')[0];
    const [dueDate, setDueDate] = useState(defaultDate);

    // Find Leader ID if needed (First admin found)
    const leaderMember = members.find(m => m.role === 'admin');

    // PLAN HELPERS
    const isBasic = subscriptionPlan === 'starter_999' || subscriptionPlan === 'basic_999';
    const isTrial = subscriptionPlan === 'trial'; // New Trial Plan

    // LIMITS
    // Pro/Ultimate = Infinity
    // Basic = 100
    // Trial = 10
    const PROMISE_LIMIT = isTrial ? 10 : 100;

    const isLimitReached = false; // Unlocked

    // LOCK LOGIC: Members on Basic OR Limit Reached
    // Trial users are NOT locked by role, only by limit
    // Fallback to externalLocked if provided (Source of Truth from Dashboard)
    const internalLocked = false; // Unlocked
    const isLocked = externalLocked !== undefined ? externalLocked : internalLocked;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLocked || !text.trim()) return;

        if (isLimitReached) {
            const msg = isTrial
                ? "Trial Limit Reached (10/10). Upgrade to Pro to continue."
                : "Promise Limit Reached (100). Upgrade to Pro for unlimited promises.";
            toast.error(msg);
            return;
        }

        setIsLoading(true);

        // ... existing payload logic ...
        let payload: any = {
            promise_text: text,
            due_date: dueDate,
        };

        if (userRole === 'admin') {
            // LEADER MODE: Assigning to others (or self)

            if (selectedOwnerId === 'me') {
                payload.owner_name = 'Me';
                payload.owner_email = userEmail;
            } else {
                const selectedMember = members.find(m => m.user_id === selectedOwnerId);
                if (selectedMember && selectedMember.profile) {
                    payload.owner_name = selectedMember.profile.full_name || 'Team Member';
                    payload.owner_email = selectedMember.profile.email;
                } else {
                    // Fallback
                    payload.owner_name = 'Unknown';
                    payload.owner_email = 'unknown@org.com';
                }
            }
        } else {
            // MEMBER MODE: Promising Self or Leader
            payload.owner_name = 'Me';
            payload.owner_email = userEmail;

            if (accountabilityTarget === 'leader' && leaderMember) {
                // Override leader_id to be the Admin
                payload.leader_id = leaderMember.user_id;
            }
        }

        try {
            await onSubmit(payload);
            // Reset
            setText("");
            setDueDate(defaultDate);
            setSelectedOwnerId("me");
            setAccountabilityTarget("self");
        } catch (error) {
            console.error("Failed to log", error);
        } finally {
            setIsLoading(false);
        }
    };

    const placeholder = isLimitReached
        ? isTrial ? "Trial Limit Reached (10/10). Time to Upgrade!" : "Limit Reached (100/100). Upgrade to Pro to add more."
        : isLocked
            ? "Limit Reached. Ask your Leader to upgrade."
            : userRole === 'admin'
                ? "I need [Someone] to..."
                : accountabilityTarget === 'leader'
                    ? "I promise the Leader I will..."
                    : "I promise myself I will...";

    const quickActions = userRole === 'admin'
        ? [
            { label: "Assign Task", text: "Submit the Q3 report by Friday" },
            { label: "Request Update", text: "Update the project tracker" }
        ]
        : [
            { label: "Quick Win", text: "Finish that pending task" },
            { label: "Sync", text: "Send the weekly update" },
            { label: "Call", text: "Follow up with client" }
        ];

    return (
        <div className="w-full max-w-4xl mx-auto mb-8 animate-in fade-in slide-in-from-top-4 duration-500 group/input">
            <form onSubmit={handleSubmit} id="promise-input-form" className={`flex flex-col sm:flex-row sm:items-center gap-2 p-2 sm:p-2 bg-background border rounded-2xl sm:rounded-full shadow-lg transition-all focus-within:ring-2 focus-within:ring-primary/20 ${isLocked ? 'opacity-70 bg-muted/50' : 'hover:shadow-xl hover:border-primary/30'}`}>
                {/* 1. INPUT FIELD */}
                <div className="relative flex-1 w-full">
                    {isLocked && (
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    )}
                    <Input
                        id="promise-text-input"
                        autoFocus={!isLocked}
                        className={`border-none shadow-none focus-visible:ring-0 text-sm sm:text-base md:text-lg h-10 sm:h-12 bg-transparent ${isLocked ? 'pl-10 cursor-not-allowed' : 'pl-4'}`}
                        placeholder={placeholder}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        disabled={isLoading || isLocked}
                    />
                </div>

                {!isLocked && (
                    <>
                        {/* 2. ROLE SPECIFIC CONTROLS - Stack on mobile */}
                        <div className="flex items-center gap-2 w-full sm:w-auto sm:shrink-0 sm:border-l sm:border-border sm:px-2">

                            {userRole === 'admin' ? (
                                // ADMINISTRATIVE SELECTOR: Pick Who Owes
                                <div className="flex-1 sm:flex-none sm:w-[120px]">
                                    <Select value={selectedOwnerId} onValueChange={setSelectedOwnerId} disabled={isLoading}>
                                        <SelectTrigger className="border-none shadow-none focus:ring-0 h-9 bg-transparent gap-1 font-medium text-muted-foreground text-xs sm:text-sm">
                                            <SelectValue placeholder="Assign To" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="me">Me (Self)</SelectItem>
                                            {members.filter(m => m.profile?.email !== userEmail).map(m => (
                                                <SelectItem key={m.user_id} value={m.user_id}>
                                                    {m.profile?.full_name || m.profile?.email?.split('@')[0]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                // MEMBER SELECTOR: Pick Who Watches
                                <div className="flex items-center bg-muted/50 rounded-full p-1 h-8 flex-1 sm:flex-none">
                                    <button
                                        type="button"
                                        onClick={() => setAccountabilityTarget('self')}
                                        className={`px-2 sm:px-3 text-[10px] sm:text-xs font-medium rounded-full h-full transition-colors flex items-center gap-1 flex-1 sm:flex-none justify-center ${accountabilityTarget === 'self' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Myself
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAccountabilityTarget('leader')}
                                        className={`px-2 sm:px-3 text-[10px] sm:text-xs font-medium rounded-full h-full transition-colors flex items-center gap-1 flex-1 sm:flex-none justify-center ${accountabilityTarget === 'leader' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Leader
                                    </button>
                                </div>
                            )}

                            {/* 3. WHEN - Inline on mobile */}
                            <div className="flex-1 sm:flex-none">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"ghost"}
                                            className={cn(
                                                "h-8 sm:h-9 w-full sm:w-[110px] justify-start text-left font-normal px-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground",
                                                !dueDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-1 sm:mr-2 h-3 sm:h-4 w-3 sm:w-4" />
                                            {dueDate ? format(new Date(dueDate), "MMM d") : <span>Pick date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={dueDate ? new Date(dueDate) : undefined}
                                            onSelect={(date) => date && setDueDate(format(date, 'yyyy-MM-dd'))}
                                            // Allow selection of Today by comparing against start of today (00:00)
                                            disabled={(date) => {
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                return date < today;
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* 4. SAVE */}
                            <Button
                                type="submit"
                                size="icon"
                                disabled={isLoading || !text.trim()}
                                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full shrink-0"
                            >
                                {isLoading ? <Loader2 className="w-3 sm:w-4 h-3 sm:h-4 animate-spin" /> : <ArrowRight className="w-3 sm:w-4 h-3 sm:h-4" />}
                                <span className="sr-only">Log Promise</span>
                            </Button>
                        </div>
                    </>
                )}

                {isLocked && (
                    <div className="pr-4">
                        <span className="text-xs font-semibold text-muted-foreground border px-2 py-1 rounded">View Only</span>
                    </div>
                )}
            </form>

            {/* QUICK ACTIONS ROW */}
            {!isLocked && (
                <div className="flex flex-wrap items-center gap-2 mt-3 px-6 animate-in slide-in-from-top-2 duration-700">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground/50 tracking-wider mr-2">Quick Log:</span>
                    {quickActions.map(action => (
                        <button
                            key={action.label}
                            type="button"
                            onClick={() => setText(action.text)}
                            className="px-3 py-1 text-[11px] font-medium rounded-full bg-muted/50 text-muted-foreground border border-transparent hover:border-primary/20 hover:bg-primary/5 hover:text-primary transition-all"
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
