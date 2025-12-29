/**
 * Shared Email Template Helper for Supabase Edge Functions
 * This is a Deno-compatible version of emailTemplates.ts
 */

export const getAppUrl = (): string => {
    return Deno.env.get('APP_URL') || 'https://promysr.vercel.app';
};

export const getBrandingHeader = () => `
    <div style="margin-bottom: 24px; text-align: center;">
        <h1 style="font-weight: 800; font-size: 24px; color: #0f172a; font-family: sans-serif; margin: 0 0 12px 0;">
            Promy<span style="background: linear-gradient(135deg, #00C9B7 0%, #007AFF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Sr</span>
        </h1>
        <div style="height: 4px; width: 100%; background: linear-gradient(90deg, #007AFF 0%, #00C9B7 100%); border-radius: 2px;"></div>
    </div>
`;

export const getEmailTemplate = (type: string, data: any = {}) => {
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
            const dailyTaskList = (data.tasks || []).map((t: any) => `
                <li style="margin-bottom: 8px; color: #334155;">
                    <span style="font-weight: 600;">${t.text}</span> (Due by ${t.due_time || 'EOD'})
                </li>
            `).join('');

            html = `
                <div style="font-family: 'Inter', sans-serif; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px; margin: 0 auto; background-color: white;">
                    ${header}
                    <h2 style="color: #1e293b; margin-top: 0;">Good Morning ${data.owner_name || 'User'}!</h2>
                    <p style="color: #334155; font-size: 16px;">Here are your commitments due today:</p>
                    <ul style="list-style: none; padding: 0; margin: 24px 0;">
                        ${dailyTaskList || '<li style="color: #64748b;">No tasks due today!</li>'}
                    </ul>
                    <a href="${appUrl}/user-portal" style="background: linear-gradient(135deg, #007AFF 0%, #00C9B7 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px;">View My Promises</a>
                </div>
            `;
            break;

        case 'weekly_user_report':
            subject = `📊 Your Weekly Accountability Report: Week of ${data.week_start ? formatToIST(data.week_start).split(',')[0] : 'This Week'}`;
            const weeklyUpcomingList = data.upcoming_tasks?.map((task: any) =>
                `<li style="margin-bottom: 8px; color: #334155;">
                    <span style="font-weight: 600;">${task.text}</span> (Due: ${formatToIST(task.due_date)})
                </li>`
            ).join('') || '<li style="color: #64748b;">No upcoming tasks this week.</li>';

            html = `
                <div style="font-family: 'Inter', sans-serif; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; margin: 0 auto; background-color: white;">
                    ${header}
                    <h2 style="color: #1e293b; margin-top: 0;">📊 Your Weekly Report</h2>
                    <p style="color: #64748b; font-size: 14px; margin-bottom: 24px;">Week of ${data.week_start ? formatToIST(data.week_start).split(',')[0] : 'This Week'}</p>
                    
                    <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #e0f2fe;">
                        <h3 style="margin: 0 0 12px 0; color: #0369a1;">This Week's Performance</h3>
                        <p style="margin: 4px 0; color: #075985;">✓ Completed: <strong>${data.completed_count || 0} promises</strong></p>
                        <p style="margin: 4px 0; color: #075985;">⏳ In Progress: <strong>${data.in_progress_count || 0} promises</strong></p>
                        <p style="margin: 4px 0; color: #075985;">⚠️ Missed: <strong>${data.missed_count || 0} promises</strong></p>
                        ${data.integrity_score ? `<p style="margin: 12px 0 0 0; font-size: 18px; font-weight: 600; color: #0369a1;">📊 Integrity Score: ${data.integrity_score}%</p>` : ''}
                    </div>

                    <h3 style="color: #1e293b; margin-bottom: 12px;">Upcoming Promises</h3>
                    <ul style="list-style: none; padding: 0; margin: 24px 0;">
                        ${weeklyUpcomingList}
                    </ul>

                    <a href="${appUrl}/user-portal" style="background: linear-gradient(135deg, #007AFF 0%, #00C9B7 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px; margin-top: 24px;">View Full Report</a>
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

        default:
            subject = "Notification from PromySr";
            html = `<div>You have a new notification.</div>`;
    }

    return { subject, html };
};
