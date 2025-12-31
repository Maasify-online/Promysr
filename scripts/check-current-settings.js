import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://yjvrluwawbrnecaeoiax.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdnJsdXdhd2JybmVjYWVvaWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0NTk2MSwiZXhwIjoyMDgyMzIxOTYxfQ.0jNDiIyE72ZR6Sl9aAdFVKaCYexnMqAg8h4Zl51GYYQ";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSettings() {
    console.log("🔍 Fetching Current Notification Settings...");

    // 1. Fetch Settings
    const { data: settings, error: settingsError } = await supabase
        .from('email_notification_settings')
        .select('*');

    if (settingsError) {
        console.error("❌ Failed to fetch settings:", settingsError.message);
        return;
    }

    // 2. Fetch Profiles for names
    const userIds = settings.map(s => s.user_id);
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .in('user_id', userIds);

    // Map for easy lookup
    const profileMap = new Map();
    if (profiles) {
        profiles.forEach(p => profileMap.set(p.user_id, p));
    }

    if (!settings || settings.length === 0) {
        console.log("⚠️ No settings found.");
        return;
    }

    settings.forEach(s => {
        // Safe access to profile data
        const profile = profileMap.get(s.user_id);
        const email = profile?.email || 'Unknown';
        const name = profile?.full_name || 'User';

        console.log(`\n👤 User: ${name} (${email})`);
        console.log(`   ------------------------------------------------`);
        console.log(`   ✅ Daily Brief:       ${s.daily_brief_enabled ? "ON" : "OFF"}`);
        if (s.daily_brief_enabled) {
            console.log(`      🕒 Time: ${s.daily_brief_time} (${s.daily_brief_timezone})`);
            console.log(`      📅 Days: [${s.daily_brief_days ? s.daily_brief_days.join(', ') : 'ALL'}]`);
        }

        console.log(`   ✅ Weekly Reminder:   ${s.weekly_reminder_enabled ? "ON" : "OFF"}`);
        if (s.weekly_reminder_enabled) {
            console.log(`      🕒 Time: ${s.weekly_reminder_time} on ${s.weekly_reminder_day}`);
        }

        console.log(`   ✅ Leader Radar:      ${s.leader_daily_radar_enabled ? "ON" : "OFF"}`);
        if (s.leader_daily_radar_enabled) {
            console.log(`      🕒 Time: ${s.leader_daily_radar_time} (${s.leader_report_timezone || 'Default'})`);
            console.log(`      📅 Days: [${s.leader_daily_radar_days ? s.leader_daily_radar_days.join(', ') : 'Default'}]`);
        }

        console.log(`   ✅ Leader Weekly Report: ${s.leader_weekly_report_enabled ? "ON" : "OFF"}`);
        if (s.leader_weekly_report_enabled) {
            console.log(`      🕒 Time: ${s.leader_weekly_report_time} on ${s.leader_weekly_report_day} (${s.leader_report_timezone || 'Default'})`);
            console.log(`      🔄 Freq: ${s.leader_weekly_report_frequency}`);
        }

        console.log(`   ✅ Leader Events: `);
        console.log(`      - Promise Created: ${s.promise_created_enabled ? "ON" : "OFF"}`);
        console.log(`      - Promise Closed:  ${s.promise_closed_enabled ? "ON" : "OFF"}`);
        console.log(`      - Promise Missed:  ${s.promise_missed_enabled ? "ON" : "OFF"}`);
        console.log(`      - Review Needed:   ${s.review_needed_enabled ? "ON" : "OFF"}`);

        console.log(`   ✅ Task Owner Events: `);
        console.log(`      - Promise Verified:      ${s.promise_verified_enabled ? "ON" : "OFF"}`);
        console.log(`      - Completion Rejected:   ${s.completion_rejected_enabled ? "ON" : "OFF"}`);
    });
}

checkSettings();
