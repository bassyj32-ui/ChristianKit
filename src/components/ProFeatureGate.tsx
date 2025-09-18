import React from 'react'
import { subscriptionService, ProFeatureCheck } from '../services/subscriptionService'

interface ProFeatureGateProps {
  feature: 'dailyReEngagement' | 'weeklyProgressTracking' | 'monthlyHabitBuilder' | 'communityPrayerRequests' | 'premiumSupport' | 'communityFeatures'
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
      window.location.hash = 'subscription'
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
      name: 'Community Features (Free for Everyone)',
      emoji: '👥',
      description: 'Share prayers, encourage others, and connect with the community - available to all users!'
    },
    communityFeatures: {
      name: 'Community Features (Free for Everyone)',
      emoji: '👥',
      description: 'Share prayers, encourage others, and connect with the community - available to all users!'
    },
    premiumSupport: {
      name: 'Premium Support',
      emoji: '💎',
      description: 'Get priority support and personalized help with your spiritual growth.'
    }
  }

  const featureInfo = featureNames[feature]

  return (
    <div className="osmo-card">
      {/* Pro Badge */}
      <div className="flex items-center justify-center mb-4">
        <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-[var(--text-inverse)] px-4 py-2 rounded-full text-sm font-bold shadow-lg border border-[var(--accent-primary)]/50">
          ⭐ PRO FEATURE
        </span>
      </div>

      {/* Feature Info */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">{featureInfo.emoji}</div>
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
          {featureInfo.name}
        </h3>
        <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
          {featureInfo.description}
        </p>
      </div>

      {/* Upgrade Button */}
      <button
        onClick={handleUpgradeClick}
        className="osmo-button-primary w-full py-3 px-6 text-lg font-bold"
      >
        🚀 Upgrade to Pro - $2.50/month
      </button>

      {/* Additional Info */}
      <div className="text-center mt-4">
        <p className="text-[var(--text-tertiary)] text-xs">
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
