import React, { useState } from 'react'
import { subscriptionService } from '../services/subscriptionService'

export const ProFeaturesDemoCard: React.FC = () => {
  const [isDemoProEnabled, setIsDemoProEnabled] = useState(subscriptionService.checkDemoProAccess())

  const toggleDemoPro = () => {
    if (isDemoProEnabled) {
      subscriptionService.disableDemoPro()
      setIsDemoProEnabled(false)
    } else {
      subscriptionService.enableDemoPro()
      setIsDemoProEnabled(true)
    }
    
    // Refresh the page to apply changes
    window.location.reload()
  }

  const currentSubscription = subscriptionService.getCurrentSubscription()

  return (
    <div className="osmo-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-xl flex items-center justify-center">
            <span className="text-xl">✨</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Pro Features</h3>
            <p className="text-[var(--text-secondary)] text-sm">Advanced spiritual growth tools</p>
          </div>
        </div>
        
        {/* Current status */}
        <div className="text-right">
          <div className={`text-sm font-medium px-3 py-1 rounded-full ${
            currentSubscription?.tier === 'pro' 
              ? 'bg-green-500/20 text-green-300 border border-green-400/30'
              : 'bg-slate-700/50 text-slate-300 border border-slate-600/30'
          }`}>
            {currentSubscription?.tier === 'pro' ? '⭐ Pro Active' : '🔒 Free Plan'}
          </div>
        </div>
      </div>

      {/* Pro Features List */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between p-3 bg-slate-700/20 rounded-lg">
          <div className="flex items-center space-x-3">
            <span className="text-lg">📧</span>
            <div>
              <p className="text-white text-sm font-medium">Daily Re-Engagement System</p>
              <p className="text-slate-400 text-xs">Uplifting messages & reminders</p>
            </div>
          </div>
          <div className={`w-3 h-3 rounded-full ${
            currentSubscription?.features.dailyReEngagement ? 'bg-green-400' : 'bg-slate-600'
          }`}></div>
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-700/20 rounded-lg">
          <div className="flex items-center space-x-3">
            <span className="text-lg">📊</span>
            <div>
              <p className="text-white text-sm font-medium">Advanced Weekly Progress</p>
              <p className="text-slate-400 text-xs">Detailed analytics & insights</p>
            </div>
          </div>
          <div className={`w-3 h-3 rounded-full ${
            currentSubscription?.features.weeklyProgressTracking ? 'bg-green-400' : 'bg-slate-600'
          }`}></div>
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-700/20 rounded-lg">
          <div className="flex items-center space-x-3">
            <span className="text-lg">🎯</span>
            <div>
              <p className="text-white text-sm font-medium">Monthly Habit Builder</p>
              <p className="text-slate-400 text-xs">Focused spiritual growth themes</p>
            </div>
          </div>
          <div className={`w-3 h-3 rounded-full ${
            currentSubscription?.features.monthlyHabitBuilder ? 'bg-green-400' : 'bg-slate-600'
          }`}></div>
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-700/20 rounded-lg">
          <div className="flex items-center space-x-3">
            <span className="text-lg">🙏</span>
            <div>
              <p className="text-white text-sm font-medium">Community Prayer Requests</p>
              <p className="text-slate-400 text-xs">"I Prayed" encouragement system</p>
            </div>
          </div>
          <div className={`w-3 h-3 rounded-full ${
            currentSubscription?.features.communityPrayerRequests ? 'bg-green-400' : 'bg-slate-600'
          }`}></div>
        </div>
      </div>

      {/* Demo Controls */}
      <div className="border-t border-slate-600/30 pt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-slate-300">Demo Mode:</span>
          <button
            onClick={toggleDemoPro}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-300 ${
              isDemoProEnabled
                ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                : 'bg-slate-700/50 text-slate-300 border border-slate-600/30'
            }`}
          >
            {isDemoProEnabled ? 'Disable Demo Pro' : 'Enable Demo Pro'}
          </button>
        </div>
        
        <p className="text-slate-400 text-xs">
          Toggle demo Pro access to test all features without payment.
        </p>
      </div>

      {/* Upgrade Button for Free Users */}
      {currentSubscription?.tier !== 'pro' && (
        <div className="mt-4">
          <button
            onClick={() => window.location.hash = 'subscription'}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 px-6 rounded-xl font-bold text-sm hover:from-amber-500 hover:to-orange-500 transition-all duration-300 shadow-lg hover:shadow-amber-500/40 transform hover:-translate-y-1 border border-amber-500/30"
          >
            🚀 Upgrade to Pro - $2.50/month
          </button>
        </div>
      )}
    </div>
  )
}
