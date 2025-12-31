import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://yjvrluwawbrnecaeoiax.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdnJsdXdhd2JybmVjYWVvaWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0NTk2MSwiZXhwIjoyMDgyMzIxOTYxfQ.0jNDiIyE72ZR6Sl9aAdFVKaCYexnMqAg8h4Zl51GYYQ";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPermission() {
    const userEmail = "info@maasify.online";
    console.log(`🔍 checking permissions for ${userEmail}...`);

    // 1. Get user profile
    const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('id, user_id, full_name')
        .eq('email', userEmail)
        .single();

    if (pError) {
        console.error("❌ Profile Error:", pError.message);
        return;
    }

    console.log(`✅ Profile found: ${profile.id} (user_id: ${profile.user_id})`);

    // 2. Get memberships
    const { data: memberships, error: mError } = await supabase
        .from('organization_members')
        .select(`
            role,
            organization:organizations(id, name)
        `)
        .eq('user_id', profile.id);

    if (mError) {
        console.error("❌ Membership Error:", mError.message);
        return;
    }

    if (!memberships || memberships.length === 0) {
        console.log("⚠️ No memberships found for this user in organizations table");
    } else {
        console.log(`✅ Found ${memberships.length} membership(s):`);
        memberships.forEach(m => {
            console.log(`   - Org: ${m.organization.name} (${m.organization.id})`);
            console.log(`     Role: ${m.role}`);
        });
    }
}

checkPermission();
