// Paddle Webhook Handler for ChristianKit
// This file should be deployed as a serverless function (Vercel, Netlify, etc.)

import { paddleService } from '../services/paddleService';

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the signature from headers
    const signature = req.headers['paddle-signature'];
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    if (!paddleService.verifyWebhookSignature(payload, signature)) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Handle the webhook event
    await paddleService.handleWebhook(req.body);

    // Log the event for debugging
    console.log('Webhook processed:', req.body.event_type);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

