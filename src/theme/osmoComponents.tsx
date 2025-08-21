import React from 'react'
import { osmoTheme } from './osmoTheme'

// Osmo-inspired reusable components for ChristianKit

// Glass Card Component (like Osmo's clean cards)
interface OsmoCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glow?: boolean
}

export const OsmoCard: React.FC<OsmoCardProps> = ({ 
  children, 
  className = '', 
  hover = true,
  glow = false 
}) => {
  return (
    <div className={`
      bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6
      ${hover ? 'hover:bg-white/8 hover:border-white/20 transition-all duration-300' : ''}
      ${glow ? 'shadow-lg shadow-amber-500/10' : 'shadow-lg shadow-black/20'}
      ${className}
    `}>
      {children}
    </div>
  )
}

// Osmo-style Button
interface OsmoButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  disabled?: boolean
  className?: string
}

export const OsmoButton: React.FC<OsmoButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = ''
}) => {
  const baseClasses = 'font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95'
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:from-amber-300 hover:to-yellow-400 shadow-lg shadow-amber-500/25',
    secondary: 'bg-white/10 text-white border border-white/20 hover:bg-white/15 hover:border-white/30',
    ghost: 'text-white hover:bg-white/10'
  }
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  )
}

// Osmo-style Input
interface OsmoInputProps {
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  className?: string
}

export const OsmoInput: React.FC<OsmoInputProps> = ({
  placeholder,
  value,
  onChange,
  type = 'text',
  className = ''
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`
        w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3
        text-white placeholder-gray-400
        focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50
        transition-all duration-300
        ${className}
      `}
    />
  )
}

// Osmo-style Section Header
interface OsmoSectionHeaderProps {
  title: string
  subtitle?: string
  centered?: boolean
  className?: string
}

export const OsmoSectionHeader: React.FC<OsmoSectionHeaderProps> = ({
  title,
  subtitle,
  centered = true,
  className = ''
}) => {
  return (
    <div className={`mb-12 ${centered ? 'text-center' : ''} ${className}`}>
      <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  )
}

// Osmo-style Grid Container
interface OsmoGridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export const OsmoGrid: React.FC<OsmoGridProps> = ({
  children,
  columns = 2,
  gap = 'md',
  className = ''
}) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }
  
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8'
  }
  
  return (
    <div className={`grid ${gridClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  )
}

// Osmo-style Badge/Tag
interface OsmoBadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'spiritual'
  size?: 'sm' | 'md'
  className?: string
}

export const OsmoBadge: React.FC<OsmoBadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = ''
}) => {
  const variantClasses = {
    primary: 'bg-gradient-to-r from-amber-400/20 to-yellow-500/20 text-amber-200 border-amber-400/30',
    secondary: 'bg-white/10 text-white border-white/20',
    spiritual: 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-200 border-purple-400/30'
  }
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm'
  }
  
  return (
    <span className={`
      inline-flex items-center font-medium rounded-full border
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      ${className}
    `}>
      {children}
    </span>
  )
}

// Osmo-style Container
interface OsmoContainerProps {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding?: boolean
  className?: string
}

export const OsmoContainer: React.FC<OsmoContainerProps> = ({
  children,
  size = 'lg',
  padding = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full'
  }
  
  return (
    <div className={`
      mx-auto
      ${sizeClasses[size]}
      ${padding ? 'px-4 sm:px-6 lg:px-8' : ''}
      ${className}
    `}>
      {children}
    </div>
  )
}

// Osmo-style Gradient Text
interface OsmoGradientTextProps {
  children: React.ReactNode
  gradient?: 'gold' | 'spiritual' | 'rainbow'
  className?: string
}

export const OsmoGradientText: React.FC<OsmoGradientTextProps> = ({
  children,
  gradient = 'gold',
  className = ''
}) => {
  const gradientClasses = {
    gold: 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400',
    spiritual: 'bg-gradient-to-r from-purple-400 via-blue-500 to-purple-400',
    rainbow: 'bg-gradient-to-r from-purple-400 via-pink-500 via-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-400'
  }
  
  return (
    <span className={`
      ${gradientClasses[gradient]}
      bg-clip-text text-transparent
      ${className}
    `}>
      {children}
    </span>
  )
}
