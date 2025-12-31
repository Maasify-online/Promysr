import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://yjvrluwawbrnecaeoiax.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdnJsdXdhd2JybmVjYWVvaWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0NTk2MSwiZXhwIjoyMDgyMzIxOTYxfQ.0jNDiIyE72ZR6Sl9aAdFVKaCYexnMqAg8h4Zl51GYYQ";

const supabase = createClient(supabaseUrl, supabaseKey);

async function bootstrapOrg() {
    const userEmail = "info@maasify.online";
    console.log(`🚀 bootstrapping org for ${userEmail}...`);

    // 1. Get profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('email', userEmail)
        .single();

    if (!profile) {
        console.error("❌ Profile not found");
        return;
    }

    // 2. Create Organization
    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
            name: "Maasify Online",
            subscription_plan: "pro_1999",
            status: "active"
        })
        .select()
        .single();

    if (orgError) {
        console.error("❌ Org Error:", orgError.message);
        return;
    }

    console.log(`✅ Organization created: ${org.name} (${org.id})`);

    // 3. Add user as admin
    const { error: memError } = await supabase
        .from('organization_members')
        .insert({
            organization_id: org.id,
            user_id: profile.id,
            role: "admin"
        });

    if (memError) {
        console.error("❌ Membership Error:", memError.message);
        return;
    }

    console.log(`✅ User ${userEmail} added as ADMIN to organization.`);
    console.log("\n🎉 Setup complete! Try the invitation system again.");
}

bootstrapOrg();
