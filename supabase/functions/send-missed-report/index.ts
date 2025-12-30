import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getEmailTemplate } from '../_shared/emailTemplates.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Parse Request Body for Targeting
        const body = req.method === 'POST' ? await req.json() : {};
        const targetUserEmail = body.userEmail || null;
        const scope = body.scope || 'all'; // 'user', 'leader', 'all'

        // Resolve Target ID if needed
        let targetUserId = null;
        if (targetUserEmail) {
            const { data: uProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', targetUserEmail)
                .single();
            targetUserId = uProfile?.id;
        }

        // 1. Calculate Target Date (Yesterday IST)
        // Runs at 10 AM IST (04:30 UTC). We want promises missed "Yesterday".
        // 04:30 UTC today maps to 10:00 AM IST. 
        // "Yesterday" ended 10 hours ago.
        // We want to fetch all promises with status='Missed' and due_date = Yesterday (IST).

        const now = new Date();
        // Move back 24 hours to get "yesterday" relative to this morning run
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Format to YYYY-MM-DD in IST
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const targetDateStr = formatter.format(yesterday);

        console.log(`Sending reports for Missed Promises due on: ${targetDateStr} (IST) [Scope: ${scope}, Target: ${targetUserEmail || 'ALL'}]`);

        // 2. Fetch Missed Promises
        let query = supabase
            .from('promises')
            .select('*')
            .eq('status', 'Missed')
            .eq('due_date', targetDateStr);

        // Apply Targeting Filter
        if (targetUserEmail && targetUserId) {
            query = query.or(`owner_email.eq.${targetUserEmail},leader_id.eq.${targetUserId}`)
        }

        const { data: missedPromises, error } = await query;

        if (error) throw error;

        if (!missedPromises || missedPromises.length === 0) {
            console.log('No missed promises found for report.');
            return new Response(JSON.stringify({ message: 'No missed promises found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 3. Grouping
        const leaderMap = new Map();
        const ownerMap = new Map();
        const profileMap = new Map();

        // Collect Profiles
        const allUserIds = new Set(missedPromises.map(p => p.leader_id));
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .in('id', Array.from(allUserIds));

        profiles?.forEach(p => profileMap.set(p.id, p));

        missedPromises.forEach(p => {
            // Group Leader (if target matches leader)
            if (!targetUserId || p.leader_id === targetUserId) {
                const leader = profileMap.get(p.leader_id);
                if (leader) {
                    if (!leaderMap.has(leader.email)) {
                        leaderMap.set(leader.email, { name: leader.full_name, tasks: [] });
                    }
                    leaderMap.get(leader.email).tasks.push(p);
                }
            }

            // Group Owner (if target matches owner)
            if (!targetUserEmail || p.owner_email === targetUserEmail) {
                if (!ownerMap.has(p.owner_email)) {
                    ownerMap.set(p.owner_email, { name: p.owner_name, tasks: [] });
                }
                ownerMap.get(p.owner_email).tasks.push(p);
            }
        });

        // 4. Send Emails (Scoped)
        let sentCount = 0;

        // A. Send to Leaders (Scope: 'leader' or 'all')
        if (scope === 'leader' || scope === 'all') {
            for (const [email, data] of leaderMap.entries()) {
                // If targeting, redundant check but safe
                if (targetUserEmail && email !== targetUserEmail) continue;

                const { subject, html } = getEmailTemplate('missed_digest_leader', {
                    leader_name: data.name,
                    missed_date: targetDateStr,
                    tasks: data.tasks.map((t: any) => ({
                        text: t.promise_text,
                        owner: t.owner_name
                    }))
                });

                await sendEmail(email, subject, html);
                sentCount++;
            }
        }

        // B. Send to Owners (Scope: 'user' or 'all')
        if (scope === 'user' || scope === 'all') {
            for (const [email, data] of ownerMap.entries()) {
                if (targetUserEmail && email !== targetUserEmail) continue;

                const { subject, html } = getEmailTemplate('missed_digest_owner', {
                    owner_name: data.name,
                    missed_date: targetDateStr,
                    tasks: data.tasks.map((t: any) => ({
                        text: t.promise_text
                    }))
                });

                await sendEmail(email, subject, html);
                sentCount++;
            }
        }

        return new Response(JSON.stringify({ sent: sentCount }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
});

async function sendEmail(to: string, subject: string, html: string) {
    // Simple fetch wrapper for Resend
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
            from: 'PromySr <noreply@mail.promysr.com>',
            to: [to],
            subject: subject,
            html: html
        })
    });
    if (!res.ok) console.error(`Failed to send email to ${to}: ${await res.text()}`);
    else console.log(`Sent digest to ${to}`);
}
