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

        // Check if we're sending to a specific user
        const body = req.method === 'POST' ? await req.json() : {}
        const targetUserEmail = body.userEmail || null

        // 1. FETCH ALL ACTIVE PROMISES
        let query = supabase
            .from('promises')
            .select('*')
            .in('status', ['Open', 'Missed']) // Brief on active or recently missed
            .lte('due_date', today) // Due today or earlier (overdue)

        // If targeting specific user, filter by their email
        if (targetUserEmail) {
            query = query.eq('owner_email', targetUserEmail)
        }

        const { data: promises, error } = await query

        if (error || !promises) throw error

        // 2. GROUP FOR DOERS (My Tasks)
        const doerMap = new Map<string, any[]>();
        promises.forEach(p => {
            if (!doerMap.has(p.owner_email)) doerMap.set(p.owner_email, []);
            doerMap.get(p.owner_email).push(p);
        });

        // 3. GROUP FOR LEADERS (Team Radar)
        // We need leader emails. We have leader_id (user_id).
        // Let's get all profiles to map IDs to Emails
        const { data: profiles } = await supabase.from('profiles').select('id, email, full_name');
        const profileMap = new Map(profiles?.map(p => [p.id, p]));

        const leaderMap = new Map<string, any[]>();
        promises.forEach(p => {
            const leaderProfile = profileMap.get(p.leader_id);
            if (leaderProfile && leaderProfile.email) {
                // Only notify leader if they are NOT the owner (don't double notify for self-assigned)
                if (leaderProfile.email !== p.owner_email) {
                    if (!leaderMap.has(leaderProfile.email)) leaderMap.set(leaderProfile.email, []);
                    leaderMap.get(leaderProfile.email).push(p);
                }
            }
        });

        // 3.5 FETCH PREFERENCES
        const { data: preferences } = await supabase.from('email_notification_settings').select('*');
        const prefMap = new Map(preferences?.map(p => [p.user_id, p]));

        // Helper to check preference (Default TRUE)
        const checkPref = (email: string, key: string, userId?: string) => {
            let uid = userId;
            if (!uid) {
                for (const [id, prof] of profileMap.entries()) {
                    if (prof.email === email) { uid = id; break; }
                }
            }

            if (!uid) return true; // Default to true if user not found (safe fallback)

            const settings = prefMap.get(uid);
            if (!settings) return true; // Default to true if no settings row
            return settings[key] === true;
        }

        // 4. SEND EMAILS (Batched) - NOW USING HTML TEMPLATES

        // A. Send Doer Briefs (Using shared template)
        for (const [email, tasks] of doerMap.entries()) {
            if (!checkPref(email, 'daily_brief_enabled')) {
                console.log(`Skipping Daily Digest for ${email} (Preference Off)`);
                continue;
            }

            // Get owner name from profile
            const ownerProfile = Array.from(profileMap.values()).find(p => p.email === email);

            // Format tasks for template
            const formattedTasks = tasks.map((t: any) => ({
                text: t.promise_text,
                due_time: t.due_time || 'EOD',
                status: t.status
            }));

            // Use shared email template
            const { subject, html } = getEmailTemplate('due-today', {
                owner_name: ownerProfile?.full_name || 'User',
                tasks: formattedTasks
            });

            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
                body: JSON.stringify({
                    from: 'PromySr <noreply@mail.promysr.com>',
                    to: [email],
                    subject: subject,
                    html: html
                })
            });
            if (!res.ok) console.error(`Resend Error (Doer): ${res.status} ${await res.text()}`);
            else {
                try {
                    await supabase.from('emails_log').insert({
                        email_type: 'daily_brief',
                        recipient_email: email,
                        subject: subject,
                        status: 'sent',
                        sent_at: new Date().toISOString()
                    });
                } catch (e) { console.error('Log Error:', e); }
            }
        }

        // B. Send Leader Radars (Now using HTML template)
        for (const [email, tasks] of leaderMap.entries()) {
            // Check LEADER preference (separate from user daily brief)
            if (!checkPref(email, 'leader_daily_radar_enabled')) {
                console.log(`Skipping Leader Radar for ${email} (Leader Preference Off)`);
                continue;
            }

            // Get leader name from profile
            const leaderProfile = Array.from(profileMap.values()).find(p => p.email === email);

            // Format tasks for template
            const formattedTeamTasks = tasks.map((t: any) => ({
                owner_name: t.owner_name,
                promise_text: t.promise_text,
                status: t.status,
                due_date: t.due_date
            }));

            // Use shared email template
            const { subject, html } = getEmailTemplate('leader_daily_radar', {
                leader_name: leaderProfile?.full_name || 'Leader',
                team_risk_count: tasks.length,
                team_tasks: formattedTeamTasks
            });

            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
                body: JSON.stringify({
                    from: 'PromySr <noreply@mail.promysr.com>',
                    to: [email],
                    subject: subject,
                    html: html
                })
            });
            if (!res.ok) console.error(`Resend Error (Leader): ${res.status} ${await res.text()}`);
            else {
                try {
                    await supabase.from('emails_log').insert({
                        email_type: 'leader_daily_radar',
                        recipient_email: email,
                        subject: subject,
                        status: 'sent',
                        sent_at: new Date().toISOString()
                    });
                } catch (e) { console.error('Log Error:', e); }
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
