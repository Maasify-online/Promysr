const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://yjvrluwawbrnecaeoiax.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdnJsdXdhd2JybmVjYWVvaWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0NTk2MSwiZXhwIjoyMDgyMzIxOTYxfQ.0jNDiIyE72ZR6Sl9aAdFVKaCYexnMqAg8h4Zl51GYYQ";

async function fetchLogs() {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get the Organization ID for "Maasify Online"
    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', 'Maasify Online')
        .maybeSingle();

    if (orgError || !org) {
        console.error("Could not find organization:", orgError);
        // Fallback or exit
        return;
    }

    console.log(`✅ Found Organization ID: ${org.id}`);

    // 2. Try to sign in to get a REAL user token
    // Note: If password changed, this might fail.
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'info@maasify.online',
        password: 'password123'
    });

    let token = supabaseServiceKey;
    if (loginData?.session) {
        console.log("✅ Logged in as info@maasify.online");
        token = loginData.session.access_token;
    } else {
        console.warn("⚠️ Login failed (likely wrong password). Using Service Key (result might be 'Unauthorized' if function checks user table).");
    }

    // 3. Invoke Function with a RANDOM email
    const testEmail = `debug_test_${Date.now()}@example.com`;
    console.log(`🚀 Invoking Edge Function for ${testEmail}...`);

    const payload = {
        organization_id: org.id,
        invitee_email: testEmail,
        invitee_name: "Debug Test User",
        role: "member"
    };

    const { data, error } = await supabase.functions.invoke('send-team-invitation', {
        body: payload,
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (error) {
        console.log("\n❌ Function Invocation Error (Network/HTTP level):");
        console.log(error);
    }

    if (data) {
        console.log("\n✅ Function Response Body:");
        console.log(JSON.stringify(data, null, 2));
    }
}

fetchLogs();
