import { payooerService } from '../services/payooerService';

// This file contains the webhook handler for Payooer payment events
// You can use this in your backend API or serverless function

export interface WebhookRequest {
  body: any;
  headers: {
    'payooer-signature'?: string;
    [key: string]: any;
  };
}

export interface WebhookResponse {
  statusCode: number;
  body: string;
  headers?: Record<string, string>;
}

/**
 * Handle Payooer webhook events
 * This function should be called from your backend API endpoint
 */
export async function handlePayooerWebhook(
  request: WebhookRequest
): Promise<WebhookResponse> {
  try {
    // Verify webhook signature
    const signature = request.headers['payooer-signature'];
    const payload = JSON.stringify(request.body);
    
    if (!signature) {
      console.error('Missing Payooer signature header');
      return {
        statusCode: 400,
        body: 'Missing signature header'
      };
    }
    
    if (!payooerService.verifyWebhookSignature(payload, signature)) {
      console.error('Invalid webhook signature');
      return {
        statusCode: 400,
        body: 'Invalid signature'
      };
    }
    
    // Process the webhook event
    await payooerService.handleWebhook(request.body);
    
    console.log('Webhook processed successfully:', request.body.type);
    
    return {
      statusCode: 200,
      body: 'OK',
      headers: {
        'Content-Type': 'text/plain'
      }
    };
    
  } catch (error) {
    console.error('Webhook processing failed:', error);
    
    return {
      statusCode: 500,
      body: 'Internal server error',
      headers: {
        'Content-Type': 'text/plain'
      }
    };
  }
}

/**
 * Express.js middleware for handling Payooer webhooks
 */
export function payooerWebhookMiddleware(req: any, res: any, next: any) {
  // Verify webhook signature
  const signature = req.headers['payooer-signature'];
  const payload = JSON.stringify(req.body);
  
  if (!signature) {
    return res.status(400).json({ error: 'Missing signature header' });
  }
  
  if (!payooerService.verifyWebhookSignature(payload, signature)) {
    return res.status(400).json({ error: 'Invalid signature' });
  }
  
  // Add webhook data to request for route handlers
  req.payooerWebhook = req.body;
  next();
}

/**
 * Example Express.js route using the middleware
 */
export function setupPayooerWebhookRoutes(app: any) {
  // Apply middleware to webhook routes
  app.use('/api/payooer/webhook', payooerWebhookMiddleware);
  
  // Handle webhook events
  app.post('/api/payooer/webhook', async (req: any, res: any) => {
    try {
      const webhookData = req.payooerWebhook;
      
      // Process the webhook
      await payooerService.handleWebhook(webhookData);
      
      console.log('Webhook processed successfully:', webhookData.type);
      res.status(200).send('OK');
      
    } catch (error) {
      console.error('Webhook processing failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Health check endpoint
  app.get('/api/payooer/health', (req: any, res: any) => {
    res.status(200).json({ 
      status: 'healthy', 
      service: 'payooer-webhook',
      timestamp: new Date().toISOString()
    });
  });
}

/**
 * Example Next.js API route handler
 */
export async function payooerWebhookHandler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Verify webhook signature
    const signature = req.headers['payooer-signature'];
    const payload = JSON.stringify(req.body);
    
    if (!signature) {
      return res.status(400).json({ error: 'Missing signature header' });
    }
    
    if (!payooerService.verifyWebhookSignature(payload, signature)) {
      return res.status(400).json({ error: 'Invalid signature' });
    }
    
    // Process the webhook
    await payooerService.handleWebhook(req.body);
    
    console.log('Webhook processed successfully:', req.body.type);
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('Webhook processing failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Example Vercel serverless function
 */
export default async function handler(req: any, res: any) {
  return payooerWebhookHandler(req, res);
}
