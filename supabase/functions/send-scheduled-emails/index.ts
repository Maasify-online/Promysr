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

        // Get current time in UTC
        const now = new Date()
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

                const targetUTCHour = (userHour - utcOffset + 24) % 24

                // Calculate User's Current Day of Week
                const userDayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: userTimezone }).toLowerCase()

                // Check if current time matches user's schedule
                const isRightHour = currentUTCHour === Math.floor(targetUTCHour)
                const isRightDay = preferredDays.includes(userDayOfWeek)

                if (isRightHour && isRightDay) {
                    console.log(`Sending Daily Brief to ${userEmail} (scheduled for ${userHour}:00 ${userTimezone})`)

                    // Call send-morning-brief for this specific user
                    await supabase.functions.invoke('send-morning-brief', {
                        body: { userEmail }
                    })

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

                const targetUTCHour = (reminderHour - utcOffset + 24) % 24

                // Calculate User's Current Day of Week
                const userDayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: userTimezone }).toLowerCase()

                // Check if current time matches
                const isRightHour = currentUTCHour === Math.floor(targetUTCHour)
                const isRightDay = userDayOfWeek === reminderDay

                // Check frequency
                let shouldSend = isRightHour && isRightDay

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
                        body: { userEmail }
                    })

                    // Update last_sent timestamp
                    await supabase
                        .from('email_notification_settings')
                        .update({ weekly_reminder_last_sent: now.toISOString() })
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
