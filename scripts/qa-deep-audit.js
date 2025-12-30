
import { createClient } from '@supabase/supabase-js';

// Hardcoded Credentials from qa-quick-test.sh
const supabaseUrl = "https://yjvrluwawbrnecaeoiax.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdnJsdXdhd2JybmVjYWVvaWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0NTk2MSwiZXhwIjoyMDgyMzIxOTYxfQ.0jNDiIyE72ZR6Sl9aAdFVKaCYexnMqAg8h4Zl51GYYQ";

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function audit() {
    console.log("🔍 Starting Deep QA Audit...");
    console.log("--------------------------------");

    // 1. Check Profiles Schema (Integrity Score)
    console.log("\n[1] Checking 'profiles' Schema...");
    const { data: profiles, error: profileError } = await supabase.from('profiles').select('*').limit(1);

    if (profileError) {
        console.error("❌ Failed to fetch profiles:", profileError.message);
    } else if (profiles && profiles.length > 0) {
        const keys = Object.keys(profiles[0]);
        if (keys.includes('integrity_score')) {
            console.log("✅ 'integrity_score' column EXISTS.");
        } else {
            console.log("❌ 'integrity_score' column MISSING. (Confirmed Gap)");
        }
    } else {
        // If no profiles, create a dummy one to inspect keys? No, just warn.
        console.log("⚠️ No profiles found to inspect schema. (Create a user first)");
    }

    // 2. Check Email Logs Table
    console.log("\n[2] Checking 'emails_log' Table...");
    const { data: logs, error: logError } = await supabase.from('emails_log').select('count', { count: 'exact', head: true });
    if (logError) {
        console.error("❌ 'emails_log' table access FAILED:", logError.message);
    } else {
        console.log(`✅ 'emails_log' table EXISTS. Current Log Count: ${logs === null && logError === null ? 'Accessible' : 'Checked'}`);
    }

    // 3. Check Notification Toggles
    console.log("\n[3] Checking Notification Toggles...");
    if (profiles && profiles.length > 0) {
        const p = profiles[0];
        const potentialToggles = ['daily_brief_enabled', 'weekly_reminder_enabled', 'promise_created_enabled'];
        const found = potentialToggles.filter(t => Object.prototype.hasOwnProperty.call(p, t));
        if (found.length === potentialToggles.length) {
            console.log("✅ All Notification Toggles EXIST in profile.");
        } else {
            console.log(`⚠️ Some Toggles Missing. Found: ${found.join(', ')}`);
        }
    }

    console.log("\n--------------------------------");
    console.log("Audit Complete.");
}

audit();
