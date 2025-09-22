import React from 'react'

export const PricingHeader: React.FC = () => {
  return (
    <div className="text-center py-6 sm:py-8 md:py-12 lg:py-16 px-3 sm:px-4 md:px-6">
      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-white leading-tight px-2">
        Choose your spiritual journey
      </h1>
      <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto px-4">
        Start with a 14-day free trial - no credit card required
      </p>
    </div>
  )
}
