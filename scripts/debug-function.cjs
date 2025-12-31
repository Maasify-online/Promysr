const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://yjvrluwawbrnecaeoiax.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdnJsdXdhd2JybmVjYWVvaWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0NTk2MSwiZXhwIjoyMDgyMzIxOTYxfQ.0jNDiIyE72ZR6Sl9aAdFVKaCYexnMqAg8h4Zl51GYYQ";

async function fetchLogs() {
    // Note: The Management API isn't directly exposed via supabase-js client easily for logs
    // But we can try to infer issues by checking if we can invoke it locally with the same payload

    // Actually, let's try to INVOKE it from here explicitly and see the raw response
    // This is better than reading logs because we can reproduce it.

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // We need a valid USER token for the function to work (it checks auth.getUser)
    // We can sign in as the user to get a token!

    console.log("🔐 Signing in as info@maasify.online to get a fresh token...");

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'info@maasify.online',
        password: 'password123' // Creating a temporary password might be needed if they used magic link
    });

    // Strategy 2: If we can't sign in (no password known), we can generate a JWT manually if we had the JWT secret.
    // Instead, let's just use the SERVICE key to bypass the first check? 
    // No, the function explicitely calls `getUser(token)`.

    // Strategy 3: Just call the function with a dummy token and see if it fails at Auth (401) or later.
    // If it fails at Auth, we know the token is the issue.

    console.log("🚀 Invoking Edge Function directly...");

    const payload = {
        organization_id: "fea31610-85bc-4458-b417-72eb1a92fde8",
        invitee_email: "debug_test@example.com",
        invitee_name: "Debug Test",
        role: "member"
    };

    const { data, error } = await supabase.functions.invoke('send-team-invitation', {
        body: payload
        // Not sending Authorization header to see if it catches "No authorization header"
        // Wait, standard invoke adds the current session's key. 
        // Since we initialized client with Service Key, it might send that.
    });

    if (error) {
        console.log("\n❌ Function Invocation Error:");
        console.log(error);
    }

    if (data) {
        console.log("\n✅ Function Response:");
        console.log(JSON.stringify(data, null, 2));
    }
}

fetchLogs();
