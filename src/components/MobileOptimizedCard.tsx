import React, { useState } from 'react'

interface MobileOptimizedCardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  variant?: 'default' | 'primary' | 'secondary' | 'accent'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
}

export const MobileOptimizedCard: React.FC<MobileOptimizedCardProps> = ({
  children,
  className = '',
  onClick,
  variant = 'default',
  size = 'md',
  disabled = false,
  loading = false
}) => {
  const [isPressed, setIsPressed] = useState(false)

  const baseClasses = `
    relative overflow-hidden transition-all duration-200 ease-out
    active:scale-95 active:shadow-lg
    focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-slate-900
    ${onClick ? 'cursor-pointer select-none' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${loading ? 'pointer-events-none' : ''}
  `

  const variantClasses = {
    default: 'bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 hover:border-yellow-400/30',
    primary: 'bg-gradient-to-br from-yellow-400/20 to-amber-500/20 backdrop-blur-xl border border-yellow-400/30 hover:border-yellow-400/50',
    secondary: 'bg-slate-700/50 backdrop-blur-xl border border-slate-600/50 hover:border-slate-500/50',
    accent: 'bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-xl border border-blue-400/30 hover:border-blue-400/50'
  }

  const sizeClasses = {
    sm: 'p-3 rounded-xl',
    md: 'p-4 sm:p-6 rounded-2xl',
    lg: 'p-6 sm:p-8 rounded-3xl'
  }

  const handleTouchStart = () => {
    if (!disabled && !loading) {
      setIsPressed(true)
    }
  }

  const handleTouchEnd = () => {
    setIsPressed(false)
  }

  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick()
    }
  }

  return (
    <div
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
        ${isPressed ? 'scale-95 shadow-lg' : ''}
      `}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-disabled={disabled}
    >
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Osmo-style Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
