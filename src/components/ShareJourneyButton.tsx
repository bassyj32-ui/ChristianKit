import React, { useState } from 'react'

interface ShareJourneyButtonProps {
  className?: string
}

export const ShareJourneyButton: React.FC<ShareJourneyButtonProps> = ({ className = '' }) => {
  const [isHovered, setIsHovered] = useState(false)

  const handleShareJourney = () => {
    // TODO: Open share journey modal
    // Sharing spiritual journey
  }

  return (
    <button
      className={`group relative overflow-hidden bg-gradient-to-r from-orange-400 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleShareJourney}
    >
      {/* Background Animation */}
      <div className={`absolute inset-0 bg-gradient-to-r from-orange-500 to-pink-600 transition-transform duration-300 ${
        isHovered ? 'scale-110' : 'scale-100'
      }`} />

      {/* Content */}
      <div className="relative flex items-center space-x-2">
        {/* Animated Icon */}
        <div className={`w-5 h-5 transition-transform duration-300 ${
          isHovered ? 'rotate-12 scale-110' : 'rotate-0 scale-100'
        }`}>
          <span className="text-lg">✨</span>
        </div>

        {/* Text */}
        <span className="font-semibold">Share Your Journey</span>

        {/* Arrow */}
        <div className={`transition-transform duration-300 ${
          isHovered ? 'translate-x-1' : 'translate-x-0'
        }`}>
          <span className="text-sm">→</span>
        </div>
      </div>

      {/* Glow Effect */}
      <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        background: 'radial-gradient(circle at center, rgba(251, 146, 60, 0.3) 0%, transparent 70%)',
        filter: 'blur(15px)'
      }} />
    </button>
  )
}