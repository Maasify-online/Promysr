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
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: userError } = await supabase.auth.getUser(token)

        if (userError || !user) {
            console.error("Auth error or user not found:", userError)
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }
        console.log("Authenticated user:", user.email, user.id)

        // 2. Get inviter's profile
        const { data: inviterProfile, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('user_id', user.id)
            .single()

        if (profileError || !inviterProfile) {
            console.error("Inviter profile error:", profileError)
            return new Response(JSON.stringify({ error: 'Inviter profile not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }
        console.log("Inviter profile:", JSON.stringify(inviterProfile))

        // 3. Get organization details
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('name, max_users')
            .eq('id', payload.organization_id)
            .single()

        if (orgError || !org) {
            console.error("Organization error:", orgError)
            return new Response(JSON.stringify({ error: 'Organization not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }
        console.log("Organization found:", org.name)

        // 4. Check if inviter is admin
        const { data: membership } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', payload.organization_id)
            .eq('user_id', inviterProfile.id)
            .single()

        console.log("Membership found:", JSON.stringify(membership))

        if (!membership || membership.role !== 'admin') {
            console.error("Admin check failed. Membership:", membership)
            return new Response(JSON.stringify({ error: 'Only admins can send invitations' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 5. Check seat limit
        const { count: memberCount } = await supabase
            .from('organization_members')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', payload.organization_id)

        console.log("Current member count:", memberCount, "Max seats:", org.max_users)

        if (memberCount !== null && memberCount >= org.max_users) {
            console.error("Seat limit reached")
            return new Response(JSON.stringify({
                error: 'Organization has reached maximum member limit',
                max_users: org.max_users,
                current_count: memberCount
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 6. Check if user is already a member
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', payload.invitee_email.toLowerCase())
            .single()

        if (existingProfile) {
            const { data: existingMember } = await supabase
                .from('organization_members')
                .select('id')
                .eq('organization_id', payload.organization_id)
                .eq('user_id', existingProfile.id)
                .single()

            if (existingMember) {
                console.error("Inviteee is already a member")
                return new Response(JSON.stringify({ error: 'User is already a member of this organization' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }
        }

        // 7. Check for existing pending invitation
        const { data: existingInvite } = await supabase
            .from('organization_invitations')
            .select('id, status')
            .eq('organization_id', payload.organization_id)
            .eq('invitee_email', payload.invitee_email.toLowerCase())
            .eq('status', 'pending')
            .single()

        if (existingInvite) {
            console.error("Pending invitation already exists")
            return new Response(JSON.stringify({
                error: 'An invitation has already been sent to this email',
                invitation_id: existingInvite.id
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 8. Generate secure token
        const token_bytes = new Uint8Array(32)
        crypto.getRandomValues(token_bytes)
        const inviteToken = Array.from(token_bytes, byte => byte.toString(16).padStart(2, '0')).join('')

        // 9. Create invitation record
        console.log("Creating invitation record...")
        const { data: invitation, error: inviteError } = await supabase
            .from('organization_invitations')
            .insert({
                organization_id: payload.organization_id,
                inviter_id: inviterProfile.id,
                invitee_email: payload.invitee_email.toLowerCase(),
                invitee_name: payload.invitee_name,
                role: payload.role || 'member',
                token: inviteToken
            })
            .select()
            .single()

        if (inviteError) {
            console.error('Error creating invitation in DB:', inviteError)
            return new Response(JSON.stringify({ error: 'Failed to create invitation in database' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        console.log("Invitation record created successfully:", invitation.id)

        // 10. Send invitation email
        const inviteLink = `${APP_URL}/accept-invite?token=${inviteToken}`
        console.log("Invite link generated:", inviteLink)

        const emailHtml = `
            <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="margin-bottom: 24px; text-align: center;">
                    <h1 style="font-weight: 800; font-size: 24px; color: #0f172a; font-family: sans-serif; margin: 0 0 12px 0;">
                        Promy<span style="background: linear-gradient(135deg, #00C9B7 0%, #007AFF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Sr</span>
                    </h1>
                    <div style="height: 4px; width: 100%; background: linear-gradient(90deg, #007AFF 0%, #00C9B7 100%); border-radius: 2px;"></div>
                </div>

                <h2 style="color: #1e293b; margin-top: 0;">You're Invited to Join ${org.name}!</h2>
                
                <p style="color: #334155; font-size: 16px;">Hi ${payload.invitee_name || 'there'},</p>
                
                <p style="color: #334155; font-size: 16px;">
                    <strong>${inviterProfile.full_name || inviterProfile.email}</strong> has invited you to join their team on PromySr.
                </p>
                
                <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 20px; border-radius: 8px; margin: 24px 0; border: 1px solid #bae6fd;">
                    <h3 style="margin: 0 0 12px 0; color: #0369a1;">What is PromySr?</h3>
                    <p style="margin: 0; color: #075985;">PromySr helps teams turn commitments into contracts. Track promises, verify completion, and build accountability across your organization.</p>
                </div>

                <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%); color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; margin: 24px 0; font-weight: 600; font-size: 16px;">
                    Accept Invitation
                </a>

                <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
                    This invitation expires in 7 days.
                </p>
                
                <p style="color: #64748b; font-size: 12px; margin-top: 8px;">
                    If you didn't expect this invitation, you can safely ignore this email.
                </p>

                <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                        © 2025 PromySr. All rights reserved.
                    </p>
                </div>
            </div>
        `

        if (!RESEND_API_KEY) {
            console.warn('RESEND_API_KEY not set, skipping email send')
            return new Response(JSON.stringify({
                success: true,
                invitation_id: invitation.id,
                email_sent: false,
                message: 'Invitation created but email not sent (no API key)'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        console.log("Sending email via Resend...")
        const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: 'PromySr <noreply@mail.promysr.com>',
                to: [payload.invitee_email],
                subject: `You're invited to join ${org.name} on PromySr`,
                html: emailHtml
            })
        })

        const emailData = await emailRes.json()

        if (!emailRes.ok) {
            console.error('Email send failed:', emailData)
        } else {
            console.log("Email sent successfully!")
        }

        return new Response(JSON.stringify({
            success: true,
            invitation_id: invitation.id,
            email_sent: emailRes.ok,
            invite_link: inviteLink // For testing
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('Error in send-team-invitation:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
