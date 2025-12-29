import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { getEmailTemplate } from "../_shared/emailTemplates.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const APP_URL = Deno.env.get('APP_URL') || 'https://promysr.vercel.app';

interface NotificationPayload {
    type: 'created' | 'missed' | 'closed' | 'due-today' | 'review_needed'
    promise_text: string
    due_date: string
    owner_email: string
    leader_email?: string
    leader_name?: string
    owner_name?: string
    completed_at?: string
    tasks?: Array<{ text: string; due_time?: string }>
    promise_id?: string // Added for action links
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const payload: NotificationPayload = await req.json()
        const { type, owner_email, leader_email, promise_id } = payload

        if (!RESEND_API_KEY) {
            console.error("Missing RESEND_API_KEY")
            return new Response(JSON.stringify({ error: "Server Configuration Error" }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Determine recipient based on notification type
        let to = ""
        switch (type) {
            case 'created':
                to = owner_email // Owner gets notified of new assignment
                // Add action URL for one-click completion
                if (promise_id) {
                    (payload as any).action_url = `${APP_URL}/dashboard?action=complete&id=${promise_id}`;
                }
                break
            case 'missed':
                to = leader_email || owner_email // Leader gets notified of missed promise
                break
            case 'closed':
                to = leader_email || owner_email // Leader gets notified of completion (verified)
                break
            case 'review_needed':
                to = leader_email! // Leader MUST be notified to review
                // Add action URL for leader to verify
                if (promise_id) {
                    (payload as any).action_url = `${APP_URL}/dashboard?action=verify&id=${promise_id}`;
                }
                break;
            case 'due-today':
                to = owner_email // Owner gets daily digest
                break
            default:
                throw new Error(`Invalid notification type: ${type}`)
        }

        // Get HTML template
        const { subject, html } = getEmailTemplate(type, payload)

        // Send email via Resend
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: 'PromySr <noreply@mail.promysr.com>', // Custom domain email
                to: [to],
                subject: subject,
                html: html, // Using HTML instead of plain text
            })
        })

        const data = await res.json()

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: res.status
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
