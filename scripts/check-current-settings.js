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
        console.log(`   ✅ Promise Events: `);
        console.log(`      - Created: ${s.promise_created_enabled ? "ON" : "OFF"}`);
        console.log(`      - Closed:  ${s.promise_closed_enabled ? "ON" : "OFF"}`);
        console.log(`      - Missed:  ${s.promise_missed_enabled ? "ON" : "OFF"}`);
    });
}

checkSettings();
