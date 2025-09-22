import React from 'react'
import { PricingHeader } from './pricing/PricingHeader'
import { PricingGrid } from './pricing/PricingGrid'

export const OsmoPricingPage: React.FC = () => {
  const plans = [
    {
      name: 'Pro Yearly',
      price: '$30',
      period: '/year',
      description: 'Unlock everything & save 17%',
      monthlyPrice: '$2.50 per month',
      features: [
        '✓ Everything in Free',
        '✓ Daily Re-Engagement System',
        '✓ Weekly Progress Tracking', 
        '✓ Monthly Habit Builder',
        '✓ Community Features [Free for Everyone]',
        '✓ Premium support'
      ],
      missing: [],
      buttonText: 'Start 14-Day Free Trial',
      buttonClass: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold hover:from-yellow-300 hover:to-yellow-400',
      featured: true,
      savingsNote: 'Save $6/year',
      footerText: 'Then $30/year'
    },
    {
      name: 'Pro Monthly',
      price: '$3',
      period: '/month',
      description: 'Full access to all features',
      monthlyPrice: 'Billed monthly',
      features: [
        '✓ Everything in Free',
        '✓ Daily Re-Engagement System',
        '✓ Weekly Progress Tracking',
        '✓ Monthly Habit Builder', 
        '✓ Community Features [Free for Everyone]',
        '✓ Premium support'
      ],
      missing: [],
      buttonText: 'Start 14-Day Free Trial',
      buttonClass: 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold hover:from-yellow-300 hover:to-yellow-400',
      featured: false,
      footerText: 'Then $3/month'
    },
    {
      name: 'Free Plan',
      price: '$0',
      period: '/month',
      description: 'Basic features included',
      monthlyPrice: 'Forever free',
      features: [
        '✓ Basic habit tracking',
        '✓ Prayer timer [limited to 30 mins]',
        '✓ Basic Bible reading progress',
        '✓ Community features [always free]',
        '✓ Simple weekly overview'
      ],
      missing: [
        '✗ Daily Re-Engagement System',
        '✗ Advanced Weekly Tracking',
        '✗ Monthly Habit Builder',
        '✗ Daily habit notifications',
        '✗ Premium support'
      ],
      buttonText: 'Request 100% Free Access',
      buttonClass: 'bg-gradient-to-r from-green-400 to-yellow-400 text-black font-bold hover:from-green-300 hover:to-yellow-300',
      featured: false,
      footerText: 'Can\'t afford it? We believe everyone deserves spiritual growth tools.'
    }
  ]

  const handleUpgrade = (planName: string) => {
    console.log('Upgrade to plan:', planName)
    // TODO: Implement actual upgrade logic
  }

  return (
    <div className="min-h-screen bg-black">
      <PricingHeader />
      <PricingGrid plans={plans} onUpgrade={handleUpgrade} />
    </div>
  )
}

export default OsmoPricingPage