# 🌍 Payoneer Integration Guide for ChristianKit

## Why Payoneer is Perfect for Ethiopia

### ✅ **Advantages:**
- **Global Reach**: Accept payments from 200+ countries
- **Multiple Currencies**: Support for USD, EUR, GBP, and local currencies
- **Low Fees**: Competitive transaction fees (1-3%)
- **Easy Setup**: Simple API integration
- **Mobile App**: Users can pay via Payoneer mobile app
- **Bank Transfers**: Direct to local bank accounts
- **Prepaid Cards**: Virtual and physical cards available

### 🌍 **Supported in Ethiopia:**
- ✅ Bank transfers to Ethiopian banks
- ✅ Mobile money integration
- ✅ Local currency support (ETB)
- ✅ International payments

## 🚀 Implementation Steps

### Step 1: Payoneer Business Account Setup

1. **Create Payoneer Business Account:**
   - Go to [Payoneer Business](https://www.payoneer.com/business/)
   - Click "Get Started"
   - Complete business verification

2. **Required Documents:**
   - Business registration certificate
   - Tax identification number (TIN)
   - Bank account details
   - Government-issued ID
   - Proof of address

3. **Account Verification:**
   - Submit required documents
   - Wait for approval (2-5 business days)
   - Complete KYC process

### Step 2: Payoneer API Integration

#### **Option A: Payoneer API (Recommended)**

```javascript
// src/services/payoneerService.js
class PayoneerService {
  constructor() {
    this.apiKey = process.env.PAYONEER_API_KEY;
    this.baseUrl = 'https://api.payoneer.com/v2';
  }

  async createPayment(amount, currency, userEmail, description) {
    const paymentData = {
      amount: amount,
      currency: currency,
      payee_id: userEmail,
      description: description,
      payment_id: this.generatePaymentId(),
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(paymentData)
      });

      return await response.json();
    } catch (error) {
      console.error('Payoneer payment error:', error);
      throw error;
    }
  }

  async checkPaymentStatus(paymentId) {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return await response.json();
    } catch (error) {
      console.error('Payoneer status check error:', error);
      throw error;
    }
  }

  generatePaymentId() {
    return 'CK_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}
```

#### **Option B: Payoneer Checkout (Simpler)**

```javascript
// src/components/PayoneerCheckout.jsx
import React, { useEffect } from 'react';

export const PayoneerCheckout = ({ amount, currency, onSuccess, onError }) => {
  useEffect(() => {
    // Load Payoneer checkout script
    const script = document.createElement('script');
    script.src = 'https://checkout.payoneer.com/js/payoneer-checkout.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      window.PayoneerCheckout.init({
        clientId: process.env.REACT_APP_PAYONEER_CLIENT_ID,
        amount: amount,
        currency: currency,
        onSuccess: onSuccess,
        onError: onError
      });
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [amount, currency, onSuccess, onError]);

  return (
    <div id="payoneer-checkout-container">
      {/* Payoneer checkout will render here */}
    </div>
  );
};
```

### Step 3: Backend Integration

```javascript
// src/server/paymentRoutes.js
const express = require('express');
const PayoneerService = require('../services/payoneerService');

const router = express.Router();
const payoneerService = new PayoneerService();

// Create payment
router.post('/create-payment', async (req, res) => {
  try {
    const { amount, currency, userEmail, plan } = req.body;
    
    const payment = await payoneerService.createPayment(
      amount,
      currency,
      userEmail,
      `ChristianKit Pro Subscription - ${plan}`
    );

    res.json({
      success: true,
      paymentId: payment.payment_id,
      checkoutUrl: payment.checkout_url
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Payment webhook
router.post('/payoneer-webhook', async (req, res) => {
  try {
    const { payment_id, status, amount } = req.body;
    
    if (status === 'completed') {
      // Update user subscription status
      await updateUserSubscription(payment_id, 'pro');
      
      // Send confirmation email
      await sendSubscriptionEmail(payment_id);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Step 4: Frontend Integration

```javascript
// src/components/SubscriptionPage.tsx (Updated)
const handlePayoneerPayment = async () => {
  setLoading(true);
  try {
    const response = await fetch('/api/create-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: plans[selectedPlan].priceETB,
        currency: 'ETB',
        userEmail: user.email,
        plan: selectedPlan
      })
    });

    const data = await response.json();
    
    if (data.success) {
      // Redirect to Payoneer checkout
      window.location.href = data.checkoutUrl;
    } else {
      alert('Payment creation failed. Please try again.');
    }
  } catch (error) {
    console.error('Payment error:', error);
    alert('Payment failed. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

### Step 5: Environment Variables

```env
# Payoneer Configuration
PAYONEER_API_KEY=your_payoneer_api_key
PAYONEER_CLIENT_ID=your_payoneer_client_id
PAYONEER_SECRET_KEY=your_payoneer_secret_key
PAYONEER_WEBHOOK_SECRET=your_webhook_secret

# Optional: Test mode
PAYONEER_TEST_MODE=true
```

## 💰 Pricing & Fees

### **Payoneer Fees for Ethiopia:**
- **Transaction Fee**: 1-3% per payment
- **Currency Conversion**: 0.5-2% (if needed)
- **Bank Transfer**: $1.50 per transfer
- **Monthly Fee**: $29.95 (waived with $2000+ monthly volume)

### **Recommended Pricing Strategy:**
- **Monthly Plan**: 550 ETB (~$10 USD)
- **Yearly Plan**: 5,500 ETB (~$100 USD)
- **Student Plan**: 350 ETB/month

## 🔧 Alternative Integration Methods

### **Option 1: Payoneer Checkout (Easiest)**
```javascript
// Simple redirect to Payoneer checkout
const payoneerCheckout = {
  amount: 550,
  currency: 'ETB',
  description: 'ChristianKit Pro Subscription',
  returnUrl: 'https://yourdomain.com/success',
  cancelUrl: 'https://yourdomain.com/cancel'
};

window.location.href = `https://checkout.payoneer.com/pay?${new URLSearchParams(payoneerCheckout)}`;
```

### **Option 2: Payoneer Mobile App Integration**
```javascript
// Deep link to Payoneer mobile app
const payoneerAppLink = `payoneer://payment?amount=${amount}&currency=ETB&description=${description}`;
window.location.href = payoneerAppLink;
```

### **Option 3: Manual Payment Processing**
```javascript
// Generate payment instructions
const generatePaymentInstructions = (amount, currency) => {
  return {
    payoneerEmail: 'your-business@payoneer.com',
    amount: amount,
    currency: currency,
    reference: `CK_${Date.now()}`,
    instructions: 'Send payment to our Payoneer account with the reference number'
  };
};
```

## 📱 User Experience Flow

### **Payment Flow:**
1. User selects "Payoneer" payment method
2. Clicks "Subscribe Now"
3. Redirected to Payoneer checkout page
4. User completes payment via:
   - Credit/debit card
   - Bank transfer
   - Payoneer balance
   - Mobile money
5. Payment confirmation sent to user
6. User account upgraded to Pro

### **Success Page:**
```javascript
// src/components/PaymentSuccess.jsx
export const PaymentSuccess = () => {
  return (
    <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-gray-400 mb-6">
          Welcome to ChristianKit Pro! Your subscription is now active.
        </p>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-bold"
        >
          Continue to App
        </button>
      </div>
    </div>
  );
};
```

## 🔒 Security & Compliance

### **Security Measures:**
- HTTPS encryption for all transactions
- Webhook signature verification
- Payment status validation
- Fraud detection integration
- PCI DSS compliance

### **Data Protection:**
- Secure API key storage
- User data encryption
- GDPR compliance
- Local data storage laws

## 📞 Support & Resources

### **Payoneer Support:**
- **Business Support**: +1-800-251-2521
- **Developer Documentation**: [Payoneer API Docs](https://developer.payoneer.com)
- **Integration Guide**: [Payoneer Integration](https://www.payoneer.com/developers/)

### **Local Support:**
- **Ethiopian Business Support**: Contact local Payoneer representative
- **Technical Support**: Payoneer developer support team

## 🎯 Next Steps

1. **Set up Payoneer Business Account**
2. **Complete business verification**
3. **Get API credentials**
4. **Implement payment integration**
5. **Test payment flow**
6. **Go live with limited users**
7. **Scale based on success**

---

**Payoneer is an excellent choice for international payments from Ethiopia! 🌍✨**
