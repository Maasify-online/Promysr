import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://yjvrluwawbrnecaeoiax.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdnJsdXdhd2JybmVjYWVvaWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0NTk2MSwiZXhwIjoyMDgyMzIxOTYxfQ.0jNDiIyE72ZR6Sl9aAdFVKaCYexnMqAg8h4Zl51GYYQ";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInvitations() {
    console.log("🔍 Checking recent invitations...\n");

    const { data: invitations, error } = await supabase
        .from('organization_invitations')
        .select(`
            *,
            organization:organizations(name),
            inviter:profiles!inviter_id(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("❌ Error:", error.message);
        return;
    }

    if (!invitations || invitations.length === 0) {
        console.log("⚠️ No invitations found in database");
        return;
    }

    console.log(`Found ${invitations.length} invitation(s):\n`);

    invitations.forEach((inv, idx) => {
        console.log(`${idx + 1}. Invitation ID: ${inv.id}`);
        console.log(`   Organization: ${inv.organization?.name || 'Unknown'}`);
        console.log(`   Inviter: ${inv.inviter?.full_name || 'Unknown'} (${inv.inviter?.email || 'Unknown'})`);
        console.log(`   Invitee: ${inv.invitee_name || 'Unknown'} (${inv.invitee_email})`);
        console.log(`   Role: ${inv.role}`);
        console.log(`   Status: ${inv.status}`);
        console.log(`   Token: ${inv.token.substring(0, 16)}...`);
        console.log(`   Created: ${new Date(inv.created_at).toLocaleString()}`);
        console.log(`   Expires: ${new Date(inv.expires_at).toLocaleString()}`);
        console.log(`   Invite Link: https://promysr.vercel.app/accept-invite?token=${inv.token}`);
        console.log('');
    });
}

checkInvitations();
