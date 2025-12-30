import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://yjvrluwawbrnecaeoiax.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdnJsdXdhd2JybmVjYWVvaWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0NTk2MSwiZXhwIjoyMDgyMzIxOTYxfQ.0jNDiIyE72ZR6Sl9aAdFVKaCYexnMqAg8h4Zl51GYYQ";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLogs() {
    console.log("🔍 Checking Email Logs for today...");

    // Get start of today (UTC or local approximations)
    // Just get last 10 emails
    const { data: logs, error } = await supabase
        .from('emails_log')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error("❌ Failed to fetch logs:", error.message);
        return;
    }

    if (!logs || logs.length === 0) {
        console.log("⚠️ No active logs found.");
    } else {
        console.table(logs.map(l => ({
            recipient: l.recipient_email,
            type: l.email_type,
            sent_at: l.sent_at,
            status: l.status
        })));
    }
}

checkLogs();
