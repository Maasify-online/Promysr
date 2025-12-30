import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// --- INLINED SHARED LOGIC ---

const getAppUrl = (): string => {
    return Deno.env.get('APP_URL') || 'https://promysr.vercel.app';
};

const getBrandingHeader = () => `
    <div style="margin-bottom: 24px; text-align: center;">
        <h1 style="font-weight: 800; font-size: 24px; color: #0f172a; font-family: sans-serif; margin: 0 0 12px 0;">
            Promy<span style="background: linear-gradient(135deg, #00C9B7 0%, #007AFF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Sr</span>
        </h1>
        <div style="height: 4px; width: 100%; background: linear-gradient(90deg, #007AFF 0%, #00C9B7 100%); border-radius: 2px;"></div>
    </div>
`;

const getEmailTemplate = (type: string, data: any = {}) => {
    const header = getBrandingHeader();
    const appUrl = getAppUrl();
    let subject = "";
    let html = "";

    // Helper to format dates in IST (India Standard Time)
    const formatToIST = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            // Check if it's already a formatted string (legacy support)
            if (!dateStr.includes('T') && !dateStr.includes('-')) return dateStr;

            return new Date(dateStr).toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                dateStyle: 'medium',
                timeStyle: 'short'
            });
        } catch (e) {
            return dateStr;
        }
    };

    switch (type) {
        case 'created':
        case 'new_assignment':
            subject = `New Promise Assigned: "${data.promise_text?.substring(0, 30)}..."`;
            html = `
                <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin: 0 auto; background-color: white;">
                    ${header}
                    <h2 style="color: #007AFF; margin-top: 0;">New Promise Assigned</h2>
                    <p>Hi <strong>${data.owner_name || 'User'}</strong>,</p>
                    <p>You have been assigned a new promise:</p>
                    <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin: 16px 0;">
                        <p style="margin: 0; font-weight: 600;">${data.promise_text || 'Review Item'}</p>
                        <p style="margin: 8px 0 0 0; color: #64748b;">Due: ${data.due_date || 'TBD'}</p>
                    </div>
                    <a href="${appUrl}/user-portal" style="display: inline-block; background: #007AFF; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px;">View Promise</a>
                </div>
            `;
            break;

        case 'review_needed':
            subject = `Action Required: Review ${data.owner_name || 'User'}'s Promise`;
            html = `
                <div style="font-family: 'Inter', sans-serif; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px; margin: 0 auto; background-color: white;">
                    ${header}
                    <p style="color: #334155; font-size: 16px;">Hi <strong>${data.leader_name || 'Leader'}</strong>,</p>
                    <p style="color: #334155; font-size: 16px;"><strong>${data.owner_name || 'User'}</strong> has marked a promise as complete and needs your verification:</p>
                    <blockquote style="border-left: 4px solid #f59e0b; padding-left: 16px; margin: 24px 0; color: #1e293b; font-size: 18px; font-weight: 500;">
                        "${data.promise_text || 'Review Item'}"
                    </blockquote>
                    <div style="background-color: #fffbeb; padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #fcd34d;">
                        <p style="margin: 4px 0; color: #92400e; font-size: 14px;"><strong>Marked Complete:</strong> ${formatToIST(data.completed_at) || 'Just now'}</p>
                    </div>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                        <a href="${data.action_url || `${appUrl}/dashboard`}" style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px; flex: 1; text-align: center; min-width: 140px;">✓ Verify Completion</a>
                        <a href="${appUrl}/dashboard?action=reject&id=${data.promise_id}" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px; flex: 1; text-align: center; min-width: 140px;">✗ Reject</a>
                    </div>
                </div>
            `;
            break;

        case 'closed':
        case 'promise_completed':
            subject = `Promise Kept: ${data.owner_name || 'User'} completed a task`;
            html = `
                <div style="font-family: 'Inter', sans-serif; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px; margin: 0 auto; background-color: white;">
                    ${header}
                    <p style="color: #334155; font-size: 16px;">Hi <strong>${data.leader_name || 'Leader'}</strong>,</p>
                    <p style="color: #334155; font-size: 16px;">Good news! <strong>${data.owner_name || 'User'}</strong> has marked a promise as <span style="color: #16a34a; font-weight: bold;">Kept</span>:</p>
                    <blockquote style="border-left: 4px solid #16a34a; padding-left: 16px; margin: 24px 0; color: #1e293b; font-size: 18px; font-weight: 500;">
                        "${data.promise_text || 'Task'}"
                    </blockquote>
                    <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #dcfce7;">
                        <p style="margin: 4px 0; color: #166534; font-size: 14px;"><strong>Completion Time:</strong> ${formatToIST(data.completed_at) || 'Just now'}</p>
                    </div>
                    <a href="${appUrl}/dashboard" style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px;">View Details</a>
                </div>
            `;
            break;

        case 'missed':
            subject = `MISSED: ${data.promise_text?.substring(0, 30)}...`;
            html = `
                <div style="font-family: 'Inter', sans-serif; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px; margin: 0 auto; background-color: white;">
                    ${header}
                    <p style="color: #334155; font-size: 16px;">Hi <strong>${data.leader_name || 'Leader'}</strong>,</p>
                    <p style="color: #334155; font-size: 16px;">A promise has been <span style="color: #ef4444; font-weight: bold;">missed</span>:</p>
                    <blockquote style="border-left: 4px solid #ef4444; padding-left: 16px; margin: 24px 0; color: #1e293b; font-size: 18px; font-weight: 500;">
                        "${data.promise_text || 'Task'}"
                    </blockquote>
                    <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #fecaca;">
                        <p style="margin: 4px 0; color: #991b1b; font-size: 14px;"><strong>Original Due Date:</strong> ${data.due_date || 'N/A'}</p>
                        <p style="margin: 4px 0; color: #991b1b; font-size: 14px;"><strong>Owner:</strong> ${data.owner_name || 'Unknown'}</p>
                    </div>
                    <a href="${appUrl}/dashboard" style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px;">View Dashboard</a>
                </div>
            `;
            break;

        case 'due-today':
        case 'digest_user':
            subject = `Your Daily Brief: ${new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}`;
            const taskList = (data.tasks || []).map((t: any) => `
                <div style="padding: 16px; border-left: 4px solid #007AFF; background: #f8fafc; margin-bottom: 12px;">
                    <p style="margin: 0; font-weight: 600; color: #1e293b;">"${t.text}"</p>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Due by ${t.due_time || 'EOD'}</p>
                </div>
            `).join('');

            html = `
                <div style="font-family: 'Inter', sans-serif; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px; margin: 0 auto; background-color: white;">
                    ${header}
                    <p style="color: #334155; font-size: 16px;">Good Morning <strong>${data.owner_name || 'User'}</strong>,</p>
                    <p style="color: #334155; font-size: 16px;">Here are your commitments due today:</p>
                    <div style="margin: 24px 0;">
                        ${taskList || '<p style="color: #64748b;">No tasks due today!</p>'}
                    </div>
                    <a href="${data.action_url || `${appUrl}/user-portal`}" style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px;">Mark as Complete</a>
                </div>
            `;
            break;

        case 'completion_rejected':
            subject = `Completion Not Verified: "${data.promise_text?.substring(0, 30)}..."`;
            html = `
                <div style="font-family: 'Inter', sans-serif; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px; margin: 0 auto; background-color: white;">
                    ${header}
                    <p style="color: #334155; font-size: 16px;">Hi <strong>${data.owner_name || 'User'}</strong>,</p>
                    <p style="color: #334155; font-size: 16px;">Your promise completion was <span style="color: #ef4444; font-weight: bold;">not verified</span> by ${data.leader_name || 'your team leader'}:</p>
                    <blockquote style="border-left: 4px solid #ef4444; padding-left: 16px; margin: 24px 0; color: #1e293b; font-size: 18px; font-weight: 500;">
                        "${data.promise_text || 'Task'}"
                    </blockquote>
                    <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #fecaca;">
                        <p style="margin: 4px 0; color: #991b1b; font-size: 14px;"><strong>Feedback:</strong></p>
                        <p style="margin: 8px 0; color: #991b1b; font-size: 14px;">${data.rejection_reason || 'No specific feedback provided'}</p>
                        <p style="margin: 12px 0 4px 0; color: #991b1b; font-size: 14px;"><strong>Rejected At:</strong> ${formatToIST(data.rejected_at) || 'Just now'}</p>
                    </div>
                    <p style="color: #64748b; font-size: 14px; margin-bottom: 24px;">Please review the feedback and resubmit when ready.</p>
                    <a href="${appUrl}/user-portal" style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px;">Resubmit Completion</a>
                </div>
            `;
            break;

        case 'promise_verified':
            subject = `✓ Promise Verified: "${data.promise_text?.substring(0, 30)}..."`;
            html = `
                <div style="font-family: 'Inter', sans-serif; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px; margin: 0 auto; background-color: white;">
                    ${header}
                    <p style="color: #334155; font-size: 16px;">Hi <strong>${data.owner_name || 'User'}</strong>,</p>
                    <p style="color: #334155; font-size: 16px;">🎉 Congratulations! Your promise has been <span style="color: #16a34a; font-weight: bold;">verified and completed</span>:</p>
                    <blockquote style="border-left: 4px solid #16a34a; padding-left: 16px; margin: 24px 0; color: #1e293b; font-size: 18px; font-weight: 500;">
                        "${data.promise_text || 'Task'}"
                    </blockquote>
                    <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #dcfce7;">
                        <p style="margin: 4px 0; color: #166534; font-size: 14px;"><strong>Verified By:</strong> ${data.leader_name || 'Team Leader'}</p>
                        <p style="margin: 4px 0; color: #166534; font-size: 14px;"><strong>Completion Time:</strong> ${formatToIST(data.completed_at) || 'Just now'}</p>
                        ${data.integrity_score ? `<p style="margin: 12px 0 4px 0; color: #166534; font-size: 16px; font-weight: 600;">📊 Your Integrity Score: ${data.integrity_score}%</p>` : ''}
                    </div>
                    <a href="${appUrl}/user-portal" style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px;">View My Stats</a>
                </div>
            `;
            break;

        case 'weekly_user_report':
            subject = `📊 Weekly Accountability Report: Week of ${data.week_start ? formatToIST(data.week_start).split(',')[0] : 'This Week'}`;
            const upcomingList = data.upcoming_tasks?.map((task: any) =>
                `<div style="padding: 12px; background: #f8fafc; border-left: 3px solid #3b82f6; margin-bottom: 8px; border-radius: 4px;">
                    <p style="margin: 0; font-weight: 600; color: #1e293b;">${task.text}</p>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Due: ${formatToIST(task.due_date)}</p>
                </div>`
            ).join('') || '<p style="color: #64748b;">No upcoming tasks this week</p>';

            html = `
                <div style="font-family: 'Inter', sans-serif; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; margin: 0 auto; background-color: white;">
                    ${header}
                    <h2 style="color: #1e293b; margin-bottom: 8px;">📊 Your Weekly Report</h2>
                    <p style="color: #64748b; font-size: 14px; margin-bottom: 24px;">Week of ${data.week_start ? formatToIST(data.week_start).split(',')[0] : 'This Week'}</p>
                    
                    <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                        <h3 style="margin: 0 0 12px 0; color: #0369a1;">This Week's Performance</h3>
                        <p style="margin: 4px 0; color: #075985;">✓ Completed: <strong>${data.completed_count || 0} promises</strong></p>
                        <p style="margin: 4px 0; color: #075985;">⏳ In Progress: <strong>${data.in_progress_count || 0} promises</strong></p>
                        <p style="margin: 4px 0; color: #075985;">⚠️ Missed: <strong>${data.missed_count || 0} promises</strong></p>
                        ${data.integrity_score ? `<p style="margin: 12px 0 0 0; font-size: 18px; font-weight: 600; color: #0369a1;">📊 Integrity Score: ${data.integrity_score}%</p>` : ''}
                    </div>

                    <h3 style="color: #1e293b; margin-bottom: 12px;">Upcoming This Week</h3>
                    ${upcomingList}

                    <a href="${appUrl}/user-portal" style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px; margin-top: 24px;">View Full Report</a>
                </div>
            `;
            break;

        default:
            subject = "Notification from PromySr";
            html = `<div>You have a new notification.</div>`;
    }

    return { subject, html };
};

// --- END INLINED SHARED LOGIC ---

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const APP_URL = Deno.env.get('APP_URL') || 'https://promysr.vercel.app';

interface NotificationPayload {
    type: 'created' | 'missed' | 'closed' | 'due-today' | 'review_needed'
    promise_text: string
    due_date: string
    owner_email: string
    leader_email?: string
    leader_name?: string
    owner_name?: string
    completed_at?: string
    tasks?: Array<{ text: string; due_time?: string }>
    promise_id?: string // Added for action links
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const payload: NotificationPayload = await req.json()
        const { type, owner_email, leader_email, promise_id } = payload

        if (!RESEND_API_KEY) {
            console.error("Missing RESEND_API_KEY")
            return new Response(JSON.stringify({ error: "Server Configuration Error" }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Determine recipient based on notification type
        let to = ""
        let requiredPref = "" // Maps to actual DB columns: promise_created_enabled, review_needed_enabled, etc.

        switch (type) {
            case 'created':
                to = owner_email
                requiredPref = 'promise_created_enabled'
                if (promise_id) {
                    (payload as any).action_url = `${APP_URL}/dashboard?action=complete&id=${promise_id}`;
                }
                break
            case 'missed':
                to = leader_email || owner_email
                requiredPref = 'promise_missed_enabled'
                break
            case 'closed':
                to = leader_email || owner_email
                requiredPref = 'promise_closed_enabled'
                break
            case 'promise_verified':
                to = owner_email  // Person who did the work gets the confirmation
                requiredPref = 'promise_verified_enabled'
                break
            case 'review_needed':
                to = leader_email!
                requiredPref = 'review_needed_enabled'
                if (promise_id) {
                    (payload as any).action_url = `${APP_URL}/dashboard?action=verify&id=${promise_id}`;
                }
                break;
            case 'due-today':
            case 'digest_user':
                to = owner_email
                requiredPref = 'daily_brief_enabled'
                break
            case 'completion_rejected':
                to = owner_email
                requiredPref = 'completion_rejected_enabled'
                break
            default:
                throw new Error(`Invalid notification type: ${type}`)
        }

        // --- PREFERENCE CHECK ---
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
            const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
            const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

            // Get User ID by Email (since settings are by user_id)
            const { data: profiles, error: profileError } = await supabase.from('profiles').select('user_id').eq('email', to).maybeSingle();

            if (profileError) {
                console.error("Error fetching profile for preference check:", profileError);
            }

            if (profiles) {
                const { data: settings } = await supabase
                    .from('email_notification_settings')
                    .select('*')
                    .eq('user_id', profiles.user_id)
                    .maybeSingle();

                // If settings exist, and the specific setting is explicitly FALSE, we skip.
                // Default is TRUE (if row missing or null).
                if (settings && settings[requiredPref] === false) {
                    console.log(`Email supressed by user preference: ${requiredPref} is OFF for ${to}`);
                    return new Response(JSON.stringify({ skipped: true, reason: "User Preference" }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        status: 200
                    })
                }
            }
        }
        // ------------------------

        // Get HTML template
        const { subject, html } = getEmailTemplate(type, payload)

        // Send email via Resend
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: 'PromySr <noreply@mail.promysr.com>', // Custom domain email
                to: [to],
                subject: subject,
                html: html, // Using HTML instead of plain text
            })
        })

        let logErrorDetail = null;
        // Log the email if sent successfully
        if (res.ok) {
            try {
                const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
                const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

                if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
                    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
                    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

                    const { error: insertError } = await supabaseAdmin.from('emails_log').insert({
                        promise_id: promise_id || null,
                        email_type: type,
                        recipient_email: to,
                        subject: subject,
                        status: 'sent',
                        sent_at: new Date().toISOString()
                    })

                    if (insertError) {
                        console.error('Error logging email (Insert Failed):', insertError)
                        logErrorDetail = insertError;
                    }
                }
            } catch (logError) {
                console.error('Error logging email (Exception):', logError)
                logErrorDetail = logError;
            }
        }

        const responseData = await res.json()
        if (logErrorDetail) {
            // Append log error to response so we can see it in frontend
            (responseData as any).logError = logErrorDetail;
        }

        return new Response(JSON.stringify(responseData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: res.status
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
