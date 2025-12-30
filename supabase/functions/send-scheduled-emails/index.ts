import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

        // Check for Debug Time Override
        const method = req.method
        let debugNowTime = null
        if (method === 'POST') {
            try {
                const body = await req.json()
                if (body.debugNow) {
                    debugNowTime = new Date(body.debugNow)
                    console.log(`⚠️ DEBUG MODE: Using Time Override: ${debugNowTime.toISOString()}`)
                }
            } catch (e) {
                // Squelch JSON parse errors on empty body
            }
        }

        // Get current time in UTC (or override)
        const now = debugNowTime || new Date()
        const currentUTCHour = now.getUTCHours()
        // We do NOT use global day anymore, as it differs per user timezone
        console.log(`Scheduler running at ${now.toISOString()} (UTC Hour: ${currentUTCHour})`)

        // Fetch all users with email notification settings
        const { data: allSettings, error: settingsError } = await supabase
            .from('email_notification_settings')
            .select('*')

        if (settingsError) throw settingsError

        let dailyBriefCount = 0
        let weeklyReminderCount = 0

        // Process each user's settings
        for (const settings of allSettings || []) {
            // Fetch user profile to get email
            const { data: profile } = await supabase
                .from('profiles')
                .select('email, full_name')
                .eq('user_id', settings.user_id)
                .maybeSingle()

            if (!profile || !profile.email) {
                console.log(`Skipping user ${settings.user_id} - no profile found`)
                continue
            }

            const userEmail = profile.email
            const userId = settings.user_id

            // --- DAILY BRIEF LOGIC ---
            if (settings.daily_brief_enabled) {
                // Parse user's preferred time (stored as HH:MM:SS)
                const [userHour, userMinute] = (settings.daily_brief_time || '08:00:00').split(':').map(Number)

                // Parse user's preferred days (stored as JSON array like ["monday", "tuesday"])
                const preferredDays = settings.daily_brief_days || ["monday", "tuesday", "wednesday", "thursday", "friday"]

                // Convert user's local time to UTC
                // Assuming user timezone is stored in daily_brief_timezone (default: UTC)
                const userTimezone = settings.daily_brief_timezone || 'UTC'

                // Timezone offset calculation (UTC offset in hours)
                // Positive offset means timezone is ahead of UTC, so we subtract
                // Negative offset means timezone is behind UTC, so we add
                let utcOffset = 0
                switch (userTimezone) {
                    case 'UTC':
                        utcOffset = 0
                        break
                    case 'Asia/Kolkata':
                        utcOffset = 5.5 // IST is UTC+5:30
                        break
                    case 'America/New_York':
                        utcOffset = -5 // EST is UTC-5
                        break
                    case 'America/Los_Angeles':
                        utcOffset = -8 // PST is UTC-8
                        break
                    case 'Europe/London':
                        utcOffset = 0 // GMT is UTC+0
                        break
                    case 'Asia/Tokyo':
                        utcOffset = 9 // JST is UTC+9
                        break
                    default:
                        utcOffset = 0 // Default to UTC
                }

                // Calculate User's Target UTC Time (Float: Hours + Minutes)
                const userTimeFloat = userHour + (userMinute / 60)
                const targetUTC = (userTimeFloat - utcOffset + 24) % 24

                // Calculate Current System UTC Time (Float)
                const currentUTC = now.getUTCHours() + (now.getUTCMinutes() / 60)

                // Calculate User's Current Day of Week
                const userDayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: userTimezone }).toLowerCase()

                // Check matches with small tolerance (e.g., 5 mins = 0.08 hours)
                // This handles potential execution delays (e.g., executing at 06:31 instead of 06:30)
                const timeDiff = Math.abs(targetUTC - currentUTC)
                // Handle wrap-around (e.g. 23.9 vs 0.1)
                const wrapDiff = 24 - timeDiff
                const isRightTime = (timeDiff < 0.1) || (wrapDiff < 0.1)

                const isRightDay = preferredDays.includes(userDayOfWeek)

                if (isRightTime && isRightDay) {
                    console.log(`Sending Daily Brief to ${userEmail} (scheduled for ${userHour}:00 ${userTimezone})`)

                    // Call send-morning-brief for this specific user (SCOPE: USER)
                    await supabase.functions.invoke('send-morning-brief', {
                        body: { userEmail, scope: 'user' }
                    })

                    dailyBriefCount++
                }
            }

            // --- LEADER RADAR LOGIC ---
            if (settings.leader_daily_radar_enabled) {
                const [leaderHour, leaderMinute] = (settings.leader_daily_radar_time || '09:00:00').split(':').map(Number)
                const leaderDays = settings.leader_daily_radar_days || ["monday", "tuesday", "wednesday", "thursday", "friday"]
                const leaderTimezone = settings.leader_report_timezone || settings.daily_brief_timezone || 'Asia/Kolkata'

                // Re-calculate UTC target for Leader time
                let utcOffset = 0
                switch (leaderTimezone) {
                    case 'UTC': utcOffset = 0; break;
                    case 'Asia/Kolkata': utcOffset = 5.5; break;
                    case 'America/New_York': utcOffset = -5; break;
                    case 'America/Los_Angeles': utcOffset = -8; break;
                    case 'Europe/London': utcOffset = 0; break;
                    case 'Asia/Tokyo': utcOffset = 9; break;
                    default: utcOffset = 0;
                }

                const targetUTC = (leaderHour + (leaderMinute / 60) - utcOffset + 24) % 24
                const currentUTC = now.getUTCHours() + (now.getUTCMinutes() / 60)

                const userDayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: leaderTimezone }).toLowerCase()

                const timeDiff = Math.abs(targetUTC - currentUTC)
                const wrapDiff = 24 - timeDiff
                const isRightTime = (timeDiff < 0.1) || (wrapDiff < 0.1)
                const isRightDay = leaderDays.includes(userDayOfWeek)

                if (isRightTime && isRightDay) {
                    console.log(`Sending Leader Radar to ${userEmail} (scheduled for ${leaderHour}:00 ${leaderTimezone})`)

                    // Call send-morning-brief for this leader (SCOPE: LEADER)
                    await supabase.functions.invoke('send-morning-brief', {
                        body: { userEmail, scope: 'leader' }
                    })

                    // We count this toward dailyBriefCount for summary, or track separately?
                    // Let's track nicely if we want, but simpler to just increment.
                    dailyBriefCount++
                }
            }

            // --- WEEKLY REMINDER LOGIC ---
            if (settings.weekly_reminder_enabled) {
                const [reminderHour, reminderMinute] = (settings.weekly_reminder_time || '10:00:00').split(':').map(Number)
                const reminderDay = settings.weekly_reminder_day || 'monday'
                const frequency = settings.weekly_reminder_frequency || 'weekly'
                const lastSent = settings.weekly_reminder_last_sent ? new Date(settings.weekly_reminder_last_sent) : null

                // Convert to UTC using same timezone logic
                const userTimezone = settings.weekly_reminder_timezone || 'Asia/Kolkata'
                let utcOffset = 0
                switch (userTimezone) {
                    case 'UTC':
                        utcOffset = 0
                        break
                    case 'Asia/Kolkata':
                        utcOffset = 5.5
                        break
                    case 'America/New_York':
                        utcOffset = -5
                        break
                    case 'America/Los_Angeles':
                        utcOffset = -8
                        break
                    case 'Europe/London':
                        utcOffset = 0
                        break
                    case 'Asia/Tokyo':
                        utcOffset = 9
                        break
                    default:
                        utcOffset = 0
                }

                const targetUTC = (reminderHour + (reminderMinute / 60) - utcOffset + 24) % 24

                // Current UTC (Float) calculated above as `currentUTC`
                // But we need to make sure we define it if we didn't enter the daily block.
                // Safest to jus re-use or re-calc if scoped. 
                // Let's re-calc to be safe or lift `currentUTC` to top scope?
                // Actually `currentUTC` was defined in the block above. Let's lift it.
                // Wait, I can't easily lift it with this tool without editing the middle.
                // I'll just re-calc it here for safety and simplicity.
                const currentUTC = now.getUTCHours() + (now.getUTCMinutes() / 60)

                // Calculate User's Current Day of Week
                const userDayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: userTimezone }).toLowerCase()

                // Check time match
                const timeDiff = Math.abs(targetUTC - currentUTC)
                const wrapDiff = 24 - timeDiff
                const isRightTime = (timeDiff < 0.1) || (wrapDiff < 0.1)

                const isRightDay = userDayOfWeek === reminderDay

                // Check frequency
                let shouldSend = isRightTime && isRightDay

                if (shouldSend && frequency === 'biweekly' && lastSent) {
                    // For biweekly, check if it's been roughly 14 days (relax to 13 to handle jitter)
                    // The isRightDay check prevents sending too early (e.g. at 7 days)
                    const daysSinceLastSend = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24)
                    shouldSend = daysSinceLastSend >= 13
                }

                if (shouldSend) {
                    console.log(`Sending Weekly Reminder to ${userEmail} (scheduled for ${reminderDay} ${reminderHour}:00 ${userTimezone})`)

                    // Call send-weekly-reminder for this specific user
                    await supabase.functions.invoke('send-weekly-reminder', {
                        body: { userEmail, scope: 'user' }
                    })

                    // Update last_sent timestamp
                    await supabase
                        .from('email_notification_settings')
                        .update({ weekly_reminder_last_sent: now.toISOString() })
                        .eq('user_id', userId)

                    weeklyReminderCount++
                }
            }

            // --- LEADER WEEKLY REPORT LOGIC ---
            if (settings.leader_weekly_report_enabled) {
                const [reportHour, reportMinute] = (settings.leader_weekly_report_time || '09:00:00').split(':').map(Number)
                const reportDay = settings.leader_weekly_report_day || 'monday'
                const frequency = settings.leader_weekly_report_frequency || 'weekly'
                const lastSent = settings.leader_weekly_report_last_sent ? new Date(settings.leader_weekly_report_last_sent) : null
                const leaderTimezone = settings.leader_report_timezone || settings.daily_brief_timezone || 'Asia/Kolkata'

                // Re-calculate UTC target
                let utcOffset = 0
                switch (leaderTimezone) {
                    case 'UTC': utcOffset = 0; break;
                    case 'Asia/Kolkata': utcOffset = 5.5; break;
                    case 'America/New_York': utcOffset = -5; break;
                    case 'America/Los_Angeles': utcOffset = -8; break;
                    case 'Europe/London': utcOffset = 0; break;
                    case 'Asia/Tokyo': utcOffset = 9; break;
                    default: utcOffset = 0;
                }

                const targetUTC = (reportHour + (reportMinute / 60) - utcOffset + 24) % 24
                const currentUTC = now.getUTCHours() + (now.getUTCMinutes() / 60)
                const userDayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: leaderTimezone }).toLowerCase()

                const timeDiff = Math.abs(targetUTC - currentUTC)
                const wrapDiff = 24 - timeDiff
                const isRightTime = (timeDiff < 0.1) || (wrapDiff < 0.1)
                const isRightDay = userDayOfWeek === reportDay



                let shouldSend = isRightTime && isRightDay

                if (shouldSend && frequency === 'biweekly' && lastSent) {
                    const daysSinceLastSend = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24)
                    shouldSend = daysSinceLastSend >= 13
                }

                if (shouldSend) {
                    console.log(`Sending Leader Weekly Report to ${userEmail} (scheduled for ${reportDay} ${reportHour}:00 ${leaderTimezone})`)

                    // Call send-weekly-reminder for this leader (SCOPE: LEADER)
                    await supabase.functions.invoke('send-weekly-reminder', {
                        body: { userEmail, scope: 'leader' }
                    })

                    // Update leader last_sent timestamp
                    await supabase
                        .from('email_notification_settings')
                        .update({ leader_weekly_report_last_sent: now.toISOString() })
                        .eq('user_id', userId)

                    weeklyReminderCount++
                }
            }
        }

        return new Response(JSON.stringify({
            success: true,
            timestamp: now.toISOString(),
            daily_briefs_sent: dailyBriefCount,
            weekly_reminders_sent: weeklyReminderCount
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (err: any) {
        console.error('Scheduler error:', err)
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
