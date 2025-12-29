import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2023-10-16",
});

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

        const { action, priceId, returnUrl } = await req.json();

        // 1. Get User's Organization
        const { data: orgMember } = await supabaseClient
            .from("organization_members")
            .select("organization_id, organizations(*)")
            .eq("user_id", user.id)
            .single();

        if (!orgMember?.organizations) {
            throw new Error("No organization found");
        }

        const org = orgMember.organizations;
        let customerId = org.stripe_customer_id;

        // 2. Create Stripe Customer if missing
        if (!customerId) {
            // Fetch user email
            const { data: profile } = await supabaseClient.from('profiles').select('email').eq('id', user.id).single();
            const email = profile?.email || user.email;

            const customer = await stripe.customers.create({
                email: email,
                metadata: {
                    organization_id: org.id,
                    supabase_user_id: user.id
                }
            });
            customerId = customer.id;

            // Save to DB
            await supabaseClient
                .from('organizations')
                .update({ stripe_customer_id: customerId })
                .eq('id', org.id);
        }

        // 3. Handle Actions
        if (action === "create-checkout") {
            const session = await stripe.checkout.sessions.create({
                customer: customerId,
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                mode: "subscription",
                success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${returnUrl}`,
                allow_promotion_codes: true,
                metadata: {
                    organization_id: org.id,
                    // Important: Webhook needs this to update the correct org
                }
            });

            return new Response(JSON.stringify({ url: session.url }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        else if (action === "create-portal") {
            const session = await stripe.billingPortal.sessions.create({
                customer: customerId,
                return_url: returnUrl,
            });

            return new Response(JSON.stringify({ url: session.url }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        throw new Error("Invalid action");

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
