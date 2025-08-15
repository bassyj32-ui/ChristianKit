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
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Simple Logo Icon */}
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg`}>
        {/* Camera Icon */}
        <div className="text-white font-bold text-2xl">📷</div>
      </div>
      
      {/* Logo Text */}
      {showText && (
        <h1 className={`font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent ${textSizes[size]}`}>
          ChristianKit
        </h1>
      )}
    </div>
  );
};
