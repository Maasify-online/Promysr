import { createClient } from '@supabase/supabase-js';

// Hardcoded Credentials from qa-quick-test.sh
const supabaseUrl = "https://yjvrluwawbrnecaeoiax.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdnJsdXdhd2JybmVjYWVvaWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0NTk2MSwiZXhwIjoyMDgyMzIxOTYxfQ.0jNDiIyE72ZR6Sl9aAdFVKaCYexnMqAg8h4Zl51GYYQ";

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function markLastMissed() {
    console.log("🔍 Finding latest promise...");

    // Get latest promise
    const { data: promises, error } = await supabase
        .from('promises')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error || !promises || promises.length === 0) {
        console.error("❌ No promises found to update.");
        return;
    }

    const p = promises[0];
    console.log(`Found Promise: ${p.id} - "${p.promise_text}" (Status: ${p.status})`);

    // Update to Missed
    const { error: updateError } = await supabase
        .from('promises')
        .update({ status: 'Missed' })
        .eq('id', p.id);

    if (updateError) {
        console.error("❌ Failed to update:", updateError.message);
    } else {
        console.log(`✅ Updated Promise ${p.id} to 'Missed'.`);
        console.log("Integrity Score trigger should fire automatically.");
    }
}

markLastMissed();
