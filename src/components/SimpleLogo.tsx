import React from 'react';

interface SimpleLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const SimpleLogo: React.FC<SimpleLogoProps> = ({ 
  size = 'md', 
  showText = true, 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`w-${size} h-${size} bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-xl flex items-center justify-center shadow-lg`}>
        <span className="text-[var(--text-inverse)] text-lg font-bold">✝️</span>
      </div>
      <span className={`text-[var(--text-primary)] font-bold ${textSizes[size]}`}>ChristianKit</span>
    </div>
  )
};
