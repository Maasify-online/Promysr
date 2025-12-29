import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    try {
        const signature = req.headers.get("x-razorpay-signature");
        const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
        const body = await req.text();

        if (!signature || !secret) {
            return new Response("Missing signature or secret", { status: 400 });
        }

        // Verify Signature
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);
        const key = await crypto.subtle.importKey(
            "raw",
            keyData,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["verify", "sign"]
        );
        const signatureBytes = hexToBytes(signature);
        const bodyBytes = encoder.encode(body);
        const verified = await crypto.subtle.verify(
            "HMAC",
            key,
            signatureBytes,
            bodyBytes
        );

        if (!verified) {
            console.error("Invalid Signature");
            return new Response("Invalid signature", { status: 400 });
        }

        const event = JSON.parse(body);
        const payload = event.payload;

        if (event.event === "payment.captured") {
            const payment = payload.payment.entity;
            const notes = payment.notes;
            const orgId = notes.organization_id;
            const planId = notes.plan_id;

            if (orgId && planId) {
                const supabaseClient = createClient(
                    Deno.env.get("SUPABASE_URL") ?? "",
                    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
                );

                await supabaseClient
                    .from("organizations")
                    .update({
                        subscription_plan: planId,
                        status: 'active',
                        // We can store razorpay_payment_id if we add a column later
                    })
                    .eq("id", orgId);

                console.log(`Upgraded Org ${orgId} to ${planId}`);
            }
        }

        return new Response(JSON.stringify({ status: "ok" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});

function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
}
