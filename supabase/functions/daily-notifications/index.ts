import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if this is a test request
    const body = await req.json().catch(() => ({}));
    const isTest = body.test === true;
    const testUserId = body.userId;

    if (isTest) {
      console.log('🧪 Test notification requested');
      return await handleTestNotification(supabase, testUserId);
    }

    console.log('🔔 Starting daily notification process...');

    // Check if this is an automated run
    const isAutomated = body.automated === true;
    const targetTimezone = body.timezone || 'UTC';
    
    if (isAutomated) {
      console.log('🤖 Automated daily notification run started');
    }

    // Get all users who have notifications enabled and it's their notification time
    const { data: users, error: usersError } = await supabase
      .from('user_notification_preferences')
      .select(`
        *,
        user_profiles!inner(id, experience_level, email)
      `)
      .eq('daily_spiritual_messages', true)
      .eq('is_active', true);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      throw usersError;
    }

    console.log(`📊 Found ${users?.length || 0} users with notifications enabled`);

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No users to notify',
        processed: 0
      }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    // Process notifications for each user
    for (const user of users) {
      try {
        processedCount++;
        console.log(`📤 Processing notification for user: ${user.user_id}`);

        // Check if user already received notification today
        const today = new Date().toISOString().split('T')[0];
        const { data: existingNotification } = await supabase
          .from('user_notifications')
          .select('id')
          .eq('user_id', user.user_id)
          .eq('notification_type', 'daily_spiritual_message')
          .gte('created_at', `${today}T00:00:00.000Z`)
          .lt('created_at', `${today}T23:59:59.999Z`)
          .single();

        if (existingNotification) {
          console.log(`⏭️ User ${user.user_id} already received notification today`);
          continue;
        }

        // Check if it's the right time for this user
        if (!isNotificationTime(user)) {
          console.log(`⏰ Not notification time for user ${user.user_id}`);
          continue;
        }

        // Generate personalized message
          const message = await generatePersonalizedMessage(user);
          
        // Send push notification if user has push subscriptions
        const { data: pushSubscriptions } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', user.user_id)
          .eq('is_active', true);

        if (pushSubscriptions && pushSubscriptions.length > 0) {
          await sendPushNotifications(supabase, pushSubscriptions, message);
        }

        // Send email notification if enabled
        if (user.email_notifications && user.user_profiles?.email) {
          await sendEmailNotification(user.user_profiles.email, message);
        }

        // Log the notification
          await supabase
          .from('user_notifications')
          .insert({
            user_id: user.user_id,
            notification_type: 'daily_spiritual_message',
            title: message.title,
            message: message.message,
            status: 'sent',
            metadata: {
              verse: message.verse,
              reference: message.reference,
              experience_level: user.user_profiles?.experience_level
            }
          });

          successCount++;
        console.log(`✅ Notification sent successfully to user: ${user.user_id}`);

      } catch (error) {
        errorCount++;
        console.error(`❌ Error processing user ${user.user_id}:`, error);

        // Log failed notification
        await supabase
          .from('user_notifications')
          .insert({
            user_id: user.user_id,
            notification_type: 'daily_spiritual_message',
            title: 'Failed to send notification',
            message: error.message,
            status: 'failed',
            metadata: { error: error.message }
          });
      }
    }

    console.log(`📊 Daily notifications complete: ${successCount} sent, ${errorCount} failed`);

    // Log automation run for monitoring
    if (isAutomated) {
      try {
        await supabase
          .from('automation_logs')
          .insert({
            job_type: 'daily_notifications',
            run_time: new Date().toISOString(),
            users_processed: processedCount,
            notifications_sent: successCount,
            errors: errorCount,
            metadata: {
              timezone: targetTimezone,
              total_eligible_users: users?.length || 0,
              automated: true
            }
          });
        console.log('✅ Automation run logged successfully');
      } catch (logError) {
        console.error('❌ Failed to log automation run:', logError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Daily notifications processed',
      stats: {
        processed: processedCount,
        successful: successCount,
        failed: errorCount,
        automated: isAutomated,
        timezone: targetTimezone
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error in daily notification function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
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
 * Handle test notification request
 */
async function handleTestNotification(supabase: any, userId: string | undefined) {
  try {
    if (!userId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User ID required for test notification' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🧪 Sending test notification to user: ${userId}`);

    // Get user data - first get preferences, then get profile separately
    const { data: prefs, error: prefsError } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefsError || !prefs) {
      console.error('❌ User preferences not found:', prefsError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User notification preferences not found' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, experience_level, email')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('❌ User profile not found:', profileError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User profile not found' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate test message
    const testMessage = await generatePersonalizedMessage({
      user_id: userId,
      user_profiles: profile,
      ...prefs
    });

    // Get push subscriptions for test
    const { data: pushSubscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    // Send push notification if available
    if (pushSubscriptions && pushSubscriptions.length > 0) {
      await sendPushNotifications(supabase, pushSubscriptions, {
        ...testMessage,
        title: "🧪 " + testMessage.title
      });
    }

    // Log the test notification
    await supabase
      .from('user_notifications')
      .insert({
        user_id: userId,
        notification_type: 'daily_spiritual_message',
        title: "🧪 " + testMessage.title,
        message: testMessage.message,
        status: 'sent',
        metadata: {
          test: true,
          verse: testMessage.verse,
          reference: testMessage.reference
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test notification sent successfully!',
        details: {
          user_id: userId,
          message_sent: testMessage.title,
          push_subscriptions: pushSubscriptions?.length || 0
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Error in test notification:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Test notification failed',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

/**
 * Check if it's the right time to send notification for this user
 */
function isNotificationTime(user: any): boolean {
  const now = new Date();
  const userHour = now.getHours(); // This should consider user's timezone in production
  
  // Default notification time is 8 AM if not specified
  const preferredHour = user.preferred_time_hour || 8;
  
  // Allow notifications within 1 hour window
  return Math.abs(userHour - preferredHour) <= 1;
}

/**
 * Generate personalized spiritual message based on user's experience level
 */
async function generatePersonalizedMessage(user: any) {
  const experienceLevel = user.user_profiles?.experience_level || 'beginner';
  
  const messages = {
    beginner: [
      {
        title: "Daily Encouragement",
        message: "God loves you unconditionally. Take a moment today to feel His presence in your life.",
        verse: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, to give you hope and a future.",
        reference: "Jeremiah 29:11"
      },
      {
        title: "Finding Peace",
        message: "In times of worry, remember that God is with you. Cast your anxieties on Him.",
        verse: "Cast all your anxiety on him because he cares for you.",
        reference: "1 Peter 5:7"
      },
      {
        title: "God's Love",
        message: "You are fearfully and wonderfully made by God. You have incredible worth and purpose.",
        verse: "I praise you because I am fearfully and wonderfully made; your works are wonderful, I know that full well.",
        reference: "Psalm 139:14"
      }
    ],
    intermediate: [
      {
        title: "Growing in Faith",
        message: "Continue to grow in your relationship with God. He is refining you like gold through fire.",
        verse: "In all this you greatly rejoice, though now for a little while you may have had to suffer grief in all kinds of trials.",
        reference: "1 Peter 1:6"
      },
      {
        title: "Serving Others",
        message: "Look for opportunities to serve others today. In serving them, you serve Christ.",
        verse: "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.",
        reference: "Colossians 3:23"
      },
      {
        title: "Walking in Truth",
        message: "Let God's word guide your decisions today. His wisdom surpasses all understanding.",
        verse: "Trust in the Lord with all your heart and lean not on your own understanding.",
        reference: "Proverbs 3:5"
      }
    ],
    advanced: [
      {
        title: "Leading Others",
        message: "As you mature in faith, remember to lift others up and point them toward Christ.",
        verse: "Iron sharpens iron, and one man sharpens another.",
        reference: "Proverbs 27:17"
      },
      {
        title: "Deeper Understanding",
        message: "Seek to understand God's heart more deeply through prayer and meditation on His word.",
        verse: "But when he, the Spirit of truth, comes, he will guide you into all the truth.",
        reference: "John 16:13"
      },
      {
        title: "Kingdom Purpose",
        message: "You are called to be salt and light in this world. Let your life reflect Christ's love.",
        verse: "You are the light of the world. A town built on a hill cannot be hidden.",
        reference: "Matthew 5:14"
      }
    ]
  };

  const levelMessages = messages[experienceLevel as keyof typeof messages] || messages.beginner;
  const randomMessage = levelMessages[Math.floor(Math.random() * levelMessages.length)];
  
  return randomMessage;
}

/**
 * Send push notifications to user's devices
 */
async function sendPushNotifications(supabase: any, subscriptions: any[], message: any) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  
  for (const subscription of subscriptions) {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          subscription: subscription.subscription_data,
        payload: {
          title: message.title,
          body: message.message,
            icon: '/icon-192x192.png',
            badge: '/icon-72x72.png',
          data: {
            verse: message.verse,
            reference: message.reference,
              url: '/'
            }
          }
        })
      });

      if (!response.ok) {
        console.error(`❌ Failed to send push notification:`, await response.text());
      } else {
        console.log(`✅ Push notification sent successfully`);
      }
  } catch (error) {
      console.error(`❌ Error sending push notification:`, error);
    }
  }
}

/**
 * Send email notification using Brevo
 */
async function sendEmailNotification(email: string, message: any) {
  const brevoApiKey = Deno.env.get('BREVO_API_KEY');
  
  if (!brevoApiKey) {
    console.log('📧 Brevo API key not configured, skipping email notification');
    return;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': brevoApiKey
      },
      body: JSON.stringify({
        sender: {
          name: 'ChristianKit',
          email: 'notifications@christiankit.app'
        },
        to: [{
          email: email
        }],
        subject: message.title,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">${message.title}</h2>
            <p style="font-size: 16px; line-height: 1.6;">${message.message}</p>
            <blockquote style="border-left: 4px solid #4F46E5; padding-left: 16px; margin: 20px 0; font-style: italic;">
              "${message.verse}"
              <footer style="margin-top: 8px; font-weight: bold;">- ${message.reference}</footer>
            </blockquote>
            <p style="color: #666; font-size: 14px;">
              Blessings,<br>
              The ChristianKit Team
            </p>
          </div>
        `
      })
    });

    if (response.ok) {
      console.log(`📧 Email notification sent successfully to ${email}`);
    } else {
      console.error(`❌ Failed to send email notification:`, await response.text());
    }
  } catch (error) {
    console.error(`❌ Error sending email notification:`, error);
  }
}