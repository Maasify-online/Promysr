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
        // 1. Get Today's Date (YYYY-MM-DD)
        const today = new Date().toISOString().split('T')[0]
        console.log(`Checking for promises due before: ${today}`)

        // 2. Fetch Open Promises where due_date < today
        // Note: 'lt' string comparison works for YYYY-MM-DD
        const { data: missedPromises, error: fetchError } = await supabase
            .from('promises')
            .select('*')
            .eq('status', 'Open')
            .lt('due_date', today)

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

        // 3. Update Status to 'Missed'
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

            // Send missed notification email
            try {
                // Fetch leader info from profiles
                const { data: leaderProfile } = await supabase
                    .from('profiles')
                    .select('email, full_name')
                    .eq('id', promise.leader_id)
                    .single()

                // Invoke email notification Edge Function
                const emailResponse = await fetch(
                    `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-promise-notification`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
                        },
                        body: JSON.stringify({
                            type: 'missed',
                            promise_text: promise.promise_text,
                            due_date: promise.due_date,
                            owner_email: promise.owner_email,
                            owner_name: promise.owner_name,
                            leader_email: leaderProfile?.email,
                            leader_name: leaderProfile?.full_name
                        })
                    }
                )

                if (!emailResponse.ok) {
                    console.error(`Failed to send missed notification for promise ${promise.id}`)
                } else {
                    console.log(`Sent missed notification for promise ${promise.id}`)
                }
            } catch (emailErr) {
                console.error(`Email notification error for promise ${promise.id}:`, emailErr)
                // Non-blocking - continue with status update
            }

            console.log(`Marked promise ${promise.id} as Missed.`)
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
