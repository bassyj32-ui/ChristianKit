import React from 'react'
import { subscriptionService, ProFeatureCheck } from '../services/subscriptionService'

interface ProFeatureGateProps {
  feature: 'dailyReEngagement' | 'weeklyProgressTracking' | 'monthlyHabitBuilder' | 'communityPrayerRequests' | 'premiumSupport'
  children: React.ReactNode
  fallback?: React.ReactNode
  showUpgradePrompt?: boolean
  onUpgradeClick?: () => void
}

export const ProFeatureGate: React.FC<ProFeatureGateProps> = ({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
  onUpgradeClick
}) => {
  const featureCheck: ProFeatureCheck = subscriptionService.checkProFeature(feature)

  if (featureCheck.hasAccess) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  if (!showUpgradePrompt) {
    return null
  }

  const handleUpgradeClick = () => {
    if (onUpgradeClick) {
      onUpgradeClick()
    } else {
      // Default navigation to subscription page
      window.location.href = '/#subscription'
    }
  }

  const featureNames = {
    dailyReEngagement: {
      name: 'Daily Re-Engagement System',
      emoji: '📧',
      description: 'Get uplifting daily messages and encouraging reminders to stay consistent in your spiritual journey.'
    },
    weeklyProgressTracking: {
      name: 'Advanced Weekly Progress Tracking',
      emoji: '📊',
      description: 'Access detailed analytics, insights, and beautiful progress visualizations.'
    },
    monthlyHabitBuilder: {
      name: 'Monthly Habit Builder',
      emoji: '🎯',
      description: 'Focus on one spiritual habit each month with guided practices and resources.'
    },
    communityPrayerRequests: {
      name: 'Community Prayer Requests',
      emoji: '🙏',
      description: 'Share prayer requests and encourage others with the "I Prayed" feature.'
    },
    premiumSupport: {
      name: 'Premium Support',
      emoji: '💎',
      description: 'Get priority support and personalized help with your spiritual growth.'
    }
  }

  const featureInfo = featureNames[feature]

  return (
    <div className="bg-gradient-to-br from-slate-800/90 via-gray-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl p-6 text-white shadow-xl border border-gray-600/30">
      {/* Pro Badge */}
      <div className="flex items-center justify-center mb-4">
        <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-amber-900 px-4 py-2 rounded-full text-sm font-bold shadow-lg border border-amber-300/50">
          ⭐ PRO FEATURE
        </span>
      </div>

      {/* Feature Info */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">{featureInfo.emoji}</div>
        <h3 className="text-xl font-bold text-white mb-2">
          {featureInfo.name}
        </h3>
        <p className="text-slate-300 text-sm leading-relaxed">
          {featureInfo.description}
        </p>
      </div>

      {/* Upgrade Button */}
      <button
        onClick={handleUpgradeClick}
        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 px-6 rounded-xl font-bold text-lg hover:from-amber-500 hover:to-orange-500 transition-all duration-300 shadow-lg hover:shadow-amber-500/40 transform hover:-translate-y-1 border border-amber-500/30"
      >
        🚀 Upgrade to Pro - $2.50/month
      </button>

      {/* Additional Info */}
      <div className="text-center mt-4">
        <p className="text-slate-400 text-xs">
          Join thousands growing their faith with Pro features
        </p>
      </div>
    </div>
  )
}

// Higher-order component for easy pro feature wrapping
export const withProFeature = <P extends object>(
  Component: React.ComponentType<P>,
  feature: ProFeatureGateProps['feature'],
  options?: {
    fallback?: React.ReactNode
    showUpgradePrompt?: boolean
  }
) => {
  return (props: P) => (
    <ProFeatureGate
      feature={feature}
      fallback={options?.fallback}
      showUpgradePrompt={options?.showUpgradePrompt}
    >
      <Component {...props} />
    </ProFeatureGate>
  )
}
