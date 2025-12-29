import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const BLOCKED_IPS = ["1.2.3.4"]; // Example Blocklist
const BLOCKED_COUNTRIES = ["XX"]; // Example Country Blocklist (requires geo headers)

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const clientCountry = req.headers.get("cf-ipcountry") || "unknown"; // Cloudflare header

    console.log(`Security Check: IP=${clientIp}, Country=${clientCountry}`);

    if (BLOCKED_IPS.includes(clientIp)) {
        return new Response(JSON.stringify({ error: "Access Denied (IP)" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    if (BLOCKED_COUNTRIES.includes(clientCountry)) {
        return new Response(JSON.stringify({ error: "Access Denied (Region)" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Log signup attempt (optional)
    // await logAttempt(clientIp);

    return new Response(JSON.stringify({ status: "allowed", ip: clientIp }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
    });
});
