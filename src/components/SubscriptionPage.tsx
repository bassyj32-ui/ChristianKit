import React, { useState } from 'react'
import { useAuth } from './AuthProvider'

export const SubscriptionPage: React.FC = () => {
  const { user } = useAuth()
  const [showFreeRequest, setShowFreeRequest] = useState(false)
  const [freeRequestReason, setFreeRequestReason] = useState('')
  const [freeRequestSubmitted, setFreeRequestSubmitted] = useState(false)

  const handleProUpgrade = () => {
    // Redirect to Payooer payment link
    const payooerLink = `https://payooer.com/request-money/${user?.uid || 'user'}`
    window.open(payooerLink, '_blank')
  }

  const handleFreeRequest = () => {
    if (freeRequestReason.trim()) {
      // Here you would typically send this to your backend
      console.log('Free plan request:', freeRequestReason)
      setFreeRequestSubmitted(true)
      setTimeout(() => {
        setShowFreeRequest(false)
        setFreeRequestReason('')
        setFreeRequestSubmitted(false)
      }, 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock premium features and take your spiritual journey to the next level
          </p>
        </div>

        {/* Plans Container */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          
          {/* Pro Plan - Featured */}
          <div className="relative">
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl transform hover:scale-105 transition-all duration-300">
              {/* Popular Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-400 text-yellow-900 px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  ⭐ MOST POPULAR
                </span>
              </div>
              
              {/* Plan Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Pro Plan</h2>
                <p className="text-purple-100 text-lg">Unlock everything</p>
              </div>

              {/* Pricing - Prominent Display */}
              <div className="text-center mb-8">
                <div className="mb-2">
                  <span className="text-5xl font-bold">$2.50</span>
                  <span className="text-2xl text-purple-200">/month</span>
                </div>
                <div className="text-purple-200 text-lg font-semibold">
                  Billed annually at <span className="text-white font-bold">$30/year</span>
                </div>
                <div className="text-purple-100 text-sm mt-2">
                  Non-refundable
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span>Unlimited prayer sessions</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span>Advanced Bible tracking</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span>Priority community access</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span>Cloud sync across devices</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span>Advanced analytics & insights</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span>Premium support</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span>Exclusive content & resources</span>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={handleProUpgrade}
                className="w-full bg-white text-purple-700 py-4 px-6 rounded-xl font-bold text-lg hover:bg-purple-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                🚀 Upgrade to Pro Now
              </button>
            </div>
          </div>

          {/* Free Plan */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Free Plan</h2>
              <p className="text-gray-600 text-lg">Basic features included</p>
            </div>

            {/* Pricing */}
            <div className="text-center mb-8">
              <div className="mb-2">
                <span className="text-5xl font-bold text-gray-900">$0</span>
                <span className="text-2xl text-gray-600">/month</span>
              </div>
              <div className="text-gray-500 text-lg">
                Forever free
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <span className="text-gray-700">Community access (2 weeks)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <span className="text-gray-700">Weekly progress (2 weeks)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-red-500 text-xl">✗</span>
                <span className="text-gray-500">Unlimited prayer sessions</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-red-500 text-xl">✗</span>
                <span className="text-gray-500">Advanced Bible tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-red-500 text-xl">✗</span>
                <span className="text-gray-500">Cloud sync & premium features</span>
              </div>
            </div>

            {/* Free Plan Request */}
            <div className="text-center">
              <button
                onClick={() => setShowFreeRequest(true)}
                className="w-full bg-gray-100 text-gray-700 py-4 px-6 rounded-xl font-semibold text-lg hover:bg-gray-200 transition-all duration-300"
              >
                💝 Request Free Access
              </button>
              <p className="text-gray-500 text-sm mt-3">
                Need financial assistance? We're here to help.
              </p>
            </div>
          </div>
        </div>

        {/* Free Plan Request Modal */}
        {showFreeRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                Request Free Access
              </h3>
              
              {!freeRequestSubmitted ? (
                <>
                  <p className="text-gray-600 mb-6 text-center">
                    Tell us why you need free access. We believe everyone deserves spiritual growth tools.
                  </p>
                  
                  <textarea
                    value={freeRequestReason}
                    onChange={(e) => setFreeRequestReason(e.target.value)}
                    placeholder="Please explain your situation (e.g., student, financial hardship, ministry worker...)"
                    className="w-full p-4 border border-gray-300 rounded-xl resize-none h-32 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowFreeRequest(false)}
                      className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleFreeRequest}
                      disabled={!freeRequestReason.trim()}
                      className="flex-1 py-3 px-4 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Submit Request
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    Request Submitted!
                  </h4>
                  <p className="text-gray-600 mb-6">
                    We'll review your request and get back to you within 24-48 hours.
                  </p>
                  <button
                    onClick={() => setShowFreeRequest(false)}
                    className="bg-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Frequently Asked Questions
          </h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                How does the yearly payment work?
              </h4>
              <p className="text-gray-600">
                You pay $30 once per year, which works out to just $2.50 per month.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                How do I request free access?
              </h4>
              <p className="text-gray-600">
                Simply click "Request Free Access" on the Free Plan and tell us about your situation. We're committed to making spiritual growth accessible to everyone.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Have questions? Need help choosing a plan?
          </p>
          <button className="bg-purple-600 text-white py-3 px-8 rounded-xl font-semibold hover:bg-purple-700 transition-all duration-300">
            💬 Contact Support
          </button>
        </div>
      </div>
    </div>
  )
}
