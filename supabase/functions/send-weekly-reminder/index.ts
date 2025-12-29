import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getEmailTemplate } from '../_shared/emailTemplates.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:8080';

serve(async (req) => {
    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Get current date for the week
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7); // End of week

        // Fetch all active promises
        const { data: allPromises, error: promisesError } = await supabase
            .from('promises')
            .select('*')
            .neq('status', 'Closed')
            .order('due_date', { ascending: true });

        if (promisesError) throw promisesError;

        // Group promises by user (for user reports)
        const userPromises = new Map();
        // Group promises by leader (for leader reports)
        const leaderPromises = new Map();

        allPromises?.forEach(p => {
            // User grouping
            if (!userPromises.has(p.owner_email)) {
                userPromises.set(p.owner_email, {
                    owner_name: p.owner_name,
                    promises: []
                });
            }
            userPromises.get(p.owner_email).promises.push(p);

            // Leader grouping
            if (p.leader_id) {
                if (!leaderPromises.has(p.leader_id)) {
                    leaderPromises.set(p.leader_id, []);
                }
                leaderPromises.get(p.leader_id).push(p);
            }
        });

        const emailsSent = [];

        // Send user weekly reports
        for (const [email, data] of userPromises) {
            const promises = data.promises;

            // Calculate stats
            const open = promises.filter(p => p.status === 'Open').length;
            const pending = promises.filter(p => p.status === 'Pending Verification').length;
            const missed = promises.filter(p => p.status === 'Missed').length;
            const overdue = promises.filter(p => {
                const dueDate = new Date(p.due_date);
                return dueDate < now && p.status === 'Open';
            }).length;

            // Get upcoming this week
            const upcoming = promises.filter(p => {
                const dueDate = new Date(p.due_date);
                return dueDate >= now && dueDate <= weekEnd && p.status === 'Open';
            });

            // Calculate integrity score
            const { data: userHistory } = await supabase
                .from('promises')
                .select('status')
                .eq('owner_email', email);

            let integrityScore = null;
            if (userHistory && userHistory.length >= 3) {
                const closed = userHistory.filter(p => p.status === 'Closed').length;
                const missedTotal = userHistory.filter(p => p.status === 'Missed').length;
                const total = closed + missedTotal;
                if (total > 0) {
                    integrityScore = Math.round((closed / total) * 100);
                }
            }

            // Send user email
            const { subject, html } = getEmailTemplate('weekly_user_report', {
                owner_name: data.owner_name,
                open_count: open,
                pending_count: pending,
                missed_count: missed,
                overdue_count: overdue,
                upcoming_tasks: upcoming.map(p => ({
                    text: p.promise_text,
                    due_date: p.due_date
                })),
                integrity_score: integrityScore,
                week_start: weekStart.toISOString()
            });

            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${RESEND_API_KEY}`
                },
                body: JSON.stringify({
                    from: 'PromySr <noreply@mail.promysr.com>',
                    to: [email],
                    subject: subject,
                    html: html
                })
            });

            if (response.ok) {
                emailsSent.push({ type: 'user', email });
            }
        }

        // Send leader weekly reports
        for (const [leaderId, promises] of leaderPromises) {
            // Get leader profile
            const { data: leaderProfile } = await supabase
                .from('profiles')
                .select('email, full_name')
                .eq('id', leaderId)
                .single();

            if (!leaderProfile) continue;

            // Calculate team stats
            const totalActive = promises.length;
            const pendingVerification = promises.filter(p => p.status === 'Pending Verification').length;
            const overdue = promises.filter(p => {
                const dueDate = new Date(p.due_date);
                return dueDate < now && p.status === 'Open';
            }).length;
            const missed = promises.filter(p => p.status === 'Missed').length;

            // Get team members with overdue promises (red flags)
            const redFlags = promises
                .filter(p => {
                    const dueDate = new Date(p.due_date);
                    return (dueDate < now && p.status === 'Open') || p.status === 'Missed';
                })
                .map(p => ({
                    owner_name: p.owner_name,
                    promise_text: p.promise_text,
                    due_date: p.due_date,
                    status: p.status
                }));

            // Calculate team average integrity score
            const uniqueMembers = [...new Set(promises.map(p => p.owner_email))];
            let teamAvgScore = null;
            if (uniqueMembers.length > 0) {
                let totalScore = 0;
                let membersWithScore = 0;

                for (const memberEmail of uniqueMembers) {
                    const { data: memberHistory } = await supabase
                        .from('promises')
                        .select('status')
                        .eq('owner_email', memberEmail);

                    if (memberHistory && memberHistory.length >= 3) {
                        const closed = memberHistory.filter(p => p.status === 'Closed').length;
                        const missedTotal = memberHistory.filter(p => p.status === 'Missed').length;
                        const total = closed + missedTotal;
                        if (total > 0) {
                            totalScore += (closed / total) * 100;
                            membersWithScore++;
                        }
                    }
                }

                if (membersWithScore > 0) {
                    teamAvgScore = Math.round(totalScore / membersWithScore);
                }
            }

            // Send leader email
            const { subject, html } = getEmailTemplate('weekly_leader_report', {
                leader_name: leaderProfile.full_name,
                total_active: totalActive,
                pending_verification: pendingVerification,
                overdue_count: overdue,
                missed_count: missed,
                red_flags: redFlags,
                team_avg_score: teamAvgScore,
                team_member_count: uniqueMembers.length,
                week_start: weekStart.toISOString()
            });

            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${RESEND_API_KEY}`
                },
                body: JSON.stringify({
                    from: 'PromySr <noreply@mail.promysr.com>',
                    to: [leaderProfile.email],
                    subject: subject,
                    html: html
                })
            });

            if (response.ok) {
                emailsSent.push({ type: 'leader', email: leaderProfile.email });
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                emails_sent: emailsSent.length,
                breakdown: {
                    users: emailsSent.filter(e => e.type === 'user').length,
                    leaders: emailsSent.filter(e => e.type === 'leader').length
                }
            }),
            { headers: { 'Content-Type': 'application/json' } }
        );

    } catch (err) {
        console.error('Weekly reminder error:', err);
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
});
