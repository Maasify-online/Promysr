import { createClient } from '@supabase/supabase-js';

// Hardcoded Credentials from qa-quick-test.sh
const supabaseUrl = "https://yjvrluwawbrnecaeoiax.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdnJsdXdhd2JybmVjYWVvaWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0NTk2MSwiZXhwIjoyMDgyMzIxOTYxfQ.0jNDiIyE72ZR6Sl9aAdFVKaCYexnMqAg8h4Zl51GYYQ";

const supabase = createClient(supabaseUrl, supabaseKey);

async function recalc() {
    console.log("🔄 Forcing Score Recalculation...");

    // Get a user ID (from profiles)
    const { data: profiles } = await supabase.from('profiles').select('user_id').limit(1);

    if (profiles && profiles.length > 0) {
        const uid = profiles[0].user_id;
        console.log(`Recalculating for user: ${uid}`);

        // Call database function directly via RPC
        const { data, error } = await supabase.rpc('calculate_user_integrity_score', { target_user_id: uid });

        if (error) {
            console.error("❌ RPC Failed:", error.message);
        } else {
            console.log(`✅ Recalculated Score: ${data}%`);
        }
    } else {
        console.error("No profiles found.");
    }
}

recalc();
