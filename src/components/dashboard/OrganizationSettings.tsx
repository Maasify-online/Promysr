import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Organization, OrganizationMember } from "@/types/promysr";
import { useState } from "react";
import { Check, CreditCard, Plus, UserPlus, Users, MessageSquare, BarChart2, Zap, UserCog, Send, Mail, Save, X } from "lucide-react";
import { toast } from "sonner";
import { RefreshCw, Lock, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye } from "lucide-react";
import { getEmailTemplate } from "@/utils/emailTemplates";

interface OrganizationSettingsProps {
    organization: Organization;
    members: OrganizationMember[];
    isOwner: boolean; // Only owners/admins can edit
}

export function OrganizationSettings({ organization, members, isOwner }: OrganizationSettingsProps) {
    const [inviteEmail, setInviteEmail] = useState("");
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(organization.billing_cycle);
    const [digestTime, setDigestTime] = useState(organization.daily_digest_time || "08:00");
    const [weeklyTime, setWeeklyTime] = useState(organization.weekly_report_time || "09:00");
    const [timezone, setTimezone] = useState(organization.timezone || "UTC");

    // Email Config State
    const [senderName, setSenderName] = useState(organization.email_sender_name || organization.name);
    const [replyToEmail, setReplyToEmail] = useState(organization.email_reply_to || members.find(m => m.user_id === organization.owner_id)?.profile?.email || "");

    // Toggles State
    const [realtimeEnabled, setRealtimeEnabled] = useState(organization.realtime_alerts_enabled ?? true);
    const [digestEnabled, setDigestEnabled] = useState(organization.daily_digest_enabled ?? true);
    const [weeklyEnabled, setWeeklyEnabled] = useState(organization.weekly_report_enabled ?? true);

    const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
    const [isLoadingStripe, setIsLoadingStripe] = useState(false);

    // Load Razorpay Script
    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleUpgrade = async (planId: string) => {
        setIsLoadingStripe(true);
        try {
            const isLoaded = await loadRazorpay();
            if (!isLoaded) throw new Error("Razorpay SDK failed to load");

            // 1. Create Order via Edge Function
            const { data: orderData, error: orderError } = await supabase.functions.invoke('razorpay-actions', {
                body: { planId }
            });

            if (orderError) throw orderError;
            if (!orderData?.id) throw new Error("No Order ID returned");

            // 2. Open Razorpay Modal
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_PLACEHOLDER", // fallback for dev
                amount: orderData.amount,
                currency: "INR",
                name: "PromySr",
                description: `Upgrade to ${planId.split('_')[0]} Plan`,
                order_id: orderData.id,
                handler: async function (response: any) {
                    toast.success("Payment Successful!");
                    // Optimistic Update
                    await updateOrgSetting({ subscription_plan: planId });
                    setTimeout(() => window.location.reload(), 1000);
                },
                prefill: {
                    name: members.find(m => m.user_id === organization.owner_id)?.profile?.full_name || "User",
                    email: members.find(m => m.user_id === organization.owner_id)?.profile?.email || "user@example.com",
                },
                theme: {
                    color: "#0F172A"
                }
            };

            // @ts-ignore
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                toast.error("Payment Failed: " + response.error.description);
            });
            rzp.open();

        } catch (err) {
            console.error('Razorpay Error:', err);
            toast.error("Failed to start payment. Check console.");
        } finally {
            setIsLoadingStripe(false);
        }
    };

    const handleManageBilling = async () => {
        toast.info("To manage billing, please contact support or check your email invoice.");
    };

    const updateOrgSetting = async (updates: Partial<Organization>) => {
        try {
            const { error } = await supabase
                .from('organizations')
                .update(updates)
                .eq('id', organization.id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating settings:', error);
            toast.error("Failed to save settings");
            return false;
        }
    };

    const handleSaveDigestTime = async (time: string) => {
        setDigestTime(time);
        if (await updateOrgSetting({ daily_digest_time: time })) {
            toast.success(`Daily Digest time updated to ${time}`);
        }
    };

    const handleSaveWeeklyTime = async (time: string) => {
        setWeeklyTime(time);
        if (await updateOrgSetting({ weekly_report_time: time })) {
            toast.success(`Weekly Report time updated to ${time}`);
        }
    };

    // Toggles Handlers
    const handleToggleRealtime = async () => {
        const newValue = !realtimeEnabled;
        setRealtimeEnabled(newValue);
        if (await updateOrgSetting({ realtime_alerts_enabled: newValue })) {
            toast.success(`Real-time alerts ${newValue ? 'enabled' : 'disabled'}`);
        }
    };

    const handleToggleDigest = async () => {
        const newValue = !digestEnabled;
        setDigestEnabled(newValue);
        if (await updateOrgSetting({ daily_digest_enabled: newValue })) {
            toast.success(`Daily Digest ${newValue ? 'enabled' : 'disabled'}`);
        }
    };

    const handleToggleWeekly = async () => {
        const newValue = !weeklyEnabled;
        setWeeklyEnabled(newValue);
        if (await updateOrgSetting({ weekly_report_enabled: newValue })) {
            toast.success(`Weekly Report ${newValue ? 'enabled' : 'disabled'}`);
        }
    };

    const handleSaveTimezone = async (tz: string) => {
        setTimezone(tz);
        if (await updateOrgSetting({ timezone: tz })) {
            toast.success(`Timezone updated to ${tz}`);
        }
    };

    const handleSaveEmailSettings = async () => {
        if (await updateOrgSetting({
            email_sender_name: senderName,
            email_reply_to: replyToEmail
        })) {
            toast.success("Email configuration saved successfully", {
                description: `Emails will appear from "${senderName}" and replies go to ${replyToEmail}`,
            });
        }
    };

    const handleSendTestEmail = (type: string) => {
        toast.info(`Sending test ${type.replace('_', ' ')} email...`);
        // Simulate API call
        setTimeout(() => {
            toast.success(`Test email sent to your inbox`);
        }, 1500);
    };

    const BrandingHeader = `
        <div style="margin-bottom: 24px; text-align: center;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 12px;">
                <div style="width: 24px; height: 24px; background: linear-gradient(135deg, #007AFF 0%, #00C9B7 100%); border-radius: 6px;"></div>
                <span style="font-weight: 800; font-size: 18px; color: #0f172a; font-family: sans-serif;">PromySr</span>
            </div>
            <div style="height: 4px; width: 100%; background: linear-gradient(90deg, #007AFF 0%, #00C9B7 100%); border-radius: 2px;"></div>
        </div>
    `;

    const renderEmailPreview = (type: string) => {
        const mockData = {
            recipient_name: "Alex",
            leader_name: "Sarah (Leader)",
            promise_text: "Review Q3 Budget by Friday",
            due_date: "Oct 27, 2024",
            completer_name: "Alex",
            completed_at: "Oct 26, 2:30 PM",
            org_name: "Acme Corp",
            promises_made: 12,
            promises_kept: 10,
            completion_rate: "83%",
            top_performer: "Alex Johnson",
            due_count: 3,
            overdue_count: 1,
            tasks: [
                { text: "Review Q3 Budget", due_time: "5:00 PM" },
                { text: "Send Contract Update", due_time: "EOD" }
            ]
        };

        const { subject, body } = getEmailTemplate(type, mockData);

        return (
            <div className="space-y-4">
                <div className="mt-4 border rounded-lg overflow-hidden bg-muted/20">
                    <div className="bg-white border-b px-4 py-3 text-sm font-medium flex gap-2 items-center shadow-sm">
                        <span className="text-muted-foreground w-16 text-right">Subject:</span> <span className="text-foreground">{subject}</span>
                    </div>
                    <div className="p-8 flex justify-center bg-gray-50/50" dangerouslySetInnerHTML={{ __html: body }} />
                </div>
                <div className="flex justify-end">
                    <Button onClick={() => handleSendTestEmail(type)}>
                        <Send className="w-4 h-4 mr-2" />
                        Send Me a Test Email
                    </Button>
                </div>
            </div>
        );
    };

    const price = billingCycle === 'monthly' ? 999 : 10000;
    const savings = billingCycle === 'yearly' ? " (Save ₹1,989/yr)" : "";

    const usedSeats = members.length;
    const maxSeats = organization.max_users;
    const isFull = usedSeats >= maxSeats;

    const handleInvite = () => {
        if (!inviteEmail) return;
        if (isFull) {
            toast.error("Organization is full. Upgrade to Pro for more seats.");
            return;
        }

        // Simulate sending email
        toast.success(`Invite sending to ${inviteEmail}...`, {
            description: "Simulated Email: 'Join Organization on Promysr' (See email_templates.md)",
            duration: 5000,
        });
        setInviteEmail("");
    };

    // DEV TOOL: Toggle Plan
    const handleTogglePlan = async () => {
        const currentPlan = organization.subscription_plan as any;
        let newPlan = 'basic_999';

        if (currentPlan === 'basic_999' || currentPlan === 'starter_999') newPlan = 'pro_1999';
        else if (currentPlan === 'pro_1999') newPlan = 'ultimate_3999';
        else if (currentPlan === 'ultimate_3999') newPlan = 'trial';
        else newPlan = 'basic_999'; // Cycle back to start

        const { error } = await supabase
            .from('organizations')
            .update({ subscription_plan: newPlan })
            .eq('id', organization.id);

        if (error) {
            // DB Failed (likely because we are in Mock Mode with fake IDs)
            console.log("DB Update Failed (Expected in Mock Mode), using LocalStorage override");
            localStorage.setItem('promysr_dev_plan', newPlan);
            toast.success(`Switched to ${newPlan.split('_')[0].toUpperCase()} Plan(Local Mode)`);
            setTimeout(() => window.location.reload(), 500);
        } else {
            toast.success(`Switched to ${newPlan.split('_')[0].toUpperCase()} Plan`);
            setTimeout(() => window.location.reload(), 500);
        }
    };

    // DEV TOOL: Populate Random Data
    const handlePopulateData = async () => {
        if (!members.length) return;

        // ALGORITHM CHECK: Apply Limits even to Seeding
        const currentCount = await supabase.from('promises').select('*', { count: 'exact', head: true });
        const count = currentCount.count || 0;

        const isTrial = organization.subscription_plan === 'trial';
        const isBasic = organization.subscription_plan === 'starter_999' || organization.subscription_plan === 'basic_999';
        const limit = isTrial ? 10 : (isBasic ? 100 : Infinity);

        if (count + 5 > limit) {
            toast.error(`Cannot seed: Would exceed ${organization.subscription_plan} limit (${limit})`);
            return;
        }

        const promises = [];
        const verbs = ["Review", "Complete", "Send", "Analyze", "Prepare", "Fix", "Update"];
        const nouns = ["Presentation", "Budget", "Report", "Codebase", "Contract", "Design", "Proposal"];

        for (let i = 0; i < 5; i++) {
            const randomMember = members[Math.floor(Math.random() * members.length)];
            const randomVerb = verbs[Math.floor(Math.random() * verbs.length)];
            const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
            const daysOffset = Math.floor(Math.random() * 5); // 0 to 4 days out

            // In a real app we'd need proper user IDs. 
            // Here, we rely on the RLS allowing us to insert for 'me' or assume mocking.
            // But since 'promises' RLS typically enforces owner_id = auth.uid(), 
            // we can only seed for OURSELVES essentially, unless we are admin.
            // Let's seed for the current user mostly to be safe, or just insert.

            // Actually, best to just insert with current user as creator.
            // We can randomize 'owner_name' string though.

            // FIXED: Using correct schema columns (leader_id, owner_email)
            // No 'user_id' or 'organization_id' on promises table in this version.
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            promises.push({
                leader_id: user.id, // The creator (Required)
                promise_text: `${randomVerb} ${randomNoun} for ${randomMember.profile?.full_name || 'Team'} (Seed)`,
                owner_email: user.email, // Assign to self so I can see it immediately
                owner_name: 'Me (Seed)',
                status: Math.random() > 0.5 ? 'Open' : 'Closed',
                due_date: new Date(Date.now() + daysOffset * 86400000).toISOString(),
            });
        }

        const { error } = await supabase.from('promises').insert(promises);

        if (error) {
            console.error("Seeding failed", error);
            toast.error("Failed to seed data (RLS restriction likely)");
        } else {
            toast.success("Added 5 Random Promises!");
            setTimeout(() => window.location.reload(), 1000);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* 1. BRANDING & BASIC INFO */}
            <div className="flex items-center justify-between">
                <div>
                    {/* Header moved to main dashboard */}
                </div>
                <div className="flex items-center gap-2">
                    {/* DEV TOOL */}
                    {isOwner && (
                        <>
                            <Button variant="outline" size="sm" onClick={handlePopulateData}>
                                <Zap className="w-4 h-4 mr-2" />
                                Seed Data
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleTogglePlan}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Switch to Next Mode ({organization.subscription_plan})
                            </Button>
                        </>
                    )}
                    <Badge variant={organization.status === 'active' ? 'default' : 'secondary'}>
                        {organization.status.toUpperCase()}
                    </Badge>
                </div>
            </div>

            {/* 2. PLAN & TIERS */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

                {/* BASIC CARD */}
                <Card className={`relative flex flex-col p-6 rounded-3xl shadow-xl transition-all duration-300 ${organization.subscription_plan === 'basic_999' || organization.subscription_plan === 'starter_999' ? 'border-primary bg-primary/5' : 'border-border opacity-70 hover:opacity-100'} `}>
                    <CardHeader className="p-0 mb-6">
                        <h3 className="text-xl font-bold text-foreground/80 mb-2">Basic</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold">₹999</span>
                            <span className="text-muted-foreground">/mo</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">For small teams getting started.</p>
                    </CardHeader>
                    <CardContent className="flex-1 p-0">
                        <ul className="space-y-4 mb-4">
                            <li className="flex items-start gap-3 text-sm">
                                <Check className="w-4 h-4 text-primary mt-0.5" /> <span>Up to 10 Users</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm">
                                <Check className="w-4 h-4 text-primary mt-0.5" /> <span>100 Promises / mo</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm">
                                <Check className="w-4 h-4 text-primary mt-0.5" /> <span>Team Pulse View</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm">
                                <Check className="w-4 h-4 text-primary mt-0.5" /> <span>User Dashboards</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm">
                                <Check className="w-4 h-4 text-primary mt-0.5" /> <span>Email Reminders</span>
                            </li>
                        </ul>
                        <div className="pt-4 border-t border-dashed space-y-3">
                            <li className="flex items-start gap-3 text-sm text-muted-foreground/70">
                                <X className="w-4 h-4 mt-0.5" /> <span>No Weekly Reports</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-muted-foreground/70">
                                <X className="w-4 h-4 mt-0.5" /> <span>No Analytics</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-muted-foreground/70">
                                <X className="w-4 h-4 mt-0.5" /> <span>No Custom Branding</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-muted-foreground/70">
                                <X className="w-4 h-4 mt-0.5" /> <span>No WhatsApp</span>
                            </li>
                        </div>
                    </CardContent>
                    <div className="mt-auto space-y-3 pt-6">
                        {(organization.subscription_plan === 'basic_999' || organization.subscription_plan === 'starter_999') ? (
                            <Button className="w-full rounded-full" disabled>Current Plan</Button>
                        ) : (
                            <Button variant="outline" className="w-full rounded-full">Downgrade</Button>
                        )}
                        <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-primary" onClick={() => window.open('mailto:support@promysr.com')}>
                            Request Assistance
                        </Button>
                    </div>
                </Card>

                {/* PRO CARD */}
                <Card className={`relative flex flex-col p-6 rounded-3xl shadow-xl transition-all duration-300 scale-105 z-10 ${organization.subscription_plan === 'pro_1999' ? 'border-primary bg-primary/5 shadow-primary/20' : 'border-border opacity-70 hover:opacity-100'} `}>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="px-4 py-1 text-sm bg-primary text-primary-foreground">Most Popular</Badge>
                    </div>
                    <CardHeader className="p-0 mb-6 mt-2">
                        <h3 className="text-xl font-bold text-foreground/80 mb-2">Pro Team</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold">₹1999</span>
                            <span className="text-muted-foreground">/mo</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">For growing teams needing insights.</p>
                    </CardHeader>
                    <CardContent className="flex-1 p-0">
                        <div className="mb-4 text-sm font-semibold text-primary/80">Everything in Basic, plus:</div>
                        <ul className="space-y-4 mb-4">
                            <li className="flex items-start gap-3 text-sm">
                                <Check className="w-4 h-4 text-primary mt-0.5" /> <span>Up to 25 Users</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm">
                                <Check className="w-4 h-4 text-primary mt-0.5" /> <span>Unlimited Promises</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm">
                                <Check className="w-4 h-4 text-primary mt-0.5" /> <span>Analytics & Trends</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm">
                                <Check className="w-4 h-4 text-primary mt-0.5" /> <span>Custom Branding</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm">
                                <Check className="w-4 h-4 text-primary mt-0.5" /> <span>Weekly Reports</span>
                            </li>
                        </ul>
                        <div className="pt-4 border-t border-dashed space-y-3">
                            <li className="flex items-start gap-3 text-sm text-muted-foreground/70">
                                <X className="w-4 h-4 mt-0.5" /> <span>No WhatsApp Integration</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-muted-foreground/70">
                                <X className="w-4 h-4 mt-0.5" /> <span>No Priority Support</span>
                            </li>
                        </div>
                    </CardContent>
                    <div className="mt-auto space-y-3 pt-6">
                        {/* @ts-ignore */}
                        {organization.subscription_plan === 'pro_1999' ? (
                            <Button className="w-full rounded-full" variant="outline" onClick={handleManageBilling} disabled={isLoadingStripe}>
                                Manage Billing
                            </Button>
                        ) : (
                            <Button
                                className="w-full rounded-full"
                                variant={(organization.subscription_plan as string) === 'pro_1999' ? 'default' : 'outline'}
                                onClick={() => handleUpgrade('pro_1999')}
                                disabled={isLoadingStripe}
                            >
                                {isLoadingStripe ? 'Processing...' : 'Upgrade to Pro'}
                            </Button>
                        )}
                        <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-primary" onClick={() => window.open('mailto:support@promysr.com')}>
                            Request Assistance
                        </Button>
                    </div>
                </Card>

                {/* ULTIMATE CARD */}
                <Card className={`relative flex flex-col p-6 rounded-3xl shadow-xl transition-all duration-300 ${organization.subscription_plan === 'ultimate_3999' ? 'border-primary bg-primary/5' : 'border-border opacity-70 hover:opacity-100'} `}>
                    <CardHeader className="p-0 mb-6">
                        <h3 className="text-xl font-bold text-foreground/80 mb-2">Ultimate</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold">₹3999</span>
                            <span className="text-muted-foreground">/mo</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">For established organizations.</p>
                    </CardHeader>
                    <CardContent className="flex-1 p-0">
                        <div className="mb-4 text-sm font-semibold text-primary/80">Everything in Pro, plus:</div>
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-start gap-3 text-sm">
                                <Check className="w-4 h-4 text-primary mt-0.5" /> <span>Up to 100 Users</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm">
                                <Check className="w-4 h-4 text-primary mt-0.5" /> <span>Whatsapp Enablement</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm">
                                <Check className="w-4 h-4 text-primary mt-0.5" /> <span>Priority Support</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm">
                                <Check className="w-4 h-4 text-primary mt-0.5" /> <span>Custom Branding</span>
                            </li>
                        </ul>
                    </CardContent>
                    <div className="mt-auto space-y-3 pt-6">
                        {organization.subscription_plan === 'ultimate_3999' ? (
                            <Button className="w-full rounded-full" variant="outline" onClick={handleManageBilling} disabled={isLoadingStripe}>
                                Manage Billing
                            </Button>
                        ) : (
                            <Button
                                className="w-full rounded-full bg-gradient-to-r from-indigo-500 to-primary text-white border-0 hover:opacity-90"
                                onClick={() => handleUpgrade('ultimate_3999')}
                                disabled={isLoadingStripe}
                            >
                                {isLoadingStripe ? 'Processing...' : 'Go Ultimate'}
                            </Button>
                        )}
                        <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-primary" onClick={() => window.open('mailto:support@promysr.com')}>
                            Request Assistance
                        </Button>
                    </div>
                </Card>

                {/* CUSTOM CARD */}
                <Card className="relative flex flex-col p-6 rounded-3xl shadow-xl border-dashed border-border bg-muted/20">
                    <CardHeader className="p-0 mb-6">
                        <h3 className="text-xl font-bold text-foreground/80 mb-2">Custom</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold">Contact</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">For enterprise scale & security.</p>
                    </CardHeader>
                    <CardContent className="flex-1 p-0">
                        <div className="mb-4 text-sm font-semibold text-primary/80">Enterprise Features:</div>
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-start gap-3 text-sm">
                                <Check className="w-4 h-4 text-primary mt-0.5" /> <span>100+ Users</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm">
                                <Check className="w-4 h-4 text-primary mt-0.5" /> <span>SSO & Audit Logs</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm">
                                <Check className="w-4 h-4 text-primary mt-0.5" /> <span>Dedicated Success Mgr</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm">
                                <Check className="w-4 h-4 text-primary mt-0.5" /> <span>Custom Contracts</span>
                            </li>
                        </ul>
                    </CardContent>
                    <div className="mt-auto space-y-3">
                        <Button variant="outline" className="w-full rounded-full">Contact Sales</Button>
                        <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-primary" onClick={() => window.open('mailto:support@promysr.com')}>
                            Request Assistance
                        </Button>
                    </div>
                </Card>
            </div>

            {/* 3. SETTINGS & PREFERENCES */}
            <div className="grid gap-6 md:grid-cols-2">

                {/* EMAIL CONFIGURATION (Restricted) */}
                <Card className={`h-full flex flex-col ${!['pro_1999', 'ultimate_3999'].includes(organization.subscription_plan) ? "opacity-75 border-dashed" : ""}`}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle>Email Brand</CardTitle>
                                <CardDescription>Customize sender identity.</CardDescription>
                            </div>
                            {!['pro_1999', 'ultimate_3999'].includes(organization.subscription_plan) && (
                                <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">
                                    <Lock className="w-3 h-3 mr-1" /> PRO
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Sender Name</label>
                            <Input
                                value={senderName}
                                onChange={(e) => setSenderName(e.target.value)}
                                placeholder="e.g. Acme Team"
                                disabled={!['pro_1999', 'ultimate_3999'].includes(organization.subscription_plan)}
                            />
                            {!['pro_1999', 'ultimate_3999'].includes(organization.subscription_plan) ? (
                                <p className="text-xs text-muted-foreground">
                                    Emails will appear from: <strong>noreply@promysr.com</strong>
                                </p>
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    Emails will appear as: <strong>{senderName} via Promysr</strong>
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Reply-To Email</label>
                            <Input
                                value={replyToEmail}
                                onChange={(e) => setReplyToEmail(e.target.value)}
                                placeholder="e.g. admin@acme.com"
                                disabled={!['pro_1999', 'ultimate_3999'].includes(organization.subscription_plan)}
                            />
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button
                                onClick={handleSaveEmailSettings}
                                disabled={!['pro_1999', 'ultimate_3999'].includes(organization.subscription_plan)}
                                size="sm"
                            >
                                <Save className="w-4 h-4 mr-2" /> Save
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* GENERAL SETTINGS */}
                <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>General Settings</CardTitle>
                        <CardDescription>Timezone and formatting.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Organization Timezone</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={timezone}
                                onChange={(e) => handleSaveTimezone(e.target.value)}
                            >
                                <option value="UTC">UTC (Coordinated Universal Time)</option>
                                <option value="Asia/Kolkata">IST (India Standard Time)</option>
                                <option value="America/New_York">EST (Eastern Standard Time)</option>
                                <option value="America/Los_Angeles">PST (Pacific Standard Time)</option>
                                <option value="Europe/London">GMT (Greenwich Mean Time)</option>
                            </select>
                            <p className="text-xs text-muted-foreground">All reports and digests will be sent according to this timezone.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* PREVIEW DIALOG */}
            <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Email Simulation</DialogTitle>
                        <DialogDescription>
                            This is how the notification will look to your users.
                        </DialogDescription>
                    </DialogHeader>

                    {previewTemplate === 'realtime' ? (
                        <Tabs defaultValue="new_assignment" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="new_assignment">New Promise (User)</TabsTrigger>
                                <TabsTrigger value="promise_completed">Promise Completed (Leader)</TabsTrigger>
                            </TabsList>
                            <TabsContent value="new_assignment">
                                {renderEmailPreview('new_assignment')}
                            </TabsContent>
                            <TabsContent value="promise_completed">
                                {renderEmailPreview('promise_completed')}
                            </TabsContent>
                        </Tabs>
                    ) : previewTemplate === 'digest' ? (
                        <Tabs defaultValue="digest_leader" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="digest_leader">Leader View</TabsTrigger>
                                <TabsTrigger value="digest_user">User View</TabsTrigger>
                            </TabsList>
                            <TabsContent value="digest_leader">
                                {renderEmailPreview('digest_leader')}
                            </TabsContent>
                            <TabsContent value="digest_user">
                                {renderEmailPreview('digest_user')}
                            </TabsContent>
                        </Tabs>
                    ) : (
                        <Tabs defaultValue="weekly_leader" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="weekly_leader">Leader View</TabsTrigger>
                                <TabsTrigger value="weekly_user">User View</TabsTrigger>
                            </TabsList>
                            <TabsContent value="weekly_leader">
                                {renderEmailPreview('weekly_leader')}
                            </TabsContent>
                            <TabsContent value="weekly_user">
                                {renderEmailPreview('weekly_user')}
                            </TabsContent>
                        </Tabs>
                    )}
                </DialogContent>
            </Dialog>

            {/* 4. INVITE MEMBER */}
            <Card>
                <CardHeader>
                    <CardTitle>Invite Member</CardTitle>
                    <CardDescription>Add a new member to your organization.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <Input
                            placeholder="colleague@company.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                        />
                        <Button onClick={handleInvite} disabled={!inviteEmail || isFull}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Invite
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* 4. MEMBERS (Basic View) */}
            <Card>
                <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>People currently in your loop.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {members.map((member) => (
                            <div key={member.user_id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {member.profile?.full_name?.substring(0, 2).toUpperCase() || "??"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium leading-none">{member.profile?.full_name || 'Unknown User'}</p>
                                        <p className="text-xs text-muted-foreground">{member.profile?.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                                        {member.role === 'admin' ? 'Leader' : 'Member'}
                                    </Badge>
                                </div>
                            </div>
                        ))}

                        {members.length === 0 && (
                            <p className="text-center text-muted-foreground py-4">No members found.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
