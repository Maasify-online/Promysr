import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    // This function is meant to be called by a CRON JOB (e.g., 8 AM)
    // curl -X POST .../functions/v1/send-morning-brief -H "Authorization: Bearer SERVICE_KEY"

    try {
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
        const today = new Date().toISOString().split('T')[0]

        // 1. FETCH ALL ACTIVE PROMISES
        const { data: promises, error } = await supabase
            .from('promises')
            .select('*')
            .in('status', ['Open', 'Missed']) // Brief on active or recently missed
            .lte('due_date', today) // Due today or earlier (overdue)

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
            // Find user ID from email if not provided (inefficient but safe for now)
            // Better: We should have mapped email->ID earlier.
            // Let's use the profileMap from Step 3.
            // We need to inverse map or iterate.

            // Optimization: Since we have profileMap (ID -> Profile), let's find ID by Email
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

        // 4. SEND EMAILS (Batched)

        // A. Send Doer Briefs
        for (const [email, tasks] of doerMap.entries()) {
            if (!checkPref(email, 'daily_digest')) {
                console.log(`Skipping Daily Digest for ${email} (Preference Off)`);
                continue;
            }

            const taskList = tasks.map((t: any) => `- ${t.promise_text} (${t.status})`).join('\n');
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
                body: JSON.stringify({
                    from: 'PromySr <noreply@mail.promysr.com>', // Custom domain email
                    to: [email],
                    subject: `☀️ Morning Brief: ${tasks.length} Priorities`,
                    text: `Good Morning,\n\nYou have ${tasks.length} commitments requiring attention today:\n\n${taskList}\n\nLogin to close them: ${APP_URL}/dashboard`
                })
            });
            if (!res.ok) console.error(`Resend Error (Doer): ${res.status} ${await res.text()}`);
        }

        // B. Send Leader Radars
        for (const [email, tasks] of leaderMap.entries()) {
            if (!checkPref(email, 'team_activity')) { // Assuming Leader Radar counts as Team Activity
                console.log(`Skipping Leader Radar for ${email} (Preference Off)`);
                continue;
            }

            const teamList = tasks.map((t: any) => `- ${t.owner_name}: ${t.promise_text} (${t.status})`).join('\n');
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
                body: JSON.stringify({
                    from: 'PromySr <noreply@mail.promysr.com>', // Custom domain email
                    to: [email],
                    subject: `👑 Leader Radar: ${tasks.length} Team Risks`,
                    text: `Leader Briefing,\n\nYour team has ${tasks.length} items due today or overdue:\n\n${teamList}\n\nCheck the Leader Command Center: ${APP_URL}/dashboard`
                })
            });
            if (!res.ok) console.error(`Resend Error (Leader): ${res.status} ${await res.text()}`);
        }

        return new Response(JSON.stringify({
            sent_doer_emails: doerMap.size,
            sent_leader_emails: leaderMap.size
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
    }
})
