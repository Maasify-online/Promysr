import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://yjvrluwawbrnecaeoiax.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdnJsdXdhd2JybmVjYWVvaWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0NTk2MSwiZXhwIjoyMDgyMzIxOTYxfQ.0jNDiIyE72ZR6Sl9aAdFVKaCYexnMqAg8h4Zl51GYYQ";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testInvitation() {
    console.log("🧪 Testing invitation function directly...");

    // Use a real org ID
    const orgId = "fea31610-85bc-4458-b417-72eb1a92fde8";

    // We need a JWT for an admin user to pass the auth check in the function
    // But the function checks line 43: await supabase.auth.getUser(token)
    // I don't have a user JWT easily.

    // Actually, I can use the service role key to insert DIRECTLY and skip the function 
    // just to see if the DB table works.

    console.log("📝 Attempting direct DB insert into organization_invitations...");

    const { data, error } = await supabase
        .from('organization_invitations')
        .insert({
            organization_id: orgId,
            inviter_id: "20686b90-254b-45e9-a293-d6d25c00df5c", // info@maasify.online
            invitee_email: "test_invitation_success@example.com",
            invitee_name: "Test Success",
            role: "member",
            token: "test-token-" + Date.now()
        })
        .select();

    if (error) {
        console.error("❌ DB Insert Error:", error.message);
    } else {
        console.log("✅ DB Insert Success!", data);
    }
}

testInvitation();
