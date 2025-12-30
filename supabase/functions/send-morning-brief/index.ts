import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getEmailTemplate } from '../_shared/emailTemplates.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const APP_URL = Deno.env.get('APP_URL') || 'https://promysr.vercel.app'

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    // This function can be called by:
    // 1. CRON JOB (sends to all users)
    // 2. Scheduler with specific userEmail (sends to one user)

    try {
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
        const today = new Date().toISOString().split('T')[0]

        // Check for specific targeting
        const body = req.method === 'POST' ? await req.json() : {}
        const targetEmail = body.userEmail || null
        const scope = body.scope || 'all' // 'user', 'leader', 'all'

        // 1. FETCH ALL ACTIVE PROMISES
        let query = supabase
            .from('promises')
            .select('*')
            .in('status', ['Open', 'Missed'])
            .lte('due_date', today)

        // FILTERING BASED ON SCOPE
        if (targetEmail) {
            if (scope === 'leader') {
                // If targeting a leader, we need their user_id first
                const { data: leaderProfile } = await supabase.from('profiles').select('id').eq('email', targetEmail).single();
                if (leaderProfile) {
                    query = query.eq('leader_id', leaderProfile.id);
                } else {
                    console.error(`Leader profile not found for ${targetEmail}`);
                }
            } else {
                // Default 'user' or 'all' treats specific email as owner
                query = query.eq('owner_email', targetEmail);
            }
        }

        const { data: promises, error } = await query
        if (error || !promises) throw error

        // PRE-FETCH PROFILES (Optimization: only fetch needed profiles if filtered)
        // For simplicity, we stick to fetching all or refined set.
        const { data: profiles } = await supabase.from('profiles').select('id, email, full_name');
        const profileMap = new Map(profiles?.map(p => [p.id, p]));
        const prefMap = new Map(); // Prefs will be fetched lazily or handled below

        // 2. GROUPING
        // We build maps regardless, but only populate relevant ones based on scope
        // This is cheaper than complex branching logic given small dataset

        const doerMap = new Map<string, any[]>();
        const leaderMap = new Map<string, any[]>();

        promises.forEach(p => {
            // Populate Doer Map (If scope is 'user' or 'all')
            if (scope === 'user' || scope === 'all') {
                if (!doerMap.has(p.owner_email)) doerMap.set(p.owner_email, []);
                doerMap.get(p.owner_email).push(p);
            }

            // Populate Leader Map (If scope is 'leader' or 'all')
            if (scope === 'leader' || scope === 'all') {
                const leaderProfile = profileMap.get(p.leader_id);
                if (leaderProfile && leaderProfile.email) {
                    // Don't notify self-assigned leader
                    if (leaderProfile.email !== p.owner_email) {
                        if (!leaderMap.has(leaderProfile.email)) leaderMap.set(leaderProfile.email, []);
                        leaderMap.get(leaderProfile.email).push(p);
                    }
                }
            }
        });

        // 3. FETCH PREFERENCES
        const { data: preferences } = await supabase.from('email_notification_settings').select('*');
        preferences?.forEach(p => prefMap.set(p.user_id, p));

        // Helper to check preference
        const checkPref = (email: string, key: string) => {
            let uid = undefined;
            for (const [id, prof] of profileMap.entries()) {
                if (prof.email === email) { uid = id; break; }
            }
            if (!uid) return true;
            const settings = prefMap.get(uid);
            if (!settings) return true;
            return settings[key] === true;
        }

        // 4. SEND EMAILS

        // A. Send Doer Briefs (Only if scope covers it)
        if (scope === 'user' || scope === 'all') {
            for (const [email, tasks] of doerMap.entries()) {
                if (!checkPref(email, 'daily_brief_enabled')) {
                    console.log(`Skipping Daily Digest for ${email} (Preference Off)`);
                    continue;
                }
                const ownerProfile = Array.from(profileMap.values()).find(p => p.email === email);
                const formattedTasks = tasks.map((t: any) => ({
                    text: t.promise_text,
                    due_time: t.due_time || 'EOD',
                    status: t.status
                }));
                const { subject, html } = getEmailTemplate('due-today', {
                    owner_name: ownerProfile?.full_name || 'User',
                    tasks: formattedTasks
                });

                await sendEmail(email, subject, html, 'daily_brief');
            }
        }

        // B. Send Leader Radars (Only if scope covers it)
        if (scope === 'leader' || scope === 'all') {
            for (const [email, tasks] of leaderMap.entries()) {
                if (!checkPref(email, 'leader_daily_radar_enabled')) {
                    console.log(`Skipping Leader Radar for ${email} (Leader Preference Off)`);
                    continue;
                }
                const leaderProfile = Array.from(profileMap.values()).find(p => p.email === email);
                const formattedTeamTasks = tasks.map((t: any) => ({
                    owner_name: t.owner_name,
                    promise_text: t.promise_text,
                    status: t.status,
                    due_date: t.due_date
                }));
                const { subject, html } = getEmailTemplate('leader_daily_radar', {
                    leader_name: leaderProfile?.full_name || 'Leader',
                    team_risk_count: tasks.length,
                    team_tasks: formattedTeamTasks
                });

                await sendEmail(email, subject, html, 'leader_daily_radar');
            }
        }

        // Helper function for sending
        async function sendEmail(to: string, subject: string, html: string, type: string) {
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
                body: JSON.stringify({
                    from: 'PromySr <noreply@mail.promysr.com>',
                    to: [to],
                    subject: subject,
                    html: html
                })
            });
            if (!res.ok) console.error(`Resend Error (${type}): ${res.status} ${await res.text()}`);
            else {
                const { error: logError } = await supabase.from('emails_log').insert({
                    email_type: type,
                    recipient_email: to,
                    subject: subject,
                    status: 'sent',
                    sent_at: new Date().toISOString()
                });
                if (logError) console.error('Log Error:', logError);
            }
        }

        return new Response(JSON.stringify({
            sent_doer_emails: doerMap.size,
            sent_leader_emails: leaderMap.size
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
    }
})
