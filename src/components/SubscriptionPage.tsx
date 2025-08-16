import React, { useState } from 'react';
import { useAuth } from './AuthProvider';

export const SubscriptionPage: React.FC = () => {
  const { user, isProUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [showFreeApplication, setShowFreeApplication] = useState(false);
  const [freeApplication, setFreeApplication] = useState({
    reason: '',
    monthlyIncome: '',
    additionalInfo: ''
  });

  const plans = {
    monthly: {
      price: 5,
      period: 'month',
      savings: null
    },
    yearly: {
      price: 50,
      period: 'year',
      savings: 'Save 17%'
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      alert('Please sign in to subscribe');
      return;
    }
    
    setLoading(true);
    try {
      // Here you would integrate with your chosen payment provider
      console.log('Processing subscription for:', user.email);
      console.log('Selected plan:', selectedPlan);
      console.log('Price:', plans[selectedPlan].price);
      
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

  const handleFreeApplication = async () => {
    if (!freeApplication.reason || !freeApplication.monthlyIncome) {
      alert('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    try {
      // Here you would submit the free application
      console.log('Submitting free application for:', user?.email);
      console.log('Application details:', freeApplication);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('Free plan application submitted successfully! We will review your application and get back to you within 48 hours.');
      setShowFreeApplication(false);
      setFreeApplication({ reason: '', monthlyIncome: '', additionalInfo: '' });
    } catch (error) {
      console.error('Application error:', error);
      alert('Application failed. Please try again.');
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
            Choose Your Plan
          </h1>
          <p className="text-gray-400 text-lg">
            Start with our free plan or upgrade to Pro for premium features
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Free Plan */}
          <div className="bg-neutral-900/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-neutral-700">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🆓</div>
              <h2 className="text-2xl font-bold text-gray-100 mb-2">Free Plan</h2>
              <div className="text-3xl font-bold text-green-400 mb-2">$0</div>
              <p className="text-gray-400">Forever free</p>
            </div>

            {/* Features */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-gray-300">Basic prayer timer</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-gray-300">Simple progress tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-gray-300">Community viewing</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-gray-300">Basic Bible tracker</span>
              </div>
            </div>

            <button
              onClick={() => setShowFreeApplication(true)}
              className="w-full bg-neutral-700 text-gray-300 py-3 px-6 rounded-xl font-bold hover:bg-neutral-600 transition-all duration-200"
            >
              Apply for Free Plan
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-2xl p-8 shadow-2xl border border-purple-500/30 relative">
            {/* Pro Badge */}
            <div className="absolute top-4 right-4">
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                PRO
              </span>
            </div>

            <div className="text-center mb-6">
              <div className="text-4xl mb-2">⭐</div>
              <h2 className="text-2xl font-bold text-purple-400 mb-2">Pro Plan</h2>
              <div className="text-3xl font-bold text-green-400 mb-2">
                ${plans[selectedPlan].price}
              </div>
              <p className="text-gray-400">per {plans[selectedPlan].period}</p>
              {plans[selectedPlan].savings && (
                <div className="mt-2">
                  <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {plans[selectedPlan].savings}
                  </span>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-gray-300">Everything in Free Plan</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-gray-300">Advanced meditation guides</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-gray-300">Community posting & interaction</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-gray-300">Personalized spiritual coaching</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-gray-300">Progress analytics</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-gray-300">Priority support</span>
              </div>
            </div>

            <button
              onClick={handleSubscribe}
              disabled={loading || !user}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : `Subscribe Now - $${plans[selectedPlan].price}`}
            </button>
          </div>
        </div>

        {/* Plan Selector for Pro */}
        <div className="text-center mb-8">
          <h3 className="text-xl font-bold text-gray-100 mb-4">Choose Pro Plan Duration</h3>
          <div className="flex justify-center">
            <div className="bg-neutral-900/90 backdrop-blur-sm rounded-xl p-1 border border-neutral-800">
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`px-6 py-3 rounded-lg font-bold transition-all duration-200 ${
                  selectedPlan === 'monthly'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                    : 'text-gray-400 hover:text-gray-100'
                }`}
              >
                Monthly ($5)
              </button>
              <button
                onClick={() => setSelectedPlan('yearly')}
                className={`px-6 py-3 rounded-lg font-bold transition-all duration-200 ${
                  selectedPlan === 'yearly'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                    : 'text-gray-400 hover:text-gray-100'
                }`}
              >
                Yearly ($50)
              </button>
            </div>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              Signed in as: {user.email}
            </p>
          </div>
        )}

        {/* Payment Info */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            🔒 Secure payment • 
            <span className="text-green-400"> 30-day money-back guarantee</span>
          </p>
          <p className="text-gray-500 text-xs mt-2">
            We'll integrate with your preferred payment platform once you decide
          </p>
        </div>

        {/* Free Plan Application Modal */}
        {showFreeApplication && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowFreeApplication(false)}
          >
            <div 
              className="bg-neutral-900/95 backdrop-blur-xl border border-neutral-700 rounded-3xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">🆓</div>
                <h2 className="text-2xl font-bold text-gray-100 mb-2">Apply for Free Plan</h2>
                <p className="text-gray-400">Tell us why you need the free plan</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Why do you need the free plan? *</label>
                  <textarea
                    value={freeApplication.reason}
                    onChange={(e) => setFreeApplication({...freeApplication, reason: e.target.value})}
                    className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="Please explain your financial situation..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Monthly Income (approximate) *</label>
                  <select
                    value={freeApplication.monthlyIncome}
                    onChange={(e) => setFreeApplication({...freeApplication, monthlyIncome: e.target.value})}
                    className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select income range</option>
                    <option value="0-500">$0 - $500</option>
                    <option value="500-1000">$500 - $1,000</option>
                    <option value="1000-2000">$1,000 - $2,000</option>
                    <option value="2000+">$2,000+</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Additional Information</label>
                  <textarea
                    value={freeApplication.additionalInfo}
                    onChange={(e) => setFreeApplication({...freeApplication, additionalInfo: e.target.value})}
                    className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={2}
                    placeholder="Any other details you'd like to share..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-8">
                <button
                  onClick={() => setShowFreeApplication(false)}
                  className="px-6 py-3 text-gray-400 hover:text-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFreeApplication}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
