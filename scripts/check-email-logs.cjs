const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://yjvrluwawbrnecaeoiax.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdnJsdXdhd2JybmVjYWVvaWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0NTk2MSwiZXhwIjoyMDgyMzIxOTYxfQ.0jNDiIyE72ZR6Sl9aAdFVKaCYexnMqAg8h4Zl51GYYQ";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLogs() {
    console.log("🔍 Checking 'emails_log' table for recent entries...");

    const { data, error } = await supabase
        .from('emails_log')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("❌ Error fetching logs:", error);
    } else {
        console.log(`✅ Found ${data.length} recent logs:`);
        console.table(data.map(l => ({
            id: l.id,
            type: l.email_type,
            to: l.recipient_email,
            subject: l.subject,
            time: l.sent_at,
            error: l.error_message
        })));
    }
}

checkLogs();
