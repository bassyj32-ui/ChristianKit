import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get current time in user's timezone (default to UTC)
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    // Get users who should receive reminders now
    const { data: users, error: usersError } = await supabase
      .from('user_notification_preferences')
      .select(`
        user_id,
        preferred_time,
        intensity,
        frequency,
        email_enabled,
        push_enabled
      `)
      .eq('email_enabled', true)

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return new Response(JSON.stringify({ error: 'Failed to fetch users' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const remindersSent = []

    for (const user of users || []) {
      try {
        // Parse preferred time
        const [preferredHour, preferredMinute] = user.preferred_time.split(':').map(Number)
        
        // Check if it's time to send reminder (within 5 minutes of preferred time)
        const timeDiff = Math.abs((currentHour * 60 + currentMinute) - (preferredHour * 60 + preferredMinute))
        
        if (timeDiff <= 5) {
          // Get user's recent activity
          const { data: recentSessions } = await supabase
            .from('user_sessions')
            .select('*')
            .eq('user_id', user.user_id)
            .gte('session_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0])
            .order('created_at', { ascending: false })

          // Get user's goals
          const { data: goals } = await supabase
            .from('user_goals')
            .select('*')
            .eq('user_id', user.user_id)

          // Create personalized message based on intensity and recent activity
          const message = createPersonalizedMessage(user.intensity, recentSessions || [], goals || [])

          // Send email reminder
          await sendEmailReminder(user.user_id, message, supabase)

          remindersSent.push({
            user_id: user.user_id,
            message: message,
            sent_at: new Date().toISOString()
          })
        }
      } catch (error) {
        console.error(`Error processing user ${user.user_id}:`, error)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      reminders_sent: remindersSent.length,
      details: remindersSent
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in daily reminder function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function createPersonalizedMessage(intensity: string, recentSessions: any[], goals: any[]): string {
  const completedToday = recentSessions.filter(s => s.completed).length
  const totalGoals = goals.length

  let message = ""

  switch (intensity) {
    case 'gentle':
      message = `Hi there! 🌟 Just a gentle reminder that your spiritual journey awaits. `
      if (completedToday > 0) {
        message += `Great job completing ${completedToday} session${completedToday > 1 ? 's' : ''} today! `
      }
      message += `Take a moment to connect with God today.`
      break

    case 'motivating':
      message = `Hey! ✨ Ready to grow spiritually today? `
      if (completedToday > 0) {
        message += `You've already completed ${completedToday} session${completedToday > 1 ? 's' : ''} - amazing! `
      }
      message += `Let's keep the momentum going with your daily practice.`
      break

    case 'aggressive':
      message = `WAKE UP! 🔥 Your spiritual growth is waiting! `
      if (completedToday === 0) {
        message += `You haven't completed any sessions today - time to get moving! `
      } else {
        message += `You've done ${completedToday} session${completedToday > 1 ? 's' : ''} - don't stop now! `
      }
      message += `Your future self will thank you!`
      break

    default:
      message = `Time for your daily spiritual practice! 🙏`
  }

  return message
}

async function sendEmailReminder(userId: string, message: string, supabase: any) {
  try {
    // Get user email
    const { data: user } = await supabase.auth.admin.getUserById(userId)
    if (!user?.user?.email) {
      console.error('No email found for user:', userId)
      return
    }

    // For now, we'll just log the email (you'll integrate with SendGrid/AWS SES later)
    console.log(`Would send email to ${user.user.email}: ${message}`)

    // Record notification in database
    await supabase
      .from('user_notifications')
      .insert({
        user_id: userId,
        notification_type: 'email',
        title: 'Daily Spiritual Reminder',
        message: message,
        status: 'sent',
        metadata: { email_sent: true }
      })

  } catch (error) {
    console.error('Error sending email reminder:', error)
  }
}
