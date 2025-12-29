// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.


import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const getBrandingHeader = () => `
    <div style="margin-bottom: 24px; text-align: center;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 12px;">
            <div style="width: 24px; height: 24px; background: linear-gradient(135deg, #007AFF 0%, #00C9B7 100%); border-radius: 6px;"></div>
            <span style="font-weight: 800; font-size: 18px; color: #0f172a; font-family: sans-serif;">PromySr</span>
        </div>
        <div style="height: 4px; width: 100%; background: linear-gradient(90deg, #007AFF 0%, #00C9B7 100%); border-radius: 2px;"></div>
    </div>
`;

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Create Supabase Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { record, type, origin = 'http://localhost:8081' } = await req.json()

        console.log(`Received webhook for ${type}`)

        const header = getBrandingHeader();
        let subject = "Promysr Update";
        let body = "";
        let recipient = record.owner_email || 'user@example.com';
        let emailType = 'notification';

        if (type === 'INSERT') {
            subject = `New Promise: "${record.promise_text?.substring(0, 30)}..."`;
            recipient = record.owner_email || 'user@example.com';
            emailType = 'new_assignment';
            body = `
                <div style="font-family: 'Inter', sans-serif; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px; margin: 0 auto; background-color: white;">
                    ${header}
                    <p style="color: #334155; font-size: 16px;">Hi <strong>${record.owner_name || 'User'}</strong>,</p>
                    <p style="color: #334155; font-size: 16px;">A new promise has been logged:</p>
                    <blockquote style="border-left: 4px solid #007AFF; padding-left: 16px; margin: 24px 0; color: #1e293b; font-size: 18px; font-weight: 500;">
                        "${record.promise_text}"
                    </blockquote>
                    <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                        <p style="margin: 4px 0; color: #64748b; font-size: 14px;"><strong>Due Date:</strong> ${record.due_date}</p>
                    </div>
                    <a href="${origin}/dashboard" style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px;">View in Dashboard</a>
                </div>
            `;
        } else if (type === 'UPDATE' && record.status === 'Closed') {
            subject = `Promise Kept: ${record.owner_name} completed a task`;
            recipient = "leader@example.com";
            emailType = 'promise_completed';
            body = `
                <div style="font-family: 'Inter', sans-serif; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px; margin: 0 auto; background-color: white;">
                    ${header}
                    <p style="color: #334155; font-size: 16px;">Good news!</p>
                    <p style="color: #334155; font-size: 16px;"><strong>${record.owner_name}</strong> has marked a promise as <span style="color: #16a34a; font-weight: bold;">Kept</span>:</p>
                    <blockquote style="border-left: 4px solid #16a34a; padding-left: 16px; margin: 24px 0; color: #1e293b; font-size: 18px; font-weight: 500;">
                        "${record.promise_text}"
                    </blockquote>
                    <a href="${origin}/dashboard" style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px;">View Details</a>
                </div>
            `;
        }

        console.log(`\n--- [EMAIL SIMULATION] ---\nTo: ${recipient}\nSubject: ${subject}\n--------------------------\n`)

        // INSERT INTO LOGS (So Admin Panel sees it)
        try {
            await supabase.from('emails_log').insert({
                recipient_email: recipient,
                subject: subject,
                status: 'delivered', // Simulated success
                sent_at: new Date().toISOString(),
                email_type: emailType,
                promise_id: record.id
            });
            console.log("Logged email to DB");
        } catch (dbError) {
            console.error("Failed to log email to DB:", dbError);
        }

        return new Response(
            JSON.stringify({ message: "Email processed", preview: { subject, recipient } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
