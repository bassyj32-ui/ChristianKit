import React, { useState } from 'react'

interface PrayerTimerButtonProps {
  className?: string
}

export const PrayerTimerButton: React.FC<PrayerTimerButtonProps> = ({ className = '' }) => {
  const [isHovered, setIsHovered] = useState(false)

  const handleStartPrayer = () => {
    // TODO: Navigate to Prayer Timer screen
    // Starting Prayer Timer
  }

  return (
    <button
      className={`group relative overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleStartPrayer}
    >
      {/* Background Animation */}
      <div className={`absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 transition-transform duration-300 ${
        isHovered ? 'scale-110' : 'scale-100'
      }`} />
      
      {/* Content */}
      <div className="relative flex items-center space-x-3">
        {/* Animated Icon */}
        <div className={`w-8 h-8 transition-transform duration-300 ${
          isHovered ? 'rotate-12 scale-110' : 'rotate-0 scale-100'
        }`}>
          <span className="text-2xl">🕯️</span>
        </div>
        
        {/* Text */}
        <div className="text-left">
          <div className="font-bold">Start Prayer Timer</div>
          <div className="text-sm text-green-100 opacity-90">
            Focus on your spiritual practice
          </div>
        </div>
        
        {/* Arrow */}
        <div className={`transition-transform duration-300 ${
          isHovered ? 'translate-x-1' : 'translate-x-0'
        }`}>
          <span className="text-xl">→</span>
        </div>
      </div>

      {/* Glow Effect */}
      <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        background: 'radial-gradient(circle at center, rgba(34, 197, 94, 0.3) 0%, transparent 70%)',
        filter: 'blur(20px)'
      }} />
    </button>
  )
}