import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
    const signature = req.headers.get("Stripe-Signature");
    const body = await req.text();

    let event;
    try {
        event = await stripe.webhooks.constructEventAsync(
            body,
            signature!,
            Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
            undefined,
            cryptoProvider
        );
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return new Response(err.message, { status: 400 });
    }

    const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Handle the event
    switch (event.type) {
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
            const subscription = event.data.object;
            const customerId = subscription.customer;
            const status = subscription.status;
            // Map Stripe Price ID to Plan Name
            // You might need a mapping function or store price_id directly
            // For now, let's assume metadata or price lookup
            const priceId = subscription.items.data[0].price.id;

            let planName = 'starter_999';
            // MAPPING: You should replace these with your actual Stripe Price IDs
            // if (priceId === Deno.env.get('PRICE_BASIC')) planName = 'basic_999';
            // if (priceId === Deno.env.get('PRICE_PRO')) planName = 'pro_1999';
            // if (priceId === Deno.env.get('PRICE_ULTIMATE')) planName = 'ultimate_3999';
            // For MVP, simplistic mapping logic or metadata from checkout

            // Update Org
            const { error } = await supabaseClient
                .from("organizations")
                .update({
                    status: status === "active" ? "active" : "inactive",
                    stripe_subscription_id: subscription.id,
                    // subscription_plan: planName // Only update if we can map it
                })
                .eq("stripe_customer_id", customerId);

            if (error) console.error("Error updating org:", error);
            break;

        case "checkout.session.completed":
            const session = event.data.object;
            if (session.mode === 'subscription') {
                const orgId = session.metadata?.organization_id;
                const customerId = session.customer;

                if (orgId && customerId) {
                    await supabaseClient
                        .from('organizations')
                        .update({ stripe_customer_id: customerId })
                        .eq('id', orgId);
                }
            }
            break;
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
    });
});
