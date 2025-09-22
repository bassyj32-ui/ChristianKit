import React from 'react'

interface Plan {
  name: string
  price: string
  period: string
  description: string
  monthlyPrice?: string
  features: string[]
  missing?: string[]
  buttonText: string
  buttonClass: string
  featured: boolean
  footerText?: string
  savingsNote?: string
}

interface PricingGridProps {
  plans: Plan[]
  onUpgrade?: (planName: string) => void
}

export const PricingGrid: React.FC<PricingGridProps> = ({ plans, onUpgrade }) => {
  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 pb-12 sm:pb-16 md:pb-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {plans.map((plan, index) => (
          <PricingCard
            key={plan.name}
            plan={plan}
            onUpgrade={onUpgrade}
          />
        ))}
      </div>
    </div>
  )
}

// Separate PricingCard component for reuse
export const PricingCard: React.FC<{
  plan: Plan
  onUpgrade?: (planName: string) => void
}> = ({ plan, onUpgrade }) => {
  const getCardBackground = () => {
    if (plan.featured) return 'bg-blue-900'
    if (plan.name === 'Pro Monthly') return 'bg-gray-100'
    return 'bg-white'
  }

  const getTextColor = (type: 'primary' | 'secondary' | 'muted') => {
    if (plan.featured) {
      switch (type) {
        case 'primary': return 'text-white'
        case 'secondary': return 'text-white/90'
        case 'muted': return 'text-white/70'
      }
    }
    if (plan.name === 'Pro Monthly') {
      switch (type) {
        case 'primary': return 'text-black'
        case 'secondary': return 'text-gray-600'
        case 'muted': return 'text-gray-500'
      }
    }
    switch (type) {
      case 'primary': return 'text-black'
      case 'secondary': return 'text-gray-600'
      case 'muted': return 'text-gray-500'
    }
  }

  const getBorderColor = () => {
    if (plan.featured) return 'border-white/30'
    return 'border-gray-300'
  }

  return (
    <div className={`relative rounded-lg transition-all duration-300 transform hover:scale-105 ${getCardBackground()}`}>
      {/* Card Content */}
      <div className="p-6 sm:p-8 text-center">
        {/* Plan Title */}
        <h3 className={`text-2xl sm:text-3xl font-bold mb-4 ${getTextColor('primary')}`}>
          {plan.name}
        </h3>

        {/* Price */}
        <div className={`border-b pb-4 mb-4 text-center ${getBorderColor()}`}>
          <div className="flex items-baseline justify-center gap-2">
            <span className={`text-3xl sm:text-4xl font-bold ${getTextColor('primary')}`}>
              {plan.price}
            </span>
            <span className={`text-lg ${getTextColor('secondary')}`}>
              {plan.period}
            </span>
          </div>
          {plan.monthlyPrice && (
            <p className={`text-sm mt-1 ${getTextColor('muted')}`}>
              {plan.monthlyPrice}
            </p>
          )}
        </div>

        {/* Description */}
        <p className={`text-sm leading-relaxed mb-6 ${getTextColor('secondary')}`}>
          {plan.description}
        </p>

        {/* Features List */}
        <div className="mb-6 text-left">
          <h4 className={`text-sm font-semibold mb-3 ${getTextColor('primary')}`}>
            What's included:
          </h4>
          <div className="space-y-2">
            {plan.features.map((feature, featureIndex) => (
              <div key={featureIndex} className="flex items-start gap-2">
                <span className={`text-sm mt-0.5 ${getTextColor('primary')}`}>✓</span>
                <span className={`text-sm leading-relaxed ${getTextColor('secondary')}`}>
                  {feature.replace('✓ ', '')}
                </span>
              </div>
            ))}
          </div>

          {plan.missing && plan.missing.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-300">
              <h4 className={`text-sm font-semibold mb-3 ${getTextColor('muted')}`}>
                Not included:
              </h4>
              <div className="space-y-2">
                {plan.missing.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start gap-2">
                    <span className={`text-sm mt-0.5 ${getTextColor('muted')}`}>✗</span>
                    <span className={`text-sm leading-relaxed ${getTextColor('muted')}`}>
                      {feature.replace('✗ ', '')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTA Button */}
        <button
          onClick={() => onUpgrade?.(plan.name)}
          className={`w-full py-3 sm:py-4 rounded-lg font-semibold text-sm transition-all duration-300 ${plan.buttonClass}`}
        >
          {plan.buttonText}
        </button>

        {/* Footer Text */}
        {plan.footerText && (
          <p className={`text-xs text-center mt-4 leading-relaxed ${getTextColor('muted')}`}>
            {plan.footerText}
          </p>
        )}

        {/* Savings Note */}
        {plan.savingsNote && (
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mt-4">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span className="text-green-400 text-sm font-semibold">{plan.savingsNote}</span>
          </div>
        )}
      </div>
    </div>
  )
}
