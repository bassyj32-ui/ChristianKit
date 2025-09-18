import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSupabaseAuth } from './SupabaseAuthProvider'
import { paddleService, PaddlePlan } from '../services/paddleService'
import { 
  OsmoCard, 
  OsmoButton, 
  OsmoBadge, 
  OsmoSectionHeader, 
  OsmoContainer, 
  OsmoGradientText,
  OsmoGrid 
} from '../theme/osmoComponents'

export const SubscriptionPage: React.FC = () => {
  const navigate = useNavigate()
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
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="bg-[var(--glass-dark)] backdrop-blur-xl border-b border-[var(--glass-border)] shadow-2xl">
          <OsmoContainer size="lg" padding={true}>
            <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button 
                  onClick={() => navigate('/')}
                className="text-[var(--text-primary)] font-semibold hover:text-[var(--accent-primary)] transition-colors duration-300"
              >
                🏠 Home
              </button>
            </div>
            <div className="flex items-center space-x-3">
                <OsmoButton 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  size="sm"
              >
                Pro
                </OsmoButton>
              </div>
            </div>
          </OsmoContainer>
        </div>
      </div>

      <div className="pt-20 pb-8">
        <OsmoContainer size="lg">
        {/* Header */}
          <OsmoSectionHeader
            title="Choose Your Plan"
            subtitle="Start with a 14-day free trial - no credit card required"
          />
          
          {/* Free Access Banner */}
          <OsmoCard className="mb-12 bg-gradient-to-r from-green-600/10 to-emerald-600/10 border-green-500/30">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              <h2 className="text-2xl font-bold text-green-100">100% Free Access Available</h2>
            </div>
              <p className="text-green-200 text-lg mb-6">
              Can't afford it? We believe everyone deserves spiritual growth tools. 
              <span className="font-semibold"> Request free access below</span> - no questions asked.
            </p>
              <div className="flex flex-wrap justify-center gap-2">
                <OsmoBadge variant="spiritual" className="bg-green-700/30 text-green-300 border-green-500/30">
                  Students
                </OsmoBadge>
                <OsmoBadge variant="spiritual" className="bg-green-700/30 text-green-300 border-green-500/30">
                  Ministry Workers
                </OsmoBadge>
                <OsmoBadge variant="spiritual" className="bg-green-700/30 text-green-300 border-green-500/30">
                  Financial Hardship
                </OsmoBadge>
                <OsmoBadge variant="spiritual" className="bg-green-700/30 text-green-300 border-green-500/30">
                  Anyone in Need
                </OsmoBadge>
              </div>
            </div>
          </OsmoCard>

          {/* Plans Container - Mobile Responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
          
          {/* Yearly Pro Plan - Featured */}
          <div className="relative">
              <OsmoCard className="p-8 transform hover:scale-105 transition-all duration-300" glow={true}>
              {/* Popular Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <OsmoBadge variant="primary" className="px-6 py-2 text-sm font-bold shadow-lg">
                    <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    BEST VALUE
                  </OsmoBadge>
              </div>
              
              {/* Trial Badge */}
              <div className="absolute -top-4 right-4">
                  <OsmoBadge variant="spiritual" className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-1 text-xs font-bold shadow-lg border-blue-500/50">
                  14-DAY FREE TRIAL
                  </OsmoBadge>
              </div>
              
              {/* Plan Header */}
              <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">
                    <OsmoGradientText gradient="gold">Pro Yearly</OsmoGradientText>
                </h2>
                <p className="text-[var(--text-secondary)] text-lg">Unlock everything & save 17%</p>
              </div>

              {/* Pricing - Prominent Display */}
              <div className="text-center mb-8">
                  <div className="mb-4">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-6xl font-bold text-[var(--text-primary)]">$30</span>
                      <span className="text-xl text-[var(--text-secondary)]">/year</span>
                    </div>
                    <div className="text-[var(--text-secondary)] text-lg mt-2">
                      <span className="text-[var(--text-primary)] font-semibold">$2.50</span> per month
                    </div>
                </div>
                  <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span className="text-green-400 text-sm font-semibold">Save $6/year</span>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span>Everything in Free</span>
                </div>
                
                {/* NEW PREMIUM FEATURES */}
                <div className="border-l-4 border-amber-400 pl-4 py-3 bg-amber-500/10 rounded-r-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span className="text-amber-100 font-semibold">Daily Re-Engagement System</span>
                  </div>
                  <p className="text-slate-300 text-sm ml-8">Uplifting daily messages & encouraging reminders to stay consistent</p>
                </div>
                
                <div className="border-l-4 border-amber-400 pl-4 py-3 bg-amber-500/10 rounded-r-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6H16Z"/>
                    </svg>
                    <span className="text-amber-100 font-semibold">Weekly Progress Tracking</span>
                  </div>
                  <p className="text-slate-300 text-sm ml-8">Detailed analytics, insights & progress visualization</p>
                </div>
                
                <div className="border-l-4 border-amber-400 pl-4 py-3 bg-amber-500/10 rounded-r-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
                    </svg>
                    <span className="text-amber-100 font-semibold">Monthly Habit Builder</span>
                  </div>
                  <p className="text-slate-300 text-sm ml-8">Focus on one spiritual habit each month (e.g., "Fear of God")</p>
                </div>
                
                <div className="border-l-4 border-green-400 pl-4 py-3 bg-green-500/10 rounded-r-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span className="text-green-100 font-semibold">Community Features (Free for Everyone)</span>
                  </div>
                  <p className="text-slate-300 text-sm ml-8">Share prayers, encourage others, and connect with the community</p>
                </div>

                {/* EXISTING FEATURES */}
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span>Premium support</span>
                </div>
              </div>

              {/* CTA Button */}
                <OsmoButton
                onClick={() => selectedPlan && handleProUpgrade(selectedPlan)}
                disabled={isLoading || !selectedPlan}
                  size="lg"
                  className="w-full"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      Start 14-Day Free Trial
                    </div>
                  )}
                </OsmoButton>
                <p className="text-center text-[var(--text-tertiary)] text-sm mt-3">
                Then $30/year • Cancel anytime
              </p>
              </OsmoCard>
          </div>

          {/* Monthly Pro Plan */}
            <div className="relative">
              <OsmoCard className="p-8">
            {/* Trial Badge */}
            <div className="absolute -top-4 right-4">
                  <OsmoBadge variant="spiritual" className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-1 text-xs font-bold shadow-lg border-blue-500/50">
                14-DAY FREE TRIAL
                  </OsmoBadge>
            </div>
            
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Pro Monthly</h2>
              <p className="text-[var(--text-secondary)] text-lg">Flexible monthly billing</p>
            </div>

            {/* Pricing */}
            <div className="text-center mb-8">
              <div className="mb-4">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-6xl font-bold text-[var(--text-primary)]">$3</span>
                  <span className="text-xl text-[var(--text-secondary)]">/month</span>
              </div>
                <div className="text-[var(--text-secondary)] text-lg mt-2">
                Billed monthly
                </div>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span>Everything in Free</span>
              </div>
              
              {/* PREMIUM FEATURES */}
              <div className="border-l-4 border-amber-400 pl-4 py-3 bg-amber-500/10 rounded-r-lg">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span className="text-amber-100 font-semibold">Daily Re-Engagement System</span>
                </div>
                <p className="text-slate-300 text-sm ml-8">Uplifting daily messages & encouraging reminders to stay consistent</p>
              </div>
              
              <div className="border-l-4 border-amber-400 pl-4 py-3 bg-amber-500/10 rounded-r-lg">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6H16Z"/>
                  </svg>
                  <span className="text-amber-100 font-semibold">Weekly Progress Tracking</span>
                </div>
                <p className="text-slate-300 text-sm ml-8">Detailed analytics, insights & progress visualization</p>
              </div>
              
              <div className="border-l-4 border-amber-400 pl-4 py-3 bg-amber-500/10 rounded-r-lg">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
                  </svg>
                  <span className="text-amber-100 font-semibold">Monthly Habit Builder</span>
                </div>
                <p className="text-slate-300 text-sm ml-8">Focus on one spiritual habit each month (e.g., "Fear of God")</p>
              </div>
              
              <div className="border-l-4 border-green-400 pl-4 py-3 bg-green-500/10 rounded-r-lg">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span className="text-green-100 font-semibold">Community Features (Free for Everyone)</span>
                </div>
                <p className="text-slate-300 text-sm ml-8">Share prayers, encourage others, and connect with the community</p>
              </div>

              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span>Premium support</span>
              </div>
            </div>

            {/* CTA Button */}
                <OsmoButton
              onClick={() => {
                const monthlyPlan = plans.find(plan => plan.interval === 'month')
                if (monthlyPlan) handleProUpgrade(monthlyPlan)
              }}
              disabled={isLoading}
                  variant="secondary"
                  size="lg"
                  className="w-full"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      Start 14-Day Free Trial
                    </div>
                  )}
                </OsmoButton>
                <p className="text-center text-[var(--text-tertiary)] text-sm mt-3">
              Then $3/month • Cancel anytime
            </p>
              </OsmoCard>
          </div>

          {/* Free Plan */}
            <OsmoCard className="p-8">
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
                <span className="text-slate-200">Community features (always free)</span>
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
                  <span className="text-slate-500">📧 Daily habit notifications</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-red-400 text-xl">✗</span>
                  <span className="text-slate-500">Premium support</span>
                </div>
              </div>
            </div>

        {/* Free Plan Request */}
            <div className="text-center">
                <OsmoButton
                onClick={() => setShowFreeRequest(true)}
                  size="lg"
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 border-green-500/30"
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Request 100% Free Access
                  </div>
                </OsmoButton>
              <p className="text-green-300 text-sm mt-3 font-semibold">
                Can't afford it? We believe everyone deserves spiritual growth tools.
              </p>
                <p className="text-[var(--text-tertiary)] text-xs mt-2">
                Students, ministry workers, financial hardship - no questions asked.
              </p>
            </div>
            </OsmoCard>
        </div>

        {/* Free Plan Request Modal */}
        {showFreeRequest && (
          <div className="fixed inset-0 bg-[var(--glass-dark)] flex items-center justify-center p-4 z-50">
              <OsmoCard className="max-w-md w-full p-8">
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4 text-center">
                Request Free Access
              </h3>
              
              {!freeRequestSubmitted ? (
                <>
                    <p className="text-[var(--text-secondary)] mb-6 text-center">
                    <span className="text-green-400 font-semibold">100% Free Access</span> - Tell us why you need free access. 
                    We believe everyone deserves spiritual growth tools.
                  </p>
                  
                  <textarea
                    value={freeRequestReason}
                    onChange={(e) => setFreeRequestReason(e.target.value)}
                    placeholder="Please explain your situation (e.g., student, financial hardship, ministry worker, single parent...)"
                      className="w-full p-4 border border-green-600/50 rounded-xl resize-none h-32 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                  />
                  
                  <div className="flex gap-3 mt-6">
                      <OsmoButton
                      onClick={() => setShowFreeRequest(false)}
                        variant="secondary"
                        className="flex-1"
                    >
                      Cancel
                      </OsmoButton>
                      <OsmoButton
                      onClick={handleFreeRequest}
                      disabled={!freeRequestReason.trim()}
                        className="flex-1"
                    >
                      Submit Request
                      </OsmoButton>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div className="text-6xl mb-4">🎉</div>
                    <h4 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                    Request Submitted!
                  </h4>
                    <p className="text-[var(--text-secondary)] mb-6">
                    We'll review your request and get back to you within 24-48 hours.
                  </p>
                    <OsmoButton
                    onClick={() => setShowFreeRequest(false)}
                  >
                    Close
                    </OsmoButton>
                </div>
              )}
              </OsmoCard>
          </div>
        )}

        {/* FAQ Section */}
          <OsmoCard className="mb-12">
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-6 text-center">
            Frequently Asked Questions
          </h3>
          
          <div className="space-y-6">
            <div>
                <h4 className="font-semibold text-[var(--text-primary)] mb-2">
                How does the yearly payment work?
              </h4>
                <p className="text-[var(--text-secondary)]">
                You pay $30 once per year, which works out to just $2.50 per month - saving you $6 compared to monthly billing!
              </p>
            </div>
            
            <div>
                <h4 className="font-semibold text-[var(--text-primary)] mb-2">
                What's included in the Pro plan?
              </h4>
                <p className="text-[var(--text-secondary)]">
                Pro includes 4 premium features: Daily Re-Engagement System (uplifting messages & reminders), Weekly Progress Tracking (detailed analytics), Monthly Habit Builder (focused spiritual growth), Daily habit notifications, plus premium support. Community features are free for everyone!
              </p>
            </div>

            <div>
                <h4 className="font-semibold text-[var(--text-primary)] mb-2">
                How do I request 100% free access?
              </h4>
                <p className="text-[var(--text-secondary)]">
                Simply click "Request 100% Free Access" on the Free Plan and tell us about your situation. We're committed to making spiritual growth accessible to everyone - no questions asked.
              </p>
            </div>
            
            <div>
                <h4 className="font-semibold text-[var(--text-primary)] mb-2">
                How does the 14-day free trial work?
              </h4>
                <p className="text-[var(--text-secondary)]">
                Start your trial immediately with no credit card required. After 14 days, you can choose to continue with a paid plan or switch to our free access program.
              </p>
            </div>
          </div>
          </OsmoCard>

        {/* Contact Support */}
          <div className="text-center">
            <p className="text-[var(--text-secondary)] mb-4">
            Have questions? Need help choosing a plan?
          </p>
            <OsmoButton size="lg">
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
                Contact Support
              </div>
            </OsmoButton>
        </div>

        {/* Mobile Bottom Spacing */}
        <div className="h-24 lg:hidden"></div>

        {/* Mobile Navigation Tabs - Floating Glass Tabs */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center pb-6">
          <div className="flex items-center space-x-4">
            {/* Weekly Analysis Tab */}
            <button
                onClick={() => navigate('/analysis')}
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
                onClick={() => navigate('/prayer')}
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
                onClick={() => navigate('/community')}
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
        </OsmoContainer>
      </div>
    </div>
  )
}
