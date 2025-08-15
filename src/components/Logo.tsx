import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
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
      {/* Logo Icon - Camera with Book */}
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg relative`}>
        {/* Camera Body */}
        <div className="w-4/5 h-4/5 bg-white rounded-lg flex items-center justify-center relative">
          {/* Camera Lens (C shape) */}
          <div className="w-3/4 h-3/4 border-2 border-gray-700 rounded-full border-r-transparent transform -rotate-45"></div>
          {/* Flash/Secondary Lens */}
          <div className="absolute top-0 right-0 w-2 h-2 bg-gray-700 rounded-full"></div>
        </div>
        
        {/* Open Book Below Camera */}
        <div className="absolute -bottom-1 w-full h-1/4 flex justify-center">
          <div className="w-3/4 h-full bg-white rounded-sm flex items-center justify-center">
            <div className="w-2/3 h-2/3 bg-gray-700/30 rounded-sm"></div>
          </div>
        </div>
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
