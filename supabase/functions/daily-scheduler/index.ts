import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Create a Supabase client with the Auth context of the function
        const supabaseClient = createClient(
            // Supabase API URL - env var automatically populated by functions
            Deno.env.get('SUPABASE_URL') ?? '',
            // Supabase Service Role Key - to bypass RLS for admin tasks like Digest
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Get all promises due today
        const today = new Date().toISOString().split('T')[0]
        const currentHour = new Date().getHours();

        // In reality, we would query: .eq('organization.digest_time', `${currentHour}:00`)
        console.log(`[HOURLY CRON] Running for hour: ${currentHour}:00. Checking for organizations with this preference...`)

        const { data: promises, error } = await supabaseClient
            .from('promises')
            .select('*, organization_members(user_id, role)')
            .eq('due_date', today)
            .eq('status', 'Open')

        if (error) throw error

        console.log(`Found ${promises?.length || 0} promises due today (${today})`)

        // 2. Group by Leader/User and Simulate Sending
        // (Logic simplified for simulation)
        const summary = promises?.map(p => `Promise: ${p.promise_text} (Owner: ${p.owner_email})`).join('\n')

        console.log(`[DIGEST SIMULATION] Sending Daily Digest to Leaders: \n${summary}`)

        return new Response(
            JSON.stringify({ message: `Digest processed for ${promises?.length} promises`, summary }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
