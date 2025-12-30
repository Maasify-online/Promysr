// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

console.log("Hello from Functions!")

serve(async (req) => {
    // Authorization check (if needed, but for cron/system calls usually secured by key)

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    try {
        // 1. Get Today's Date in IST (Asia/Kolkata)
        // We want to mark promises as missed if due_date < Today (IST)
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const todayIST = formatter.format(now); // YYYY-MM-DD

        console.log(`Checking for promises due before: ${todayIST} (IST)`)

        // 2. Fetch Open Promises where due_date < todayIST
        const { data: missedPromises, error: fetchError } = await supabase
            .from('promises')
            .select('*')
            .eq('status', 'Open')
            .lt('due_date', todayIST)

        if (fetchError) {
            throw fetchError
        }

        console.log(`Found ${missedPromises?.length ?? 0} missed promises.`)

        if (!missedPromises || missedPromises.length === 0) {
            return new Response(
                JSON.stringify({ message: "No missed promises found." }),
                { headers: { "Content-Type": "application/json" } },
            )
        }

        // 3. Update Status to 'Missed' (Silently - No Email)
        const updates = missedPromises.map(async (promise) => {
            // Update DB
            const { error: updateError } = await supabase
                .from('promises')
                .update({ status: 'Missed' })
                .eq('id', promise.id)

            if (updateError) {
                console.error(`Failed to update promise ${promise.id}:`, updateError)
                return null
            }

            console.log(`Marked promise ${promise.id} as Missed. (Silent Update)`)
            return promise.id
        })

        await Promise.all(updates)

        return new Response(
            JSON.stringify({
                message: `Processed ${missedPromises.length} missed promises.`,
                updatedIds: missedPromises.map(p => p.id)
            }),
            { headers: { "Content-Type": "application/json" } },
        )

    } catch (error) {
        console.error(error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        )
    }
})
