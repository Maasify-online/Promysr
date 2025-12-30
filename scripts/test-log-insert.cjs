
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://yjvrluwawbrnecaeoiax.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdnJsdXdhd2JybmVjYWVvaWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0NTk2MSwiZXhwIjoyMDgyMzIxOTYxfQ.0jNDiIyE72ZR6Sl9aAdFVKaCYexnMqAg8h4Zl51GYYQ";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log("🛠 Attempting to insert a test log entry...");

    // Matches the payload structure in the edge function
    const TEST_PAYLOAD = {
        promise_id: null,
        email_type: 'created',
        recipient_email: 'info@maasify.online', // User's actual email logic
        subject: 'Verification Test Log (Manual Trigger)',
        status: 'sent',
        sent_at: new Date().toISOString()
    };
    // promise_id: null // Explicitly null


    const { data, error } = await supabase
        .from('emails_log')
        .insert(TEST_PAYLOAD)
        .select();

    if (error) {
        console.error("❌ Insertion Failed:", error);
        console.error("Error Code:", error.code);
        console.error("Error Details:", error.details);
        console.error("Error Message:", error.message);
    } else {
        console.log("✅ Insertion Successful:", data);
    }
}

testInsert();
