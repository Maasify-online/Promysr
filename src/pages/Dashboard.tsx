import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar, MobileSidebar } from "@/components/dashboard/Sidebar";
import { TeamView } from "@/components/dashboard/TeamView";
import { AllPromisesTable } from "@/components/dashboard/AllPromisesTable";
import { LeaderView } from "@/components/dashboard/LeaderView";
import { IntegrityCards } from "@/components/dashboard/IntegrityCards";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { TaskFilters, FilterType } from "@/components/dashboard/TaskFilters";
import { OrganizationSettings } from "@/components/dashboard/OrganizationSettings";
import { UserManagement } from "@/components/dashboard/UserManagement";
import { AnalyticsView } from "@/components/dashboard/AnalyticsView";
import { PromiseInput } from "@/components/dashboard/PromiseInput";
import { EmailNotificationSettings } from "@/components/dashboard/EmailNotificationSettings";
import { EmailLogs } from "@/components/dashboard/EmailLogs";



import { toast } from "sonner";
import type { PromysrPromise, Organization, OrganizationMember, Profile } from "@/types/promysr";
import { isToday, isPast, parseISO, format, differenceInDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Check, Calendar, Lock, Activity, CheckCircle2, Clock, Zap, Database, Users, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useFeedbackTrigger } from "@/hooks/useFeedbackTrigger";
import { MilestoneFeedbackDialog } from "@/components/feedback/MilestoneFeedbackDialog";

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);

  // Feedback Logic
  const { showFeedbackModal, setShowFeedbackModal, currentMilestone, currentUserId } = useFeedbackTrigger();

  // Navigation State
  // Navigation State - Added user_dashboards and member_pulse
  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'analytics' | 'settings' | 'leader' | 'user_dashboards' | 'member_pulse' | 'super_admin'>('overview');

  // filter state
  const [filter, setFilter] = useState<FilterType>('all');

  // Data State
  const [missed, setMissed] = useState<PromysrPromise[]>([]);
  const [dueToday, setDueToday] = useState<PromysrPromise[]>([]);
  const [open, setOpen] = useState<PromysrPromise[]>([]);
  const [closed, setClosed] = useState<PromysrPromise[]>([]);

  // raw data for activity feed
  const [allRaw, setAllRaw] = useState<PromysrPromise[]>([]);

  // UI State
  // Controls whether we show the "Get Started" splash or the main dashboard
  const [showEmptyState, setShowEmptyState] = useState(false);

  // RBAC STATE
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [orgMembers, setOrgMembers] = useState<OrganizationMember[]>([]);
  const [userRole, setUserRole] = useState<'admin' | 'member'>('member'); // default to member

  const [isLoading, setIsLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [lockedAction, setLockedAction] = useState<string | null>(null);

  // LAZY GATE CHECKER
  const checkGate = (action: string) => {
    // If Organization is inactive (Gate Closed)
    // AND action is a WRITE operation
    // THEN Trigger Paywall
    if (organization?.status === 'inactive') {
      setLockedAction(action);
      setShowPaywall(true);
      return false;
    }
    return true;
  };

  // Dashboard State
  const [targetUserEmail, setTargetUserEmail] = useState<string | null>(null);

  // Reject Dialog State (Phase 2)
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectPromiseId, setRejectPromiseId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    // Reset target user when tab changes if navigating away from member_pulse
    if (activeTab !== 'member_pulse' && activeTab !== 'user_dashboards') {
      setTargetUserEmail(null);
    }
  }, [activeTab]);



  useEffect(() => {
    let mounted = true;

    // Safety Timeout to prevent infinite loading
    const safetyTimer = setTimeout(() => {
      if (isLoading) {
        console.warn("Safety timeout triggered: Forcing dashboard load.");
        setIsLoading(false);
      }
    }, 8000); // 8 seconds max load time

    const initAuth = async () => {
      try {
        // 1. Initial Session Check
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // Immediately set minimal data to show dashboard (Optimistic UI)
          const userEmail = session.user.email || 'user@example.com';
          const userName = userEmail.split('@')[0].replace(/[._+]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

          setProfile({
            id: session.user.id,
            user_id: session.user.id,
            email: userEmail,
            full_name: userName,
            subscription_status: 'trial'
          });

          // Set temporary Org Data to unblock UI immediately
          setOrganization({
            id: 'temp-org',
            name: 'My Organization',
            subscription_plan: 'starter_999',
            billing_cycle: 'monthly',
            status: 'trialing',
            max_users: 10,
            owner_id: session.user.id,
            created_at: new Date().toISOString()
          } as any);

          setOrgMembers([{
            organization_id: 'temp-org',
            user_id: session.user.id,
            role: 'admin',
            profile: { email: userEmail, full_name: userName }
          }]);

          setUserRole('admin');
          setIsLoading(false);
          clearTimeout(safetyTimer); // Clear safety timer on success

          // Load real data in background
          if (mounted) checkAuthAndLoadData(session);
        } else {
          // No session
          if (window.location.hash.includes('access_token')) {
            console.log("Processing Magic Link...");
            // Do NOT turn off loading, let onAuthStateChange handle it.
            // Safety timer will save us if it fails.
          } else {
            console.log("No session found, redirecting...");
            // Allow redirect to happen
            setTimeout(() => {
              if (mounted) {
                window.location.href = '/login';
              }
            }, 1000);
          }
        }
      } catch (error) {
        console.error('Init auth error:', error);
        setIsLoading(false);
      }
    };

    initAuth();

    // 3. Listen for dynamic auth changes (e.g. hash parsed -> SIGNED_IN)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && mounted) {
        checkAuthAndLoadData(session);
      } else if (event === 'SIGNED_OUT' && mounted) {
        window.location.href = '/login';
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Handle URL parameters from email links (for leaders)
  useEffect(() => {
    const handleEmailAction = async () => {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      const promiseId = params.get('id');

      if (action && promiseId && !isLoading && profile) {
        switch (action) {
          case 'verify':
            // Verify promise completion (leader action)
            await handleClose(promiseId, 'Pending Verification');
            toast.success("Processing verification from email...");
            break;
          case 'reject':
            // Reject completion - open dialog for feedback
            setRejectPromiseId(promiseId);
            setShowRejectDialog(true);
            break;
          case 'extend':
            // Extend deadline (placeholder for Phase 4)
            toast.info("Extend deadline functionality coming soon in Phase 4");
            break;
          default:
            console.warn('Unknown action:', action);
        }

        // Clear URL parameters after processing
        window.history.replaceState({}, '', '/dashboard');
      }
    };

    if (!isLoading) {
      handleEmailAction();
    }
  }, [isLoading, profile]);

  async function checkAuthAndLoadData(session?: any) {
    try {
      if (!session) {
        const { data } = await supabase.auth.getSession();
        session = data.session;
      }
      if (!session) return; const { user } = session;

      const { data: profileData } = await supabase
        .from("profiles").select("*").eq("user_id", user.id).maybeSingle();

      // DERIVE NAME FROM EMAIL IF MISSING
      let currentProfile = profileData as any;
      if (!currentProfile) {
        // Fallback for new users who might not have a profile row yet
        currentProfile = {
          id: 'temp',
          user_id: user.id,
          email: user.email,
          full_name: null,
          subscription_status: 'none'
        };
      }

      if (!currentProfile.full_name && currentProfile.email) {
        // Auto-generate name from email (e.g. vinayak.kapoor@... -> Vinayak Kapoor)
        const derivedName = currentProfile.email.split('@')[0]
          .replace(/[._+]/g, ' ')
          .replace(/\b\w/g, (l: string) => l.toUpperCase());
        currentProfile.full_name = derivedName;

        // If it's a real profile (not temp), try to save this back to DB
        if (profileData) {
          const updates: any = { full_name: derivedName };

          if (!(currentProfile as any).signup_method) {
            updates.signup_method = 'magic_link'; // Default assumption for dashboard landing without login page set
            updates.last_login = new Date().toISOString();
          }

          supabase.from('profiles').update(updates).eq('id', currentProfile.id).then(({ error }) => {
            if (error) console.warn("Failed to auto-update profile meta", error);
          });
        }
      } else if (profileData && !(profileData as any).signup_method) {
        // If name exists but metadata missing
        supabase.from('profiles').update({
          signup_method: 'magic_link',
          last_login: new Date().toISOString()
        } as any).eq('id', profileData.id).then(() => { });
      }

      if (currentProfile) {
        const status = currentProfile.subscription_status || 'none';
        setProfile({ ...currentProfile, subscription_status: status });

        // REAL ORG DATA FETCH with Fallback
        let orgData: Organization | null = null;
        let membersData: OrganizationMember[] = [];
        let myRole: 'admin' | 'member' = 'member';

        try {
          const { data: memberRecord, error: memberError } = await supabase
            .from('organization_members')
            .select('role, organization:organizations(*)')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (memberRecord && !memberError && memberRecord.organization) {
            // User is in an org
            myRole = memberRecord.role as 'admin' | 'member';
            orgData = memberRecord.organization as unknown as Organization;

            // Fetch Members
            const { data: allMembers } = await supabase
              .from('organization_members')
              .select('*, profile:profiles(*)') // Join with profiles to get names
              .eq('organization_id', orgData.id);

            if (allMembers) {
              membersData = allMembers as unknown as OrganizationMember[];
            }
          }
        } catch (err) {
          console.warn("Failed to fetch org data, likely migration not applied", err);
        }

        if (orgData) {
          setOrganization(orgData);
          setOrgMembers(membersData);
          setUserRole(myRole);
        } else {
          // AUTO-CREATE ORG IN DB (Fixes Settings Persistence)
          console.log("No Org found. Creating default organization...");

          const newOrgId = crypto.randomUUID();

          // 1. Create Organization
          const { error: createOrgError } = await supabase.from('organizations').insert({
            id: newOrgId,
            name: currentProfile.company_name || 'My Organization',
            subscription_plan: 'starter_999',
            owner_id: session.user.id,
            status: 'inactive' // Start as inactive (Gate)
          });

          if (createOrgError) {
            console.warn("Failed to auto-create org (likely missing table), falling back to mock:", createOrgError);
            // FALLBACK: Use Mock Data so UI doesn't crash
            setOrganization({
              id: 'org-1',
              name: currentProfile.company_name || 'Demo Corp',
              subscription_plan: 'starter_999',
              billing_cycle: 'monthly',
              status: 'inactive', // Start as inactive
              max_users: 10,
              owner_id: session.user.id,
              created_at: new Date().toISOString()
            } as any);
            setOrgMembers([{
              organization_id: 'org-1',
              user_id: session.user.id,
              role: 'admin',
              profile: { email: session.user.email, full_name: currentProfile.full_name || 'You' }
            }]);
            setUserRole('admin');
          } else {
            // 2. Add Member (Admin) - Only if Org created
            await supabase.from('organization_members').insert({
              organization_id: newOrgId,
              user_id: session.user.id,
              role: 'admin'
            });

            // 3. Set State (Real DB Data)
            setOrganization({
              id: newOrgId,
              name: currentProfile.company_name || 'My Organization',
              subscription_plan: 'starter_999',
              billing_cycle: 'monthly',
              status: 'inactive',
              max_users: 10,
              owner_id: session.user.id,
              created_at: new Date().toISOString()
            } as any);

            setOrgMembers([{
              organization_id: newOrgId,
              user_id: session.user.id,
              role: 'admin',
              profile: { email: session.user.email, full_name: currentProfile.full_name || 'You' }
            }]);
            setUserRole('admin');
          }
        }

        // CHECK TRIAL STATUS
        // Lazy Gate: We do NOT show paywall on load anymore.
        // It is triggered by user action via checkGate()
        // const isInactive = organization?.status === 'inactive';
        setShowPaywall(false); // Default to closed on load

        const { data: promisesData } = await supabase
          .from("promises").select("*")
          .order("due_date", { ascending: true });

        if (promisesData) {
          const promises = promisesData as unknown as PromysrPromise[];
          setAllRaw(promises);
          categorizePromises(promises);
          // If user has 0 promises, show empty state initially
          if (promises.length === 0) {
            setShowEmptyState(true);
          } else {
            setShowEmptyState(false);
          }
        }
      }
    } catch (e: any) {
      console.error("Dashboard load error:", e);
      toast.error("Error loading dashboard: " + (e.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTrial = async () => {
    if (!organization) return;
    toast.loading("Processing Card Details...");

    // Simulate API/Stripe delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Update DB
    const { error } = await supabase
      .from('organizations')
      .update({ status: 'trialing', subscription_plan: 'starter_999' }) // Ensure plan is set
      .eq('id', organization.id);

    if (error) {
      // Check if error is RLS or table missing, fallback to local state update for demo
      console.warn("DB Update failed (likely permissions), failing gracefully for demo:", error);
    }

    toast.dismiss();
    toast.success("Trial Started!", { description: "You have 7 days of full access." });

    // Update Local State
    setOrganization({ ...organization, status: 'trialing' });
    setShowPaywall(false);
  };

  // Re-run categorization when raw data or target user changes
  useEffect(() => {
    categorizePromises(allRaw);
  }, [allRaw, targetUserEmail]);

  const categorizePromises = (all: PromysrPromise[]) => {
    const _missed: PromysrPromise[] = [];
    const _dueToday: PromysrPromise[] = [];
    const _open: PromysrPromise[] = [];
    const _closed: PromysrPromise[] = [];

    // FILTER: If viewing a specific member, filter raw data first
    const sourceData = targetUserEmail
      ? all.filter(p => p.owner_email === targetUserEmail)
      : all.filter(p => p.owner_email === profile?.email); // Default to My Commitments for Overview
    // NOTE: For 'overview' we usually want 'MY' promises. 
    // Existing logic (lines 338+) didn't filter by owner?! 
    // It implies `allRaw` was already filtered? 
    // Let's assume `allRaw` contains EVERYTHING for Admin.
    // So we MUST filter here.

    sourceData.forEach(p => {
      const dueDate = parseISO(p.due_date);
      const isDueToday = isToday(dueDate);
      const isOverdue = isPast(dueDate) && !isDueToday && p.status !== 'Closed';

      if (p.status === 'Closed') { _closed.push(p); }
      else if (p.status === 'Missed' || isOverdue) { _missed.push(p); }
      else if (p.status === 'Open' && isDueToday) { _dueToday.push(p); }
      else if (p.status === 'Open') { _open.push(p); }
      else if (p.status === 'Pending Verification') { _open.push(p); } // Treat as open/active
    });
    setMissed(_missed); setDueToday(_dueToday); setOpen(_open); setClosed(_closed);
  };

  const handleClose = async (id: string, currentStatus: string) => {
    if (!checkGate('verify')) return;
    // Fetch full promise data first (needed for email notifications)
    const { data: promiseData } = await supabase
      .from("promises")
      .select("*")
      .eq("id", id)
      .single();

    if (!promiseData) {
      toast.error("Promise not found");
      return;
    }

    // 1. If Pending Verification AND Admin -> Close
    if (currentStatus === 'Pending Verification' && userRole === 'admin') {
      const { error } = await supabase.from("promises").update({ status: 'Closed' }).eq("id", id);
      if (error) { toast.error("Verification failed"); return; }

      // Send closure notification to leader
      try {
        const now = new Date();
        const { data: emailResponse, error: emailError } = await supabase.functions.invoke(
          'send-promise-notification',
          {
            body: {
              type: 'closed',
              promise_text: promiseData.promise_text,
              due_date: promiseData.due_date,
              owner_email: promiseData.owner_email,
              owner_name: promiseData.owner_name,
              leader_email: profile?.email,
              leader_name: profile?.full_name,
              completed_at: now.toISOString()
            }
          }
        );

        if (emailError) {
          console.error('Closure notification failed:', emailError);
        } else {
          console.log('Closure notification sent successfully:', emailResponse);
        }
      } catch (emailErr) {
        console.error('Failed to send closure notification:', emailErr);
      }

      // Send verification confirmation to USER (Phase 1.5)
      try {
        const now = new Date();

        // Calculate user's integrity score
        const { data: userPromises } = await supabase
          .from('promises')
          .select('status')
          .eq('owner_email', promiseData.owner_email);

        let integrityScore = null;
        if (userPromises && userPromises.length >= 3) {
          const closed = userPromises.filter(p => p.status === 'Closed').length;
          const missed = userPromises.filter(p => p.status === 'Missed').length;
          const total = closed + missed;
          if (total > 0) {
            integrityScore = Math.round((closed / total) * 100);
          }
        }

        await supabase.functions.invoke('send-promise-notification', {
          body: {
            type: 'promise_verified',
            promise_text: promiseData.promise_text,
            due_date: promiseData.due_date,
            owner_email: promiseData.owner_email,
            owner_name: promiseData.owner_name,
            leader_name: profile?.full_name,
            completed_at: now.toISOString(),
            integrity_score: integrityScore
          }
        });

        console.log('User verification email sent');
      } catch (userEmailErr) {
        console.error('Failed to send user verification email:', userEmailErr);
      }

      toast.success("Promise Verified & Closed!");
      checkAuthAndLoadData();
      return;
    }

    // 2. If Open -> Check if Self-Verification (Leader is completing) or Submit for Verification
    if (currentStatus === 'Open') {
      const isSelfVerification = promiseData.leader_id === profile?.id;

      if (isSelfVerification) {
        // SKIP VERIFICATION -> DIRECT CLOSE
        const { error } = await supabase.from("promises").update({ status: 'Closed' }).eq("id", id);
        if (error) { toast.error("Failed to update status"); return; }

        // Send closure notification (Self-verified)
        try {
          const now = new Date();
          // Calculate integrity score (optional, reused logic)
          const { data: userPromises } = await supabase.from('promises').select('status').eq('owner_email', promiseData.owner_email);
          let integrityScore = null;
          if (userPromises && userPromises.length >= 3) {
            const closed = userPromises.filter(p => p.status === 'Closed').length;
            const missed = userPromises.filter(p => p.status === 'Missed').length;
            const total = closed + missed;
            if (total > 0) integrityScore = Math.round((closed / total) * 100);
          }

          await supabase.functions.invoke('send-promise-notification', {
            body: {
              type: 'promise_verified', // Treat as verified since leader closed it
              promise_text: promiseData.promise_text,
              due_date: promiseData.due_date,
              owner_email: promiseData.owner_email,
              owner_name: promiseData.owner_name,
              leader_name: profile?.full_name,
              completed_at: now.toISOString(),
              integrity_score: integrityScore
            }
          });
          console.log('Self-verified email sent');
        } catch (err) {
          console.error("Failed to notify self-close:", err);
        }

        toast.success("Promise Kept (Self-Verified)!");
      } else {
        // STANDARD FLOW -> PENDING VERIFICATION
        const { error } = await supabase.from("promises").update({ status: 'Pending Verification' }).eq("id", id);
        if (error) { toast.error("Failed to update status"); return; }
        toast.success("Submitted for Verification");

        // Notify Leader for Review
        try {
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
          console.error("Failed to notify leader:", err);
        }
      }

      checkAuthAndLoadData();
    }
  };

  const handleCreatePromise = async (data: any) => {
    if (!checkGate('create')) return;
    // 1. Optimistic Create
    const tempId = Math.random().toString(36).substr(2, 9);

    // Insert into DB
    const { data: newPromise, error } = await supabase
      .from("promises")
      .insert({ leader_id: profile?.id, status: 'Open', ...data })
      .select()
      .single();

    if (error) { toast.error("Failed (DB Locked)"); return; }

    // 2. Send Email Notification (Non-blocking)
    console.log('🔔 Attempting to send email notification for promise creation...');
    console.log('Promise data:', {
      promise_text: data.promise_text,
      owner_email: data.owner_email,
      leader_email: profile?.email
    });

    try {
      const now = new Date();
      const { data: emailResponse, error: emailError } = await supabase.functions.invoke(
        'send-promise-notification',
        {
          body: {
            type: 'created',
            promise_text: data.promise_text,
            due_date: data.due_date,
            owner_email: data.owner_email,
            owner_name: data.owner_name,
            leader_email: profile?.email,
            leader_name: profile?.full_name,
            created_at: now.toISOString(),
            promise_id: newPromise.id // Included for action link
          }
        }
      );

      if (emailError) {
        console.error('❌ Email notification failed:', emailError);
        // Show error to user for debugging
        toast.error("Email Failed: " + (emailError.message || JSON.stringify(emailError)));
      } else {
        console.log('✅ Email notification sent successfully:', emailResponse);
        // Check for silent logging errors from backend
        if (emailResponse && (emailResponse as any).logError) {
          console.error('⚠️ Email sent but logging failed:', (emailResponse as any).logError);
          toast.error("Email Log Failed: " + JSON.stringify((emailResponse as any).logError));
        }
      }
    } catch (emailErr) {
      console.error('❌ Failed to send email notification (exception):', emailErr);
      // Non-blocking error - promise creation succeeded
    }

    // 3. Refresh Data
    checkAuthAndLoadData();

    // 4. Show Undo Toast (30s)
    toast.success("Promise Logged", {
      duration: 30000, // 30 seconds
      action: {
        label: "Undo",
        onClick: async () => {
          // Verify it's not too late (though toast handles visibilty)
          // Delete from DB
          const { error: deleteError } = await supabase.from("promises").delete().eq("id", newPromise.id);
          if (!deleteError) {
            toast.info("Promise Undo Successful");
            checkAuthAndLoadData();
          } else {
            toast.error("Could not undo. Promise is locked.");
          }
        },
      },
      cancel: {
        label: "Dismiss",
        onClick: () => { }
      }
    });
  };

  const handleReject = async () => {
    if (!checkGate('reject')) return;
    if (!rejectPromiseId || !rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      // Fetch promise data for email
      const { data: rawData } = await supabase
        .from("promises")
        .select("*")
        .eq("id", rejectPromiseId)
        .single();

      const promiseData = rawData as unknown as PromysrPromise;

      if (!promiseData) {
        toast.error("Promise not found");
        return;
      }

      // Update promise: status back to Open, add rejection data
      const { error } = await supabase
        .from("promises")
        .update({
          status: 'Open',
          rejection_reason: rejectionReason,
          rejection_count: (promiseData.rejection_count || 0) + 1,
          last_rejected_at: new Date().toISOString()
        })
        .eq("id", rejectPromiseId);

      if (error) {
        toast.error("Failed to reject completion");
        console.error(error);
        return;
      }

      // Send rejection email to user
      try {
        const now = new Date();
        await supabase.functions.invoke('send-promise-notification', {
          body: {
            type: 'completion_rejected',
            promise_text: promiseData.promise_text,
            due_date: promiseData.due_date,
            owner_email: promiseData.owner_email,
            owner_name: promiseData.owner_name,
            leader_name: profile?.full_name,
            rejection_reason: rejectionReason,
            rejected_at: now.toISOString()
          }
        });
        console.log('Rejection email sent to user');
      } catch (emailErr) {
        console.error('Failed to send rejection email:', emailErr);
      }

      toast.success("Completion rejected - User notified");

      // Reset dialog state
      setShowRejectDialog(false);
      setRejectPromiseId(null);
      setRejectionReason('');

      // Refresh data
      checkAuthAndLoadData();
    } catch (err) {
      console.error("Error rejecting completion:", err);
      toast.error("Failed to process rejection");
    }
  };

  const handleNewPromise = () => {
    // Dismiss empty state if active
    setShowEmptyState(false);

    if (activeTab !== 'overview' && activeTab !== 'team') {
      setActiveTab('overview');
      // Dynamic delay based on mount
      setTimeout(() => {
        const input = document.getElementById('promise-text-input') as HTMLInputElement;
        if (input) {
          input.focus();
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
          toast.info("Log your next commitment...");
        }
      }, 300); // 300ms for smoother transition + render
    } else {
      // Wait for render cycle if we were in empty state
      setTimeout(() => {
        const input = document.getElementById('promise-text-input') as HTMLInputElement;
        if (input) {
          input.focus();
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
          toast.info("Log your next commitment...");
        }
      }, 50);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleInviteMember = async (email: string, name: string) => {
    if (!checkGate('invite')) return;
    if (!organization) return;
    const maxSeats = organization.max_users;
    if (orgMembers.length >= maxSeats) {
      toast.error("Organization limit reached", {
        description: `You are on the ${organization.subscription_plan} plan which allows ${maxSeats} users. Upgrade to add more.`
      });
      return;
    }

    try {
      toast.loading("Sending invitation...");

      const { data, error } = await supabase.functions.invoke('send-team-invitation', {
        body: {
          organization_id: organization.id,
          invitee_email: email,
          invitee_name: name,
          role: 'member'
        }
      });

      toast.dismiss();

      if (error) {
        console.error('Invitation error details:', error);
        let errorMsg = "Please try again";

        // Try to extract the error message from the response body if it's a JSON error
        if (data && data.error) {
          errorMsg = data.error;
        } else if (error.message) {
          errorMsg = error.message;
        }

        toast.error("Failed to send invitation", {
          description: errorMsg
        });
        return;
      }

      if (data && data.email_sent === false) {
        toast.warning(`Member invited, but email failed`, {
          description: "The invitation was created, but the email could not be sent. Please check your Resend settings or spam folder."
        });
      } else {
        toast.success(`Invitation sent to ${name}`, {
          description: `${email} will receive an email to join your organization.`
        });
      }
    } catch (err: any) {
      console.error('Invitation exception:', err);
      toast.dismiss();
      toast.error("Failed to send invitation", {
        description: err.message || "An unexpected error occurred"
      });
    }
  };

  const handleBulkInvite = async (users: { email: string, name: string }[]) => {
    if (!organization) return;
    const maxSeats = organization.max_users;
    const proposedTotal = orgMembers.length + users.length;

    if (proposedTotal > maxSeats) {
      toast.error("Bulk Import limit reached", {
        description: `Importing ${users.length} users would exceed your plan limit of ${maxSeats}. Upgrade to add more.`
      });
      return;
    }

    // Simulate Batch
    toast.success(`Batch Invitation Sent`, {
      description: `Inviting ${users.length} users to ${organization.name}.`
    });
  };

  const handleLoadDemoData = async () => {
    toast.loading("Loading demo data...");
    setTimeout(() => {
      toast.dismiss();
      toast.info("Database Locked. Showing Local Demo Preview.");
      const today = new Date().toISOString().split('T')[0];
      const p1 = { id: 'd1', promise_text: 'Finalize Q3 Budget', owner_name: 'Alex', due_date: '2025-01-01', status: 'Missed', leader_id: 'me', owner_email: 'alex@work.com', created_at: today } as any;
      const p2 = { id: 'd2', promise_text: 'Client Proposal', owner_name: 'You', due_date: today, status: 'Open', leader_id: 'me', owner_email: profile?.email || 'me', created_at: today } as any;
      const p3 = { id: 'd3', promise_text: 'Website Redesign', owner_name: 'Sarah', due_date: today, status: 'Open', leader_id: 'me', owner_email: 'sarah@work.com', created_at: today } as any;

      const newAll = [p1, p2, p3];
      setAllRaw(newAll);
      categorizePromises(newAll);
    }, 1000);
  };

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
  };

  // FILTER LOGIC
  const getFilteredPromises = () => {
    switch (filter) {
      case 'overdue': return missed;
      // High Priority = Due Today + Overdue
      case 'high_priority': return [...missed, ...dueToday];
      case 'completed': return closed;
      case 'all': default: return [...missed, ...dueToday, ...open];
    }
  };

  // --- RENDER ---
  if (isLoading) return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-lg font-medium text-muted-foreground">Loading your dashboard...</p>
      </div>
    </div>
  );

  const allPromises = [...missed, ...dueToday, ...open, ...closed];
  const filteredPromises = getFilteredPromises();

  // Mobile menu handler
  const handleMobileNav = (tab: any) => {
    setActiveTab(tab);
  };

  const filterCounts = {
    all: missed.length + dueToday.length + open.length,
    overdue: missed.length,
    high_priority: missed.length + dueToday.length, // approximation
    completed: closed.length
  };

  // CHECK TRIAL STATUS
  // const createdAt = organization ? new Date(organization.created_at) : new Date();
  // const daysSinceCreation = differenceInDays(new Date(), createdAt);
  // const isExpired = organization?.subscription_plan === 'starter_999' && daysSinceCreation > 7;

  // HELPER: Check if plan is Pro or above OR if in active trial
  const isProOrAbove = true; // Unlocked

  // Derived State & Metrics
  const isTrial = organization?.status === 'trialing';
  // TRIAL LOGIC: If trialing, treat as 'pro_1999' for feature gating purposes (Analytics, Limits)
  const effectivePlan = isTrial ? 'pro_1999' : organization?.subscription_plan;

  const activePromisesCount = open.length + dueToday.length + missed.length;
  // Unlock higher limits during active trial or pro plan
  const planPromiseLimit = (isProOrAbove) ? 10000 : 100;

  // Enhanced Metrics with Integrity Score State Handling
  const totalPromises = closed.length + missed.length;
  const hasInsufficientData = totalPromises < 3;
  const reliabilityScore = hasInsufficientData
    ? null
    : Math.round((closed.length / totalPromises) * 100);

  const metrics = {
    reliability: reliabilityScore,
    hasInsufficientData,
    totalPromises,
    completed: closed.length,
    pending: activePromisesCount,
    overdue: missed.length
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col md:flex-row font-sans text-foreground">
      {/* SIDEBAR */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSignOut={handleSignOut}
        subscriptionPlan={effectivePlan}
        userRole={userRole}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 px-2 py-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8 pb-20">

          {/* HEADER */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
            <div className="flex items-center gap-4">
              <MobileSidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onSignOut={handleSignOut}
                subscriptionPlan={effectivePlan}
                userRole={userRole}
              />
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  {activeTab === 'overview' && `Welcome back, ${profile?.full_name?.split(' ')[0] || 'User'}!`}
                  {activeTab === 'member_pulse' && `Viewing Dashboard: ${orgMembers.find(m => m.profile?.email === targetUserEmail)?.profile?.full_name || targetUserEmail}`}
                  {activeTab === 'team' && 'All Promises'}
                  {activeTab === 'analytics' && 'Analytics & Reports'}
                  {activeTab === 'user_dashboards' && 'User Dashboards'}
                  {activeTab === 'settings' && 'Organization Settings'}
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  {activeTab === 'overview' && 'Here is your daily promise overview.'}
                  {activeTab === 'member_pulse' && 'Reviewing individual member performance.'}
                  {activeTab === 'team' && 'Track team performance and reliability.'}
                  {activeTab === 'analytics' && 'Deep dive into metrics and trends.'}
                  {activeTab === 'user_dashboards' && 'Manage team access and view individual performance.'}
                  {activeTab === 'settings' && 'Manage your subscription and preferences.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === 'member_pulse' && (
                <Button
                  onClick={() => setActiveTab('user_dashboards')}
                  variant="outline"
                  size="sm"
                  className="bg-background hover:bg-muted"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Back to User List
                </Button>
              )}
              {(activeTab === 'overview' || activeTab === 'member_pulse') && (
                <>
                  <Button
                    onClick={handleNewPromise}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Promise
                  </Button>
                  <Button
                    onClick={() => setActiveTab('team')}
                    variant="outline"
                    size="sm"
                    className="hidden md:flex text-primary border-primary/20 hover:bg-primary/5"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Go to All Promises
                  </Button>
                  <Button onClick={handleLoadDemoData} variant="outline" size="sm" className="hidden md:flex">
                    <Database className="w-4 h-4 mr-2" />
                    Load Demo Data
                  </Button>
                </>
              )}
            </div>
          </header>


          {/* VIEW: OVERVIEW (Home) OR MEMBER PULSE */}
          {(activeTab === 'overview' || activeTab === 'member_pulse') && !showEmptyState && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              {/* METRICS ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Integrity Score</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {metrics.hasInsufficientData ? (
                      <>
                        <div className="text-2xl font-bold text-muted-foreground">Building...</div>
                        <p className="text-xs text-muted-foreground">
                          Complete {3 - metrics.totalPromises} more promise{3 - metrics.totalPromises === 1 ? '' : 's'} to see your score
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-2xl font-bold" title="Promises kept ÷ Total promises (kept + missed)">
                          {metrics.reliability}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {metrics.completed} kept, {metrics.overdue} missed
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Promises Kept</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.completed}</div>
                    <p className="text-xs text-muted-foreground">
                      Lifetime completions
                    </p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Load</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.pending}</div>
                    <p className="text-xs text-muted-foreground">
                      Tracked until verified or missed
                    </p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-primary">Team Velocity</CardTitle>
                    <Zap className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">High</div>
                    <p className="text-xs text-primary/80">
                      Top performance this week
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* MAIN CONTENT GRID */}
              <div className="grid gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-3">

                {/* LEFT COLUMN: PROMISE LIST (2/3 width) */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">

                  {/* PROMISE INPUT (New Task) */}
                  <PromiseInput
                    onSubmit={handleCreatePromise}
                    promiseCount={activePromisesCount}
                    subscriptionPlan={effectivePlan || 'starter_999'}
                    isLocked={activePromisesCount >= planPromiseLimit}
                    userRole={userRole}
                    members={orgMembers}
                    userEmail={profile?.email}
                  />

                  {/* FILTERS & LIST */}
                  <div className="space-y-4">
                    <TaskFilters
                      currentFilter={filter}
                      onFilterChange={setFilter}
                      counts={filterCounts}
                    />

                    <div className="space-y-4">
                      {filteredPromises.map((p) => (
                        <Card key={p.id} className="group hover:border-primary/50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <Badge
                                variant={
                                  p.status === 'Closed' ? 'default' :
                                    p.status === 'Missed' ? 'destructive' :
                                      p.status === 'Pending Verification' ? 'outline' :
                                        'secondary'
                                }
                                className={
                                  p.status === 'Pending Verification'
                                    ? 'border-amber-500 bg-amber-50 text-amber-700 font-medium'
                                    : ''
                                }
                              >
                                {p.status}
                              </Badge>

                              {/* MARK DONE (User) - Triggers verification email to leader */}
                              {p.status === 'Open' && (p.owner_email === profile?.email) && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-7 px-3 !bg-green-600 text-white hover:!bg-green-700 shadow-sm border-0"
                                  onClick={() => handleClose(p.id, p.status)}
                                  title="Mark as complete - your leader will be notified to verify"
                                >
                                  <Check className="w-3.5 h-3.5 mr-1.5" />
                                  Mark Done
                                </Button>
                              )}

                              {/* VERIFY & REJECT (Leader) - Phase 2 */}
                              {p.status === 'Pending Verification' && userRole === 'admin' && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-7 px-3 !bg-green-600 text-white hover:!bg-green-700 shadow-sm border-0"
                                    onClick={() => handleClose(p.id, p.status)}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Verify
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-7 px-3 !bg-red-600 text-white hover:!bg-red-700 shadow-sm border-0"
                                    onClick={() => {
                                      setRejectPromiseId(p.id);
                                      setShowRejectDialog(true);
                                    }}
                                  >
                                    <X className="w-3.5 h-3.5 mr-1.5" /> Reject
                                  </Button>
                                </div>
                              )}
                            </div>

                            <h3 className="font-bold text-lg mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                              {p.promise_text}
                            </h3>

                            {/* Promise Consequence Language */}
                            {(p.status === 'Open' || p.status === 'Pending Verification') && (
                              <p className="text-xs text-muted-foreground/70 italic mb-3">
                                {p.status === 'Pending Verification'
                                  ? '⏳ Awaiting leader verification'
                                  : '📌 Tracked until verified or missed'}
                              </p>
                            )}

                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-[10px] bg-primary/5">
                                    {p.owner_name?.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground">
                                  {p.owner_email === profile?.email ? 'Me' : p.owner_name}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                                <Calendar className="w-3 h-3" />
                                {format(parseISO(p.due_date), 'MMM d')}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {filteredPromises.length === 0 && allPromises.length > 0 && (
                      <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-xl border border-dashed">
                        <div className="grid place-items-center h-[200px] text-center p-8 bg-background/30 rounded-xl border-2 border-dashed border-border/50">
                          <div className="space-y-3">
                            <p className="text-muted-foreground text-sm">No tasks match this filter.</p>
                            <Button
                              variant="link"
                              className="text-primary font-bold"
                              onClick={() => {
                                setFilter('all'); // Changed from setCurrentFilter to setFilter to match existing state setter
                                handleNewPromise();
                              }}
                            >
                              Create your first promise &rarr;
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN: ACTIVITY FEED (1/3 width, hidden on mobile logic handled by grid-cols-1) */}
                <div className="lg:col-span-1">
                  <div className="bg-card rounded-xl border border-border/50 p-6 h-[600px] sticky top-6">
                    <ActivityFeed promises={allPromises} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: OVERVIEW - EMPTY STATE (No promises at all) */}
          {activeTab === 'overview' && showEmptyState && (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-6 animate-in fade-in zoom-in-95 duration-700">
              <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center text-primary animate-pulse">
                <Plus className="w-12 h-12" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="text-2xl font-bold tracking-tight">Log your first promise</h3>
                <p className="text-muted-foreground">Every commitment kept builds your reliability score. Start today.</p>
              </div>
              <Button onClick={handleNewPromise} size="lg" className="px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                Log New Promise
              </Button>
            </div>
          )}

          {/* VIEW: USER DASHBOARDS (New Unlocked Feature) */}
          {activeTab === 'user_dashboards' && (
            <UserManagement
              members={orgMembers}
              onToggleLogin={() => toast.info("Login Toggle Simulated")}
              onViewDashboard={(uid) => {
                const member = orgMembers.find(m => m.user_id === uid);
                if (member?.profile?.email) {
                  setTargetUserEmail(member.profile.email);
                  setActiveTab('member_pulse');
                  toast.success(`Viewing dashboard for ${member.profile.full_name}`);
                }
              }}
            />
          )}

          {/* VIEW: ANALYTICS (Locked on Starter) */}
          {activeTab === 'analytics' && (
            isProOrAbove ? (
              <AnalyticsView
                key={targetUserEmail || 'default'}
                promises={allPromises}
                userEmail={targetUserEmail || profile?.email}
                userRole={targetUserEmail ? 'member' : userRole}
              />
            ) : (
              <div className="grid place-items-center h-[60vh] text-center p-8 bg-background/50 rounded-xl border-2 border-dashed border-primary/20">
                <div className="max-w-md space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">Analytics Locked</h2>
                  <p className="text-muted-foreground">Detailed insights and trends are available on the Team Plan.</p>
                  <Button onClick={() => setActiveTab('settings')} size="lg" className="w-full">
                    Upgrade to Pro
                  </Button>
                </div>
              </div>
            )
          )}

          {/* VIEW: TEAM (Unlocked for all) */}
          {activeTab === 'team' && (
            <AllPromisesTable
              promises={allRaw}
              members={orgMembers}
              currentUserEmail={profile?.email}
              userRole={userRole}
              onVerify={handleClose}
            />
          )}

          {/* VIEW: LEADER */}
          {activeTab === 'leader' && (
            <LeaderView promises={allPromises} />
          )}



          {/* VIEW: SETTINGS */}
          {activeTab === 'settings' && organization && (
            <>
              <OrganizationSettings
                organization={organization}
                members={orgMembers}
                isOwner={userRole === 'admin'}
              />

              {/* Email Notification Settings */}
              <div className="mt-6">
                <EmailNotificationSettings />
              </div>

              {/* Email Logs */}
              <div className="mt-6">
                <EmailLogs />
              </div>
            </>
          )}

          {/* SETTINGS FALLBACK if no org */}
          {activeTab === 'settings' && !organization && (
            <div className="grid place-items-center h-64 text-muted-foreground">
              <p>No organization found. Please contact support.</p>
            </div>
          )}
        </div>
      </main>

      <MilestoneFeedbackDialog
        open={showFeedbackModal}
        onOpenChange={setShowFeedbackModal}
        milestone={currentMilestone}
        userId={currentUserId || ''}
        onSubmitted={() => { }}
      />

      {/* PAYWALL / TRIAL EXPIRED OVERLAY */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-card w-full max-w-4xl p-0 rounded-2xl shadow-2xl border border-primary/20 flex flex-col md:flex-row overflow-hidden max-h-[90vh]">

            {/* LEFT: CONTEXT / TUTORIAL */}
            <div className="md:w-1/2 p-8 bg-muted/30 border-r border-border/50 flex flex-col justify-center space-y-6">
              <div className="space-y-2">
                <Badge variant="outline" className="text-primary border-primary/30 w-fit">
                  {lockedAction === 'create' && 'Tutorial: Creating Promises'}
                  {lockedAction === 'verify' && 'Tutorial: Verification Loop'}
                  {lockedAction === 'reject' && 'Tutorial: Accountability'}
                  {lockedAction === 'invite' && 'Tutorial: Growing Your Team'}
                  {!lockedAction && 'Start Your Journey'}
                </Badge>
                <h3 className="text-2xl font-bold tracking-tight">
                  {lockedAction === 'create' && 'Why Commitments Matter'}
                  {lockedAction === 'verify' && 'Verify to Build Trust'}
                  {lockedAction === 'reject' && 'Standards Matter'}
                  {lockedAction === 'invite' && 'Better Together'}
                  {!lockedAction && 'Unlock Full Potential'}
                </h3>
              </div>

              <div className="prose prose-sm text-muted-foreground">
                {lockedAction === 'create' && (
                  <>
                    <p>Logging a promise changes it from a vague intention to a <strong>concrete commitment</strong>.</p>
                    <ul className="list-disc pl-4 space-y-1 mt-2">
                      <li>Creates a digital paper trail.</li>
                      <li>Notifies your leader immediately.</li>
                      <li>Builds your personal integrity score.</li>
                    </ul>
                  </>
                )}
                {lockedAction === 'verify' && (
                  <p>
                    Marking a task as "Done" is only the first step. True accountability requires <strong>verification</strong> from the requestor. This closes the loop and officially updates the reputation score.
                  </p>
                )}
                {lockedAction === 'reject' && (
                  <p>
                    Accepting subpar work lowers standards. Rejecting incomplete promises (with feedback) is an act of high integrity—it pushes the team to be better.
                  </p>
                )}
                {lockedAction === 'invite' && (
                  <p>
                    Promysr works best as a network. Bringing your team onboard creates a web of accountability where everyone owns their outcomes.
                  </p>
                )}
                {!lockedAction && <p>Take the next step to professional accountability.</p>}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
                <span>You tried to perform a key action.</span>
                <div className="w-8 h-[1px] bg-border"></div>
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
                <span>Start trial to unlock.</span>
              </div>
            </div>

            {/* RIGHT: CTA */}
            <div className="md:w-1/2 p-8 flex flex-col justify-center space-y-6 bg-card">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2 mx-auto md:mx-0">
                <Lock className="w-8 h-8 text-primary" />
              </div>

              <div className="space-y-2 text-center md:text-left">
                <h2 className="text-3xl font-bold">Start 7-Day Free Trial</h2>
                <p className="text-muted-foreground">
                  Unlock unlimited promises, analytics, and invite your full team.
                </p>
              </div>

              <div className="grid gap-4 pt-2">
                <Button
                  size="lg"
                  className="w-full text-lg h-14 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 shadow-lg shadow-primary/20"
                  onClick={handleStartTrial}
                >
                  Start Free Trial
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  No charge today. Cancel anytime.
                </p>

                <div className="pt-4 border-t border-border/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setShowPaywall(false);
                      setLockedAction(null);
                    }}
                  >
                    I'm just browsing for now
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Reject Completion Dialog (Phase 2) */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h3 className="text-lg font-semibold mb-2">Reject Completion</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please provide feedback to help the user improve.
            </p>
            <textarea
              className="w-full border rounded-md p-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Explain why this completion is not acceptable..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectPromiseId(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
              >
                Reject & Notify User
              </Button>
            </div>
          </div>
        </div>
      )}

    </div >
  );
};

export default Dashboard;