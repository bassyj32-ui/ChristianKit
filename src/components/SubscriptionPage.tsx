import React, { useState, useEffect } from 'react'
import { useSupabaseAuth } from './SupabaseAuthProvider'
import { paddleService, PaddlePlan } from '../services/paddleService'

export const SubscriptionPage: React.FC = () => {
  const { user } = useSupabaseAuth()
  const [showFreeRequest, setShowFreeRequest] = useState(false)
  const [freeRequestReason, setFreeRequestReason] = useState('')
  const [freeRequestSubmitted, setFreeRequestSubmitted] = useState(false)
  const [plans, setPlans] = useState<PaddlePlan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PaddlePlan | null>(null)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const availablePlans = await paddleService.getPlans()
      setPlans(availablePlans)
      // Set yearly plan as default selected
      const yearlyPlan = availablePlans.find(plan => plan.interval === 'year')
      if (yearlyPlan) {
        setSelectedPlan(yearlyPlan)
      }
    } catch (error) {
      console.error('Failed to load plans:', error)
    }
  }

  const handleProUpgrade = async (plan: PaddlePlan) => {
    if (!user?.email) {
      alert('Please log in to subscribe')
      return
    }

    setIsLoading(true)
    try {
      const checkoutUrl = await paddleService.createCheckout(plan, user.email)
      window.open(checkoutUrl, '_blank')
    } catch (error) {
      console.error('Failed to create checkout:', error)
      alert('Failed to create checkout. Please try again.')
    } finally {
      setIsLoading(false)
    }
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
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] py-8 px-4">
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 mb-8">
        <div className="bg-[var(--glass-dark)] backdrop-blur-xl border-b-2 border-[var(--glass-border)] shadow-2xl">
          <div className="flex items-center justify-between py-4 px-6">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => window.location.href = '/'}
                className="text-[var(--text-primary)] font-semibold hover:text-[var(--accent-primary)] transition-colors duration-300"
              >
                🏠 Home
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="osmo-button-primary px-4 py-2 font-semibold"
              >
                Pro
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4 font-mono tracking-wider">
            Your Session Today
          </h1>
          <p className="text-slate-300 text-xl max-w-2xl mx-auto">
            Unlock premium features and take your spiritual journey to the next level
          </p>
        </div>

        {/* Plans Container */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          
          {/* Yearly Pro Plan - Featured */}
          <div className="relative">
            <div className="osmo-card p-8 transform hover:scale-105 transition-all duration-300">
              {/* Popular Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-[var(--text-inverse)] px-6 py-2 rounded-full text-sm font-bold shadow-lg border border-[var(--accent-primary)]/50">
                  ⭐ BEST VALUE
                </span>
              </div>
              
              {/* Plan Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] bg-clip-text text-transparent">
                  Pro Yearly
                </h2>
                <p className="text-[var(--text-secondary)] text-lg">Unlock everything & save 17%</p>
              </div>

              {/* Pricing - Prominent Display */}
              <div className="text-center mb-8">
                <div className="mb-2">
                  <span className="text-5xl font-bold text-[var(--text-primary)]">$30</span>
                  <span className="text-2xl text-[var(--text-secondary)]">/year</span>
                </div>
                <div className="text-[var(--text-secondary)] text-lg font-semibold">
                  Just <span className="text-[var(--text-primary)] font-bold">$2.50/month</span> when billed yearly
                </div>
                <div className="text-green-400 text-sm font-semibold mt-2">
                  💰 Save $6/year vs monthly billing
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span>Everything in Free</span>
                </div>
                
                {/* NEW PREMIUM FEATURES */}
                <div className="border-l-4 border-amber-400 pl-4 py-2 bg-amber-500/10 rounded-r-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-amber-400 text-xl">⭐</span>
                    <span className="text-amber-100 font-semibold">📧 Daily Re-Engagement System</span>
                  </div>
                  <p className="text-slate-300 text-sm ml-6">Uplifting daily messages & encouraging reminders to stay consistent</p>
                </div>
                
                <div className="border-l-4 border-amber-400 pl-4 py-2 bg-amber-500/10 rounded-r-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-amber-400 text-xl">⭐</span>
                    <span className="text-amber-100 font-semibold">📊 Weekly Progress Tracking</span>
                  </div>
                  <p className="text-slate-300 text-sm ml-6">Detailed analytics, insights & progress visualization</p>
                </div>
                
                <div className="border-l-4 border-amber-400 pl-4 py-2 bg-amber-500/10 rounded-r-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-amber-400 text-xl">⭐</span>
                    <span className="text-amber-100 font-semibold">🎯 Monthly Habit Builder</span>
                  </div>
                  <p className="text-slate-300 text-sm ml-6">Focus on one spiritual habit each month (e.g., "Fear of God")</p>
                </div>
                
                <div className="border-l-4 border-amber-400 pl-4 py-2 bg-amber-500/10 rounded-r-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-amber-400 text-xl">⭐</span>
                    <span className="text-amber-100 font-semibold">🙏 Community Prayer Requests</span>
                  </div>
                  <p className="text-slate-300 text-sm ml-6">Special prayer posts with "I Prayed" button for encouragement</p>
                </div>

                {/* EXISTING FEATURES */}
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span>Premium support</span>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => selectedPlan && handleProUpgrade(selectedPlan)}
                disabled={isLoading || !selectedPlan}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:from-amber-500 hover:to-orange-500 transition-all duration-300 shadow-lg hover:shadow-amber-500/40 transform hover:-translate-y-1 border border-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  '🚀 Get Pro Yearly - $30/year'
                )}
              </button>
            </div>
          </div>

          {/* Monthly Pro Plan */}
          <div className="bg-[var(--glass-light)] backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-[var(--glass-border)] text-[var(--text-primary)]">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Pro Monthly</h2>
              <p className="text-[var(--text-secondary)] text-lg">Flexible monthly billing</p>
            </div>

            {/* Pricing */}
            <div className="text-center mb-8">
              <div className="mb-2">
                <span className="text-5xl font-bold text-[var(--text-primary)]">$3</span>
                <span className="text-2xl text-[var(--text-secondary)]">/month</span>
              </div>
              <div className="text-[var(--text-tertiary)] text-lg">
                Billed monthly
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <span className="text-green-400 text-xl">✓</span>
                <span>Everything in Free</span>
              </div>
              
              {/* PREMIUM FEATURES */}
              <div className="border-l-4 border-amber-400 pl-4 py-2 bg-amber-500/10 rounded-r-lg">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-amber-400 text-xl">⭐</span>
                  <span className="text-amber-100 font-semibold">📧 Daily Re-Engagement System</span>
                </div>
                <p className="text-slate-300 text-sm ml-6">Uplifting daily messages & encouraging reminders to stay consistent</p>
              </div>
              
              <div className="border-l-4 border-amber-400 pl-4 py-2 bg-amber-500/10 rounded-r-lg">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-amber-400 text-xl">⭐</span>
                  <span className="text-amber-100 font-semibold">📊 Weekly Progress Tracking</span>
                </div>
                <p className="text-slate-300 text-sm ml-6">Detailed analytics, insights & progress visualization</p>
              </div>
              
              <div className="border-l-4 border-amber-400 pl-4 py-2 bg-amber-500/10 rounded-r-lg">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-amber-400 text-xl">⭐</span>
                  <span className="text-amber-100 font-semibold">🎯 Monthly Habit Builder</span>
                </div>
                <p className="text-slate-300 text-sm ml-6">Focus on one spiritual habit each month (e.g., "Fear of God")</p>
              </div>
              
              <div className="border-l-4 border-amber-400 pl-4 py-2 bg-amber-500/10 rounded-r-lg">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-amber-400 text-xl">⭐</span>
                  <span className="text-amber-100 font-semibold">🙏 Community Prayer Requests</span>
                </div>
                <p className="text-slate-300 text-sm ml-6">Special prayer posts with "I Prayed" button for encouragement</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-green-400 text-xl">✓</span>
                <span>Premium support</span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => {
                const monthlyPlan = plans.find(plan => plan.interval === 'month')
                if (monthlyPlan) handleProUpgrade(monthlyPlan)
              }}
              disabled={isLoading}
              className="w-full bg-slate-700 text-slate-200 py-4 px-6 rounded-2xl font-semibold text-lg hover:bg-slate-600 transition-all duration-300 border border-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                '💳 Get Pro Monthly - $3/month'
              )}
            </button>
          </div>

          {/* Free Plan */}
          <div className="bg-[var(--glass-light)] backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-[var(--glass-border)] text-[var(--text-primary)]">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Free Plan</h2>
              <p className="text-[var(--text-secondary)] text-lg">Basic features included</p>
            </div>

            {/* Pricing */}
            <div className="text-center mb-8">
              <div className="mb-2">
                <span className="text-5xl font-bold text-[var(--text-primary)]">$0</span>
                <span className="text-2xl text-[var(--text-secondary)]">/month</span>
              </div>
              <div className="text-[var(--text-tertiary)] text-lg">
                Forever free
              </div>
            </div>

                        {/* Features List */}
            <div className="space-y-4 mb-8">
              {/* FREE FEATURES */}
              <div className="flex items-center gap-3">
                <span className="text-green-400 text-xl">✓</span>
                <span className="text-slate-200">Basic habit tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-400 text-xl">✓</span>
                <span className="text-slate-200">Prayer timer (limited to 30 mins)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-400 text-xl">✓</span>
                <span className="text-slate-200">Basic Bible reading progress</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-400 text-xl">✓</span>
                <span className="text-slate-200">Simple weekly overview</span>
              </div>
              
              {/* MISSING PREMIUM FEATURES */}
              <div className="border-t border-slate-600 pt-4 mt-4">
                <p className="text-slate-400 text-sm mb-3 font-semibold">Missing Premium Features:</p>
                <div className="flex items-center gap-3">
                  <span className="text-red-400 text-xl">✗</span>
                  <span className="text-slate-500">📧 Daily Re-Engagement System</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-red-400 text-xl">✗</span>
                  <span className="text-slate-500">📊 Advanced Weekly Tracking</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-red-400 text-xl">✗</span>
                  <span className="text-slate-500">🎯 Monthly Habit Builder</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-red-400 text-xl">✗</span>
                  <span className="text-slate-500">🙏 Community Prayer Requests</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-red-400 text-xl">✗</span>
                  <span className="text-slate-500">Premium support</span>
                </div>
              </div>
            </div>

        {/* Free Plan Request */}
            <div className="text-center">
              <button
                onClick={() => setShowFreeRequest(true)}
                className="w-full bg-slate-700 text-slate-200 py-4 px-6 rounded-2xl font-semibold text-lg hover:bg-slate-600 transition-all duration-300 border border-slate-600/50"
              >
                💝 Request Free Access
              </button>
              <p className="text-slate-400 text-sm mt-3">
                Need financial assistance? We're here to help.
              </p>
            </div>
          </div>
        </div>

        {/* Free Plan Request Modal */}
        {showFreeRequest && (
          <div className="fixed inset-0 bg-[var(--glass-dark)] flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-gray-600/30">
              <h3 className="text-2xl font-bold text-white mb-4 text-center">
                Request Free Access
              </h3>
              
              {!freeRequestSubmitted ? (
                <>
                  <p className="text-slate-300 mb-6 text-center">
                    Tell us why you need free access. We believe everyone deserves spiritual growth tools.
                  </p>
                  
                  <textarea
                    value={freeRequestReason}
                    onChange={(e) => setFreeRequestReason(e.target.value)}
                    placeholder="Please explain your situation (e.g., student, financial hardship, ministry worker...)"
                    className="w-full p-4 border border-gray-600 rounded-xl resize-none h-32 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-slate-700 text-white placeholder-slate-400"
                  />
                  
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowFreeRequest(false)}
                      className="flex-1 py-3 px-4 bg-slate-600 text-slate-200 rounded-xl font-semibold hover:bg-slate-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleFreeRequest}
                      disabled={!freeRequestReason.trim()}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-semibold hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Submit Request
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h4 className="text-xl font-bold text-white mb-2">
                    Request Submitted!
                  </h4>
                  <p className="text-slate-300 mb-6">
                    We'll review your request and get back to you within 24-48 hours.
                  </p>
                  <button
                    onClick={() => setShowFreeRequest(false)}
                    className="bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-amber-500 hover:to-orange-500 transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="bg-slate-800/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-gray-600/30">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            Frequently Asked Questions
          </h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-white mb-2">
                How does the yearly payment work?
              </h4>
              <p className="text-slate-300">
                You pay $30 once per year, which works out to just $2.50 per month - saving you $6 compared to monthly billing!
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-2">
                What's included in the Pro plan?
              </h4>
              <p className="text-slate-300">
                Pro includes 4 premium features: Daily Re-Engagement System (uplifting messages & reminders), Weekly Progress Tracking (detailed analytics), Monthly Habit Builder (focused spiritual growth), Community Prayer Requests ("I Prayed" encouragement), plus premium support.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-2">
                How do I request free access?
              </h4>
              <p className="text-slate-300">
                Simply click "Request Free Access" on the Free Plan and tell us about your situation. We're committed to making spiritual growth accessible to everyone.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="text-center mt-12">
          <p className="text-slate-300 mb-4">
            Have questions? Need help choosing a plan?
          </p>
          <button className="bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 px-8 rounded-2xl font-semibold hover:from-amber-500 hover:to-orange-500 transition-all duration-300 border border-amber-500/30">
            💬 Contact Support
          </button>
        </div>

        {/* Mobile Bottom Spacing */}
        <div className="h-24 lg:hidden"></div>

        {/* Mobile Navigation Tabs - Floating Glass Tabs */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center pb-6">
          <div className="flex items-center space-x-4">
            {/* Weekly Analysis Tab */}
            <button
              onClick={() => window.location.href = '/weekly-analysis'}
              className="flex flex-col items-center space-y-2 group"
            >
              <div className="w-16 h-20 bg-gradient-to-br from-amber-400/10 to-orange-500/20 backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-amber-400/30 border border-amber-300/20">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400/30 to-orange-500/40 backdrop-blur-xl rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-amber-400/40 border border-amber-300/30 mb-2">
                  <svg className="w-5 h-5 text-amber-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-amber-100 group-hover:text-amber-50 transition-colors duration-300 tracking-wide">Analysis</span>
              </div>
            </button>
            
            {/* Prayer Tab */}
            <button
              onClick={() => window.location.href = '/prayer'}
              className="flex flex-col items-center space-y-2 group"
            >
              <div className="w-16 h-20 bg-gradient-to-br from-blue-400/10 to-indigo-500/20 backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-blue-400/30 border border-blue-300/20">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400/30 to-indigo-500/40 backdrop-blur-xl rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-blue-400/40 border border-blue-300/30 mb-2">
                  <svg className="w-5 h-5 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-blue-100 group-hover:text-blue-50 transition-colors duration-300 tracking-wide">Prayer</span>
              </div>
            </button>
            
            {/* Community Tab */}
            <button
              onClick={() => window.location.href = '/community'}
              className="flex flex-col items-center space-y-2 group"
            >
              <div className="w-16 h-20 bg-gradient-to-br from-emerald-400/10 to-teal-500/20 backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-emerald-400/30 border border-emerald-300/20">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400/30 to-teal-500/40 backdrop-blur-xl rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-emerald-400/40 border border-emerald-300/30 mb-2">
                  <svg className="w-5 h-5 text-emerald-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-emerald-100 group-hover:text-emerald-50 transition-colors duration-300 tracking-wide">Community</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
