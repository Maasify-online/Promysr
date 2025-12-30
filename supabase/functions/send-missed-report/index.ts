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

        console.log(`Sending reports for Missed Promises due on: ${targetDateStr} (IST)`);

        // 2. Fetch Missed Promises matching that due date
        const { data: missedPromises, error } = await supabase
            .from('promises')
            .select('*')
            .eq('status', 'Missed')
            .eq('due_date', targetDateStr);

        if (error) throw error;

        if (!missedPromises || missedPromises.length === 0) {
            console.log('No missed promises found for report.');
            return new Response(JSON.stringify({ message: 'No missed promises found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 3. Group by Leader and Owner for Batching
        const leaderMap = new Map();
        const ownerMap = new Map();
        const profileMap = new Map(); // Cache profiles

        // Helper to fetch/cache profile
        /* In a real scenario with many rows, we might fetch all relevant profiles in one query using 'in' filter.
           For batch size < 1000, fetching all profiles or iterating is okay. Let's fetch all relevant IDs. */
        const allUserIds = new Set([
            ...missedPromises.map(p => p.leader_id),
            // We lack owner_id column usually, relying on email? 
            // PromysrPromise uses owner_email. Profiles table maps email <-> id.
            // We need profiles to get names if not in promise object (owner_name is in promise).
        ]);

        // Let's get unique emails too to map owner emails to user IDs if needed 
        const allOwnerEmails = new Set(missedPromises.map(p => p.owner_email));

        // Fetch profiles for leaders
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .in('id', Array.from(allUserIds));

        profiles?.forEach(p => profileMap.set(p.id, p));

        missedPromises.forEach(p => {
            // Group for Leader (The one who needs to know their team failed)
            const leader = profileMap.get(p.leader_id);
            if (leader) {
                if (!leaderMap.has(leader.email)) {
                    leaderMap.set(leader.email, { name: leader.full_name, tasks: [] });
                }
                leaderMap.get(leader.email).tasks.push(p);
            }

            // Group for Owner (The one who failed)
            if (!ownerMap.has(p.owner_email)) {
                ownerMap.set(p.owner_email, { name: p.owner_name, tasks: [] });
            }
            ownerMap.get(p.owner_email).tasks.push(p);
        });

        // 4. Send Batched Emails
        let sentCount = 0;

        // A. Send to Leaders
        for (const [email, data] of leaderMap.entries()) {
            const { subject, html } = getEmailTemplate('missed_digest_leader', {
                leader_name: data.name,
                missed_date: targetDateStr,
                tasks: data.tasks.map(t => ({
                    text: t.promise_text,
                    owner: t.owner_name
                }))
            });

            await sendEmail(email, subject, html);
            sentCount++;
        }

        // B. Send to Owners
        for (const [email, data] of ownerMap.entries()) {
            const { subject, html } = getEmailTemplate('missed_digest_owner', {
                owner_name: data.name,
                missed_date: targetDateStr,
                tasks: data.tasks.map(t => ({
                    text: t.promise_text
                }))
            });

            // Don't double send if leader == owner (self assigned), but usually reports are distinct
            // Assuming unique emails map handles distinct sends.
            await sendEmail(email, subject, html);
            sentCount++;
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
