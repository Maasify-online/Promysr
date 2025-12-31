import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

console.log("Send Team Invitation Edge Function Booting...")

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const APP_URL = Deno.env.get('APP_URL') || 'https://promysr.vercel.app'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface InvitationPayload {
    organization_id: string
    invitee_email: string
    invitee_name?: string
    role?: 'admin' | 'member'
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const payload: InvitationPayload = await req.json()
        console.log("Invitation request payload:", JSON.stringify(payload))

        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

        // 1. Get authenticated user
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            console.error("Missing authorization header")
            return new Response(JSON.stringify({ error: 'No authorization header' }), {
                status: 200, // Changed from 401
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: userError } = await supabase.auth.getUser(token)

        if (userError || !user) {
            console.error("Auth error or user not found:", userError)
            return new Response(JSON.stringify({ error: 'Unauthorized', details: userError?.message }), {
                status: 200, // Changed from 401
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // ... (Skipping unchanged lines)

        if (profileError || !inviterProfile) {
            console.error("Inviter profile error:", profileError)
            return new Response(JSON.stringify({ error: 'Inviter profile not found' }), {
                status: 200, // Changed from 404
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // ...

        if (orgError || !org) {
            console.error("Organization error:", orgError)
            return new Response(JSON.stringify({
                error: 'Organization not found',
                details: `Tried to find org with ID: ${payload.organization_id}`
            }), {
                status: 200, // Changed from 404
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // ...

        if (!membership || membership.role !== 'admin') {
            console.error("Admin check failed. Membership:", membership)
            return new Response(JSON.stringify({
                error: 'Only admins can send invitations',
                details: `User ${inviterProfile.id} is not an admin of org ${payload.organization_id}. Role found: ${membership?.role || 'none'}`
            }), {
                status: 200, // Changed from 403
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // ...

        if (memberCount !== null && memberCount >= org.max_users) {
            console.error("Seat limit reached")
            return new Response(JSON.stringify({
                error: 'Organization has reached maximum member limit',
                max_users: org.max_users,
                current_count: memberCount
            }), {
                status: 200, // Changed from 400
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // ...

        if (existingMember) {
            console.error("Inviteee is already a member")
            return new Response(JSON.stringify({ error: 'User is already a member of this organization' }), {
                status: 200, // Changed from 400
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // ...

        if (existingInvite) {
            console.error("Pending invitation already exists")
            return new Response(JSON.stringify({
                error: 'An invitation has already been sent to this email',
                invitation_id: existingInvite.id
            }), {
                status: 200, // Changed from 400
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // ...

        if (inviteError) {
            console.error('Error creating invitation in DB:', inviteError)
            return new Response(JSON.stringify({ error: 'Failed to create invitation in database' }), {
                status: 200, // Changed from 500
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // ...

    } catch (error) {
        console.error('Error in send-team-invitation:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 200, // Changed from 500
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
