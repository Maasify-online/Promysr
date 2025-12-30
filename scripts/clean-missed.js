import { createClient } from '@supabase/supabase-js';

// Hardcoded Credentials from qa-quick-test.sh
const supabaseUrl = "https://yjvrluwawbrnecaeoiax.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdnJsdXdhd2JybmVjYWVvaWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0NTk2MSwiZXhwIjoyMDgyMzIxOTYxfQ.0jNDiIyE72ZR6Sl9aAdFVKaCYexnMqAg8h4Zl51GYYQ";

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanMissed() {
    console.log("🔍 Scanning for Overdue Promises...");

    const today = new Date().toISOString();

    // Find Open Overdue
    const { data: overdue, error } = await supabase
        .from('promises')
        .select('*')
        .eq('status', 'Open')
        .lt('due_date', today); // due_date < now (assuming date string YYYY-MM-DD works with ISO comparison if format is correct)

    if (error) {
        console.error("❌ Scan Failed:", error.message);
        return;
    }

    if (!overdue || overdue.length === 0) {
        console.log("✅ No overdue promises found.");
        return;
    }

    console.log(`⚠️ Found ${overdue.length} overdue promises. Updating to 'Missed'...`);

    let updatedCount = 0;
    for (const p of overdue) {
        const { error: updateError } = await supabase
            .from('promises')
            .update({ status: 'Missed' })
            .eq('id', p.id);

        if (updateError) {
            console.error(`❌ Failed to update ${p.id}:`, updateError.message);
        } else {
            updatedCount++;
        }
    }

    console.log(`✅ Update Complete. ${updatedCount} promises marked as Missed.`);
    console.log("Integrity Scores should auto-update via triggers.");
}

cleanMissed();
