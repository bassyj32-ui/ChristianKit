import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  html: string
  text?: string
  userId?: string
  notificationType?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, text, userId, notificationType }: EmailRequest = await req.json()

    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ error: 'Missing required fields: to, subject, html' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Send email using your preferred provider (SendGrid, AWS SES, etc.)
    const emailResult = await sendEmailViaProvider(to, subject, html, text)

    // Record notification in database if userId provided
    if (userId) {
      await supabase
        .from('user_notifications')
        .insert({
          user_id: userId,
          notification_type: notificationType || 'email',
          title: subject,
          message: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for plain text
          status: emailResult.success ? 'delivered' : 'failed',
          metadata: {
            email_provider: 'sendgrid', // or 'aws_ses'
            provider_response: emailResult,
            recipient: to
          }
        })
    }

    return new Response(JSON.stringify({
      success: emailResult.success,
      message: emailResult.message,
      email_id: emailResult.emailId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in send-email function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function sendEmailViaProvider(to: string, subject: string, html: string, text?: string) {
  // Option 1: Resend Integration (Recommended)
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (resendApiKey) {
    return await sendViaResend(to, subject, html, text, resendApiKey)
  }

  // Option 2: SendGrid Integration
  const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')
  if (sendGridApiKey) {
    return await sendViaSendGrid(to, subject, html, text, sendGridApiKey)
  }

  // Option 3: AWS SES Integration
  const awsAccessKey = Deno.env.get('AWS_ACCESS_KEY_ID')
  if (awsAccessKey) {
    return await sendViaAWSSES(to, subject, html, text)
  }

  // Fallback: Log email (for development)
  console.log('Email would be sent:', { to, subject, html, text })
  return {
    success: true,
    message: 'Email logged (no provider configured)',
    emailId: `dev_${Date.now()}`
  }
}

async function sendViaResend(to: string, subject: string, html: string, text: string | undefined, apiKey: string) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ChristianKit <noreply@christiankit.com>',
        to: [to],
        subject: subject,
        html: html,
        text: text
      })
    })

    if (response.ok) {
      const result = await response.json()
      return {
        success: true,
        message: 'Email sent successfully via Resend',
        emailId: result.id || `resend_${Date.now()}`
      }
    } else {
      const error = await response.text()
      return {
        success: false,
        message: `Resend error: ${error}`,
        emailId: null
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `Resend error: ${error}`,
      emailId: null
    }
  }
}

async function sendViaSendGrid(to: string, subject: string, html: string, text: string | undefined, apiKey: string) {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: 'noreply@christiankit.com', name: 'ChristianKit' },
        subject: subject,
        content: [
          { type: 'text/html', value: html },
          ...(text ? [{ type: 'text/plain', value: text }] : [])
        ]
      })
    })

    if (response.ok) {
      const result = await response.json()
      return {
        success: true,
        message: 'Email sent successfully',
        emailId: result.id || `sg_${Date.now()}`
      }
    } else {
      const error = await response.text()
      return {
        success: false,
        message: `SendGrid error: ${error}`,
        emailId: null
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `SendGrid error: ${error}`,
      emailId: null
    }
  }
}

async function sendViaAWSSES(to: string, subject: string, html: string, text: string | undefined) {
  // AWS SES implementation would go here
  // This is a placeholder - you'd need to implement AWS SES SDK
  console.log('AWS SES not implemented yet')
  return {
    success: false,
    message: 'AWS SES not implemented',
    emailId: null
  }
}
