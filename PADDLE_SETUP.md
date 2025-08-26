# 🚀 Paddle Payment Integration Setup Guide

## 📋 Overview
This guide will help you integrate Paddle as your payment processor for ChristianKit subscriptions. Paddle offers excellent global payment processing, subscription management, and competitive rates.

## 🔑 Required Environment Variables

Add these to your `.env` file:

```env
# Paddle Payment Configuration
VITE_PADDLE_VENDOR_ID=your_paddle_vendor_id_here
VITE_PADDLE_VENDOR_AUTH_CODE=your_paddle_vendor_auth_code_here
VITE_PADDLE_PUBLIC_KEY=your_paddle_public_key_here
VITE_PADDLE_ENVIRONMENT=sandbox
```

## 🏗️ Setup Steps

### 1. Create Paddle Account
1. Visit [Paddle.com](https://www.paddle.com)
2. Sign up for a vendor account
3. Complete business verification
4. Enable API access

### 2. Get API Credentials
1. Log into your Paddle dashboard
2. Navigate to **Developer Tools** → **Authentication**
3. Copy your Vendor ID
4. Generate your Vendor Auth Code
5. Get your Public Key

### 3. Create Products in Paddle
In your Paddle dashboard, create these products:

#### Monthly Plan
- **Product Name**: ChristianKit Pro Monthly
- **Product ID**: `pro_01` (or your preferred ID)
- **Price**: $3.00 USD
- **Billing Type**: Recurring
- **Billing Cycle**: Monthly
- **Features**: All Pro features

#### Yearly Plan
- **Product Name**: ChristianKit Pro Yearly
- **Product ID**: `pro_02` (or your preferred ID)
- **Price**: $30.00 USD
- **Billing Type**: Recurring
- **Billing Cycle**: Yearly
- **Features**: All Pro features + 17% savings

### 4. Configure Webhooks
Set your webhook URL to: `https://yourdomain.com/api/paddle/webhook`

Webhook events to handle:
- `subscription.created`
- `subscription.updated`
- `subscription.cancelled`
- `subscription.payment_succeeded`
- `subscription.payment_failed`

## 🔧 API Integration

### Payment Flow
1. **User selects plan** → Subscription page
2. **Checkout creation** → Paddle API call
3. **Payment processing** → Paddle hosted checkout
4. **Webhook confirmation** → Real-time status update
5. **Subscription activation** → Update user status

### Security Features
- **PCI Compliance**: Paddle handles all sensitive payment data
- **Webhook Verification**: HMAC signature validation
- **HTTPS Only**: All API calls use secure connections
- **Fraud Protection**: Built-in fraud detection

## 📱 Components Overview

### PaddleService
- API integration layer
- Checkout creation
- Subscription management
- Webhook handling
- Error management

### SubscriptionPage
- Plan selection interface
- Pricing display
- Checkout initiation
- Feature comparison

## 🧪 Testing

### Test Mode
Set `VITE_PADDLE_ENVIRONMENT=sandbox` for testing.

### Test Cards
Use these test card numbers for development:
```
Visa: 4000 0000 0000 0002
Mastercard: 5555 5555 5555 4444
American Express: 3782 822463 10005
```

## 🚀 Production Deployment

### 1. Environment Setup
- Set `VITE_PADDLE_ENVIRONMENT=production`
- Use production API keys
- Configure production webhook URL
- Set up SSL certificates

### 2. Monitoring
- Monitor webhook delivery
- Track payment success rates
- Set up error alerting
- Monitor API response times

### 3. Security
- Rotate API keys regularly
- Monitor for suspicious activity
- Implement rate limiting
- Log all payment events

## 💰 Pricing & Fees

### Paddle Fees
- **Transaction Fee**: 5% + $0.50 per transaction
- **International Cards**: No additional fees
- **Subscription Management**: No additional fees
- **Chargeback Fee**: $15 per chargeback

### Your Pricing
- **Monthly Plan**: $3.00/month
- **Yearly Plan**: $30.00/year (17% savings)
- **Free Plan**: Available for qualifying users

## 🔄 Webhook Implementation

### Webhook Handler
```typescript
// In your backend API
app.post('/api/paddle/webhook', async (req, res) => {
  const signature = req.headers['paddle-signature'];
  const payload = JSON.stringify(req.body);
  
  if (!paddleService.verifyWebhookSignature(payload, signature)) {
    return res.status(400).send('Invalid signature');
  }
  
  await paddleService.handleWebhook(req.body);
  res.status(200).send('OK');
});
```

### Event Handling
- **subscription.created**: Update user status to Pro
- **subscription.cancelled**: Update user status to Free
- **subscription.payment_failed**: Send notification and retry logic
- **subscription.payment_succeeded**: Update billing status

## 📊 Analytics & Reporting

### Key Metrics to Track
- **Conversion Rate**: Free to Pro upgrades
- **Churn Rate**: Subscription cancellations
- **Payment Success Rate**: Successful transactions
- **Average Revenue Per User (ARPU)**

### Dashboard Integration
- Real-time subscription status
- Revenue tracking
- User growth metrics
- Payment failure analysis

## 🆘 Support & Troubleshooting

### Common Issues
1. **Webhook Delivery Failures**
   - Check webhook URL accessibility
   - Verify signature validation
   - Monitor server logs

2. **Payment Declines**
   - Insufficient funds
   - Card restrictions
   - 3D Secure authentication

3. **API Errors**
   - Invalid API credentials
   - Rate limiting
   - Network connectivity

### Support Channels
- **Paddle Support**: [support@paddle.com](mailto:support@paddle.com)
- **Documentation**: [developer.paddle.com](https://developer.paddle.com)
- **Developer Community**: [community.paddle.com](https://community.paddle.com)

## 🎯 Next Steps

### Immediate Actions
1. ✅ Set up Paddle account
2. ✅ Configure environment variables
3. ✅ Create products in Paddle dashboard
4. ✅ Test payment flow
5. ✅ Deploy webhook endpoint

### Future Enhancements
1. **Multi-currency Support**: EUR, GBP, CAD
2. **Local Payment Methods**: Regional payment options
3. **Advanced Analytics**: Revenue forecasting
4. **Automated Dunning**: Payment retry logic
5. **A/B Testing**: Pricing optimization

## 📚 Additional Resources

- [Paddle API Documentation](https://developer.paddle.com)
- [Webhook Testing Tools](https://webhook.site)
- [Payment Security Best Practices](https://owasp.org/www-project-payment-security-standards/)
- [Subscription Business Models](https://www.chargebee.com/blog/subscription-business-models/)

---

**Need Help?** Contact the development team or refer to Paddle's official documentation for the most up-to-date information.
