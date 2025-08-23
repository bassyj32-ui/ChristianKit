import React from 'react'
import { useThemeMode } from '../theme/ThemeProvider'

interface ThemeToggleProps {
  className?: string;
  showLabels?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  showLabels = true 
}) => {
  const { mode, setMode, toggleMode } = useThemeMode();

  const handleModeChange = (newMode: 'light' | 'dark' | 'system') => {
    setMode(newMode);
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showLabels && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Theme:
        </span>
      )}
      
      <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-800">
        <button
          onClick={() => handleModeChange('light')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            mode === 'light'
              ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          aria-label="Light mode"
        >
          {showLabels ? 'Light' : '☀️'}
        </button>
        
        <button
          onClick={() => handleModeChange('system')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            mode === 'system'
              ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          aria-label="System theme"
        >
          {showLabels ? 'System' : '💻'}
        </button>
        
        <button
          onClick={() => handleModeChange('dark')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            mode === 'dark'
              ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          aria-label="Dark mode"
        >
          {showLabels ? 'Dark' : '🌙'}
        </button>
      </div>
      
      {showLabels && (
        <button
          onClick={toggleMode}
          className="px-3 py-1 text-sm rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          aria-label="Toggle theme"
        >
          Toggle
        </button>
      )}
    </div>
  );
};

export default ThemeToggle;
