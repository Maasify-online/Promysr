import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://yjvrluwawbrnecaeoiax.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdnJsdXdhd2JybmVjYWVvaWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0NTk2MSwiZXhwIjoyMDgyMzIxOTYxfQ.0jNDiIyE72ZR6Sl9aAdFVKaCYexnMqAg8h4Zl51GYYQ";

const supabase = createClient(supabaseUrl, supabaseKey);

async function getLink() {
    const { data, error } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: 'info@maasify.online',
        options: {
            redirectTo: 'http://localhost:8080/dashboard'
        }
    });

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Magic Link:", data.properties.action_link);
    }
}

getLink();
