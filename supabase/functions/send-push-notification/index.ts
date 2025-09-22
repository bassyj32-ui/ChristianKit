import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { subscription, payload } = await req.json();

    if (!subscription || !payload) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing subscription or payload' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const vapidPublicKey = Deno.env.get('VITE_VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VITE_VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('❌ VAPID keys not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'VAPID keys not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('📤 Sending push notification...');

    // Create the notification payload
    const notificationPayload = JSON.stringify(payload);
    
    // For now, we'll use a simplified approach
    // In production, you'd want to use proper Web Push encryption
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400'
      },
      body: notificationPayload
    });

    if (response.ok) {
      console.log('✅ Push notification sent successfully');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Push notification sent successfully' 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      console.error('❌ Failed to send push notification:', response.status, await response.text());
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to send push notification',
          status: response.status
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('❌ Error sending push notification:', error);
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
 * Create encrypted payload for push notification
 * This is a simplified version - in production you'd want proper encryption
 */
function createEncryptedPayload(payload: any): Uint8Array {
  const payloadString = JSON.stringify(payload);
  return new TextEncoder().encode(payloadString);
}