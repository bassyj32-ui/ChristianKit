import React, { useState } from 'react';
import { useAuth } from './AuthProvider';

export const SubscriptionPage: React.FC = () => {
  const { user, isProUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');

  const plans = {
    monthly: {
      price: 9.99,
      period: 'month',
      savings: null,
      priceETB: 550 // Ethiopian Birr equivalent
    },
    yearly: {
      price: 99.99,
      period: 'year',
      savings: 'Save 17%',
      priceETB: 5500 // Ethiopian Birr equivalent
    }
  };

  const paymentMethods = [
    {
      id: 'payoneer',
      name: 'Payoneer',
      description: 'International payment platform',
      icon: '🌍',
      color: 'from-blue-600 to-indigo-600'
    },
    {
      id: 'telebirr',
      name: 'Telebirr',
      description: 'Ethio Telecom Mobile Money',
      icon: '📱',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'cbe',
      name: 'CBE Birr',
      description: 'Commercial Bank of Ethiopia',
      icon: '🏦',
      color: 'from-blue-500 to-indigo-500'
    },
    {
      id: 'amole',
      name: 'Amole',
      description: 'Digital Wallet',
      icon: '💳',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'Direct bank transfer',
      icon: '🏛️',
      color: 'from-gray-500 to-slate-500'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'International payment',
      icon: '🌐',
      color: 'from-blue-400 to-cyan-500'
    }
  ];

  const handleSubscribe = async () => {
    if (!user || !selectedPaymentMethod) {
      alert('Please select a payment method');
      return;
    }
    
    setLoading(true);
    try {
      // Here you would integrate with your chosen payment provider
      console.log('Processing subscription for:', user.email);
      console.log('Selected plan:', selectedPlan);
      console.log('Payment method:', selectedPaymentMethod);
      console.log('Price ETB:', plans[selectedPlan].priceETB);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`Subscription successful! You will receive payment instructions via email. (This is a demo)`);
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Subscription failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isProUser) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-6 text-center">
          <div className="bg-neutral-900/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-neutral-800">
            <div className="text-6xl mb-4">⭐</div>
            <h1 className="text-2xl font-bold text-gray-100 mb-4">
              You're Already Pro!
            </h1>
            <p className="text-gray-400 mb-6">
              Enjoy all the premium features of ChristianKit
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
            >
              Continue to App
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-4">
            Upgrade to Pro
          </h1>
          <p className="text-gray-400 text-lg">
            Unlock premium features and accelerate your spiritual growth
          </p>
        </div>

        {/* Plan Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-neutral-900/90 backdrop-blur-sm rounded-xl p-1 border border-neutral-800">
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`px-6 py-3 rounded-lg font-bold transition-all duration-200 ${
                selectedPlan === 'monthly'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                  : 'text-gray-400 hover:text-gray-100'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedPlan('yearly')}
              className={`px-6 py-3 rounded-lg font-bold transition-all duration-200 ${
                selectedPlan === 'yearly'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                  : 'text-gray-400 hover:text-gray-100'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto mb-8">
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-2xl p-8 shadow-2xl border border-purple-500/30 relative overflow-hidden">
            {/* Pro Badge */}
            <div className="absolute top-4 right-4">
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                PRO
              </span>
            </div>

            {/* Savings Badge */}
            {plans[selectedPlan].savings && (
              <div className="absolute top-4 left-4">
                <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {plans[selectedPlan].savings}
                </span>
              </div>
            )}

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-purple-400 mb-2">
                ${plans[selectedPlan].price}
              </h2>
              <p className="text-gray-400 mb-2">
                per {plans[selectedPlan].period}
              </p>
              <p className="text-2xl font-bold text-green-400">
                {plans[selectedPlan].priceETB} ETB
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <span className="text-gray-300">Everything in Free Plan</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <span className="text-gray-300">Advanced meditation guides</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <span className="text-gray-300">Community posting & interaction</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <span className="text-gray-300">Personalized spiritual coaching</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <span className="text-gray-300">Progress analytics</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <span className="text-gray-300">Priority support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="max-w-2xl mx-auto mb-8">
          <h3 className="text-2xl font-bold text-gray-100 mb-6 text-center">
            Choose Payment Method
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedPaymentMethod(method.id)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  selectedPaymentMethod === method.id
                    ? `bg-gradient-to-r ${method.color} text-white border-transparent`
                    : 'bg-neutral-900/90 text-gray-300 border-neutral-700 hover:border-neutral-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{method.icon}</span>
                  <div>
                    <div className="font-bold">{method.name}</div>
                    <div className="text-sm opacity-80">{method.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Subscribe Button */}
        <div className="text-center">
          <button
            onClick={handleSubscribe}
            disabled={loading || !user || !selectedPaymentMethod}
            className="w-full max-w-md bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : `Subscribe Now - ${plans[selectedPlan].priceETB} ETB`}
          </button>

          {/* User Info */}
          {user && (
            <p className="text-center text-sm text-gray-400 mt-4">
              Subscribing as: {user.email}
            </p>
          )}
        </div>

        {/* Local Payment Info */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            🔒 Secure payment • 
            <span className="text-green-400"> 30-day money-back guarantee</span>
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Payments processed securely through local Ethiopian payment providers
          </p>
        </div>
      </div>
    </div>
  );
};
