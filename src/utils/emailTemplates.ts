
/**
 * Get the application base URL for email links
 * Uses environment variable with fallback to production URL
 */
export const getAppUrl = (): string => {
    return import.meta.env.VITE_APP_URL || 'https://promysr.vercel.app';
};

export const getBrandingHeader = () => `
    <div style="margin-bottom: 24px; text-align: center;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 12px;">
            <div style="width: 24px; height: 24px; background: linear-gradient(135deg, #007AFF 0%, #00C9B7 100%); border-radius: 6px;"></div>
            <span style="font-weight: 800; font-size: 18px; color: #0f172a; font-family: sans-serif;">PromySr</span>
        </div>
        <div style="height: 4px; width: 100%; background: linear-gradient(90deg, #007AFF 0%, #00C9B7 100%); border-radius: 2px;"></div>
    </div>
`;

export const getEmailTemplate = (type: string, data: any = {}) => {
    const header = getBrandingHeader();
    let subject = "";
    let body = "";

    switch (type) {
        case 'new_assignment':
            subject = `New Promise Assigned: "${data.promise_text?.substring(0, 30)}..."`;
            body = `
                <div style="font-family: 'Inter', sans-serif; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px; margin: 0 auto; background-color: white;">
                    ${header}
                    <p style="color: #334155; font-size: 16px;">Hi <strong>${data.recipient_name || 'User'}</strong>,</p>
                    <p style="color: #334155; font-size: 16px;">You have made (or been assigned) a new promise:</p>
                    <blockquote style="border-left: 4px solid #007AFF; padding-left: 16px; margin: 24px 0; color: #1e293b; font-size: 18px; font-weight: 500;">
                        "${data.promise_text || 'Review Item'}"
                    </blockquote>
                    <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                        <p style="margin: 4px 0; color: #64748b; font-size: 14px;"><strong>Due Date:</strong> ${data.due_date || 'TBD'}</p>
                        <p style="margin: 4px 0; color: #64748b; font-size: 14px;"><strong>Requester:</strong> ${data.leader_name || 'Team Leader'}</p>
                    </div>
                    <a href="${data.action_url || '#'}" style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px;">View Assurance</a>
                </div>
            `;
            break;

        case 'promise_completed':
            subject = `Promise Kept: ${data.completer_name || 'User'} completed a task`;
            body = `
                <div style="font-family: 'Inter', sans-serif; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px; margin: 0 auto; background-color: white;">
                    ${header}
                    <p style="color: #334155; font-size: 16px;">Hi <strong>${data.leader_name || 'Leader'}</strong>,</p>
                    <p style="color: #334155; font-size: 16px;">Good news! <strong>${data.completer_name || 'User'}</strong> has marked a promise as <span style="color: #16a34a; font-weight: bold;">Kept</span>:</p>
                    <blockquote style="border-left: 4px solid #16a34a; padding-left: 16px; margin: 24px 0; color: #1e293b; font-size: 18px; font-weight: 500;">
                        "${data.promise_text || 'Task'}"
                    </blockquote>
                    <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #dcfce7;">
                         <p style="margin: 4px 0; color: #166534; font-size: 14px;"><strong>Completion Time:</strong> ${data.completed_at || 'Just now'}</p>
                    </div>
                    <a href="${data.action_url || '#'}" style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px;">View Details</a>
                </div>
            `;
            break;

        case 'weekly_leader':
            subject = `Team Weekly Pulse: ${data.date_range || 'This Week'}`;
            body = `
                <div style="font-family: 'Inter', sans-serif; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px; margin: 0 auto; background-color: white;">
                    ${header}
                    <p style="color: #334155; font-size: 16px;">Hi <strong>${data.recipient_name || 'Leader'}</strong>,</p>
                    <p style="color: #334155; font-size: 16px;">Here's how <strong>${data.org_name || 'Your Team'}</strong> performed this week:</p>
                    
                    <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 24px; border-radius: 12px; margin: 24px 0; border: 1px solid #e2e8f0;">
                         <div style="display: flex; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px;">
                            <span style="color: #64748b; font-weight: 500;">Promises Made</span>
                            <span style="color: #0f172a; font-weight: 700;">${data.promises_made || 0}</span>
                         </div>
                         <div style="display: flex; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px;">
                            <span style="color: #64748b; font-weight: 500;">Promises Kept</span>
                            <span style="color: #16a34a; font-weight: 700;">${data.promises_kept || 0}</span>
                         </div>
                         <div style="display: flex; justify-content: space-between;">
                            <span style="color: #64748b; font-weight: 500;">Completion Rate</span>
                            <span style="color: #0f172a; font-weight: 700;">${data.completion_rate || '0%'}</span>
                         </div>
                    </div>

                    <div style="text-align: center; margin-bottom: 24px;">
                        <span style="background-color: #fef3c7; color: #d97706; padding: 6px 12px; border-radius: 99px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Top Performer</span>
                        <div style="margin-top: 12px; font-size: 18px; font-weight: 600; color: #0f172a;">🏆 ${data.top_performer || 'N/A'}</div>
                    </div>

                    <a href="${data.action_url || '#'}" style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px; width: 100%; text-align: center;">View Leaderboard</a>
                </div>
            `;
            break;

        case 'digest_user':
            subject = `Your Daily Brief: ${new Date().toLocaleDateString()}`;
            body = `
                <div style="font-family: 'Inter', sans-serif; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px; margin: 0 auto; background-color: white;">
                    ${header}
                    <p style="color: #334155; font-size: 16px;">Good Morning <strong>${data.recipient_name || 'User'}</strong>,</p>
                    <p style="color: #334155; font-size: 16px;">Here are your commitments due today:</p>
                    
                     <div style="margin: 24px 0;">
                        ${(data.tasks || []).map((t: any) => `
                        <div style="padding: 16px; border-left: 4px solid #007AFF; background: #f8fafc; margin-bottom: 12px;">
                            <p style="margin: 0; font-weight: 600; color: #1e293b;">"${t.text}"</p>
                            <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Due by ${t.due_time || 'EOD'}</p>
                        </div>`).join('')}
                     </div>

                    <a href="${data.action_url || '#'}" style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px;">Mark as Complete</a>
                </div>
            `;
            break;

        case 'digest_leader':
            subject = `Team Daily: ${new Date().toLocaleDateString()}`;
            body = `
                <div style="font-family: 'Inter', sans-serif; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px; margin: 0 auto; background-color: white;">
                    ${header}
                    <p style="color: #334155; font-size: 16px;">Good Morning <strong>${data.recipient_name || 'Leader'}</strong>,</p>
                    <p style="color: #334155; font-size: 16px;">Here is what your team owes you today:</p>
                    <div style="display: flex; gap: 16px; margin: 24px 0;">
                        <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; flex: 1; text-align: center;">
                            <div style="font-size: 32px; font-weight: 800; color: #0f172a;">${data.due_count || 0}</div>
                            <div style="font-size: 12px; font-weight: 600; color: #64748b; letter-spacing: 0.5px;">DUE TODAY</div>
                        </div>
                        <div style="background: #fef2f2; padding: 20px; border-radius: 12px; flex: 1; text-align: center;">
                            <div style="font-size: 32px; font-weight: 800; color: #ef4444;">${data.overdue_count || 0}</div>
                            <div style="font-size: 12px; font-weight: 600; color: #ef4444; letter-spacing: 0.5px;">OVERDUE</div>
                        </div>
                    </div>
                   <br/>
                    <a href="${data.action_url || '#'}" style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px;">View Team Dashboard</a>
                </div>
             `;
            break;

        default:
            subject = "Notification from Promysr";
            body = "<div>You have a new notification.</div>";
    }

    return { subject, body };
};
