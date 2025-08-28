import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const brevoApiKey = Deno.env.get('BREVO_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('🔔 Starting daily reminder process...');

    // Get all active reminder schedules
    const { data: activeUsers, error: usersError } = await supabase
      .from('reminder_schedules')
      .select('*')
      .eq('is_active', true);

    if (usersError) {
      console.error('❌ Error fetching active users:', usersError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Error fetching active users',
          details: usersError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`📧 Found ${activeUsers?.length || 0} users with active reminders`);

    let successCount = 0;
    let errorCount = 0;

    // Process each user
    for (const user of activeUsers || []) {
      try {
        // Get user profile separately
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('email, full_name')
          .eq('id', user.user_id)
          .single();

        if (profileError || !userProfile) {
          console.log(`⚠️ No profile found for user ${user.user_id}, skipping`);
          continue;
        }

        const shouldSendToday = shouldSendReminderToday(user);
        
        if (shouldSendToday) {
          await sendReminderToUser(supabase, user, userProfile, brevoApiKey);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing user ${user.user_id}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ Daily reminders completed. Success: ${successCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Daily reminders processed successfully',
        stats: {
          totalUsers: activeUsers?.length || 0,
          successCount,
          errorCount
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Unexpected error occurred',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

/**
 * Check if reminder should be sent today
 */
function shouldSendReminderToday(user: any): boolean {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  return user.days_of_week.includes(today);
}

/**
 * Send reminder to specific user
 */
async function sendReminderToUser(supabase: any, user: any, userProfile: any, brevoApiKey?: string) {
  if (!userProfile?.email) {
    throw new Error('User email not found');
  }

  // Send email reminder using Brevo
  if (brevoApiKey) {
    await sendEmailReminder(brevoApiKey, userProfile.email, userProfile.full_name, user.reminder_type);
  }

  // Log reminder sent
  await logReminderSent(supabase, user.user_id, user.reminder_type, 'email');
  
  console.log(`✅ Reminder sent to ${userProfile.email} for ${user.reminder_type}`);
}

/**
 * Send email reminder using Brevo API
 */
async function sendEmailReminder(apiKey: string, email: string, name: string, reminderType: string) {
  const reminderContent = getReminderContent(reminderType, name);
  
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: {
        name: 'ChristianKit',
        email: 'noreply@christiankit.com'
      },
      to: [{
        email: email,
        name: name
      }],
      subject: reminderContent.subject,
      htmlContent: reminderContent.html
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Brevo API error: ${error}`);
  }
}

/**
 * Get reminder content based on type
 */
function getReminderContent(reminderType: string, name: string) {
  const baseSubject = 'Your Daily ChristianKit Reminder';
  const baseGreeting = `Hello ${name || 'there'}!`;
  
  switch (reminderType) {
    case 'prayer':
      return {
        subject: `${baseSubject} - Time to Pray`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4a90e2;">🙏 Prayer Reminder</h2>
            <p>${baseGreeting}</p>
            <p>It's time for your daily prayer session. Take a moment to connect with God and reflect on your blessings.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #28a745; margin-top: 0;">Today's Prayer Focus:</h3>
              <ul>
                <li>🙏 Gratitude for today's blessings</li>
                <li>💝 Pray for others in need</li>
                <li>🌟 Ask for guidance and wisdom</li>
                <li>❤️ Thank God for His love and grace</li>
              </ul>
            </div>
            <p style="color: #6c757d; font-style: italic;">"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God." - Philippians 4:6</p>
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
            <p style="color: #6c757d; font-size: 12px;">This reminder was sent by ChristianKit to help you stay connected with your faith journey.</p>
          </div>
        `
      };
    
    case 'bible':
      return {
        subject: `${baseSubject} - Bible Reading Time`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4a90e2;">📖 Bible Reading Reminder</h2>
            <p>${baseGreeting}</p>
            <p>It's time for your daily Bible reading. Open God's Word and let it speak to your heart today.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #28a745; margin-top: 0;">Today's Reading Suggestion:</h3>
              <ul>
                <li>📚 Start with a Psalm for inspiration</li>
                <li>💡 Read a chapter from the Gospels</li>
                <li>🌟 Reflect on the wisdom of Proverbs</li>
                <li>❤️ Meditate on God's promises</li>
              </ul>
            </div>
            <p style="color: #6c757d; font-style: italic;">"Your word is a lamp for my feet, a light on my path." - Psalm 119:105</p>
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
            <p style="color: #6c757d; font-size: 12px;">This reminder was sent by ChristianKit to help you stay connected with your faith journey.</p>
          </div>
        `
      };
    
    case 'meditation':
      return {
        subject: `${baseSubject} - Meditation Time`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4a90e2;">🧘 Meditation Reminder</h2>
            <p>${baseGreeting}</p>
            <p>It's time for your daily meditation. Find a quiet place and center your mind on God's presence.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #28a745; margin-top: 0;">Today's Meditation Focus:</h3>
              <ul>
                <li>🌿 Find a quiet, comfortable space</li>
                <li>🕊️ Focus on God's peace and presence</li>
                <li>💭 Reflect on today's blessings</li>
                <li>🙏 End with a prayer of gratitude</li>
              </ul>
            </div>
            <p style="color: #6c757d; font-style: italic;">"Be still, and know that I am God." - Psalm 46:10</p>
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
            <p style="color: #6c757d; font-size: 12px;">This reminder was sent by ChristianKit to help you stay connected with your faith journey.</p>
          </div>
        `
      };
    
    case 'journal':
      return {
        subject: `${baseSubject} - Journaling Time`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4a90e2;">📝 Journaling Reminder</h2>
            <p>${baseGreeting}</p>
            <p>It's time for your daily journaling. Write down your thoughts, prayers, and reflections.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #28a745; margin-top: 0;">Today's Journaling Prompts:</h3>
              <ul>
                <li>🙏 What are you grateful for today?</li>
                <li>💭 What did God teach you today?</li>
                <li>🌟 How did you see God working?</li>
                <li>❤️ What's on your heart to pray about?</li>
              </ul>
            </div>
            <p style="color: #6c757d; font-style: italic;">"I will remember the deeds of the Lord; yes, I will remember your miracles of long ago." - Psalm 77:11</p>
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
            <p style="color: #6c757d; font-size: 12px;">This reminder was sent by ChristianKit to help you stay connected with your faith journey.</p>
          </div>
        `
      };
    
    default:
      return {
        subject: baseSubject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4a90e2;">🔔 Daily Reminder</h2>
            <p>${baseGreeting}</p>
            <p>This is your daily reminder from ChristianKit. Take time today to connect with your faith.</p>
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
            <p style="color: #6c757d; font-size: 12px;">This reminder was sent by ChristianKit to help you stay connected with your faith journey.</p>
          </div>
        `
      };
  }
}

/**
 * Log that a reminder was sent
 */
async function logReminderSent(supabase: any, userId: string, reminderType: string, method: string) {
  try {
    const { error } = await supabase
      .from('reminder_logs')
      .insert({
        user_id: userId,
        reminder_type: reminderType,
        delivery_method: method,
        scheduled_for: new Date().toISOString(),
        sent_at: new Date().toISOString()
      });

    if (error) {
      console.error('❌ Error logging reminder:', error);
    } else {
      console.log('✅ Reminder logged successfully');
    }
  } catch (error) {
    console.error('❌ Error logging reminder:', error);
  }
}
