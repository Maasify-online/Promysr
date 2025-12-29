import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            {
                global: {
                    headers: { Authorization: req.headers.get("Authorization")! },
                },
            }
        );

        const {
            data: { user },
        } = await supabaseClient.auth.getUser();

        if (!user) {
            throw new Error("Unauthorized");
        }

        const { planId } = await req.json();

        // Verify Organization Access
        const { data: orgMember } = await supabaseClient
            .from("organization_members")
            .select("organization_id")
            .eq("user_id", user.id)
            .single();

        if (!orgMember?.organization_id) throw new Error("No organization found");
        const orgId = orgMember.organization_id;

        // Call Razorpay API to create order
        const keyId = Deno.env.get("RAZORPAY_KEY_ID");
        const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
        const auth = btoa(`${keyId}:${keySecret}`);

        // Map planId (frontend string) to amount (in paise)
        // Basic: 0, Pro: 199900, Ultimate: 399900
        let amount = 0;
        if (planId === 'pro_1999') amount = 199900;
        else if (planId === 'ultimate_3999') amount = 399900;
        else throw new Error("Invalid Plan ID");

        const resp = await fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: {
                "Authorization": `Basic ${auth}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                amount: amount,
                currency: "INR",
                receipt: `rcpt_${orgId.substr(0, 8)}_${Date.now()}`,
                notes: {
                    organization_id: orgId,
                    user_id: user.id,
                    plan_id: planId
                }
            })
        });

        const order = await resp.json();

        if (!resp.ok) {
            console.error("Razorpay Error:", order);
            throw new Error(order.error?.description || "Failed to create order");
        }

        return new Response(JSON.stringify(order), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
