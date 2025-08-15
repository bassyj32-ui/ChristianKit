import React, { useState } from 'react'
import { ThemeToggle } from './ThemeToggle'

interface NavigationItem {
  id: string
  label: string
  icon: string
}

interface TopNavigationProps {
  activeTab: string
  onTabChange: (tabId: string) => void
}

export const TopNavigation: React.FC<TopNavigationProps> = ({ activeTab, onTabChange }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '🏠'
    },
    {
      id: 'prayer',
      label: 'Prayer',
      icon: '🙏'
    },
    {
      id: 'journal',
      label: 'Journal',
      icon: '📝'
    },
    {
      id: 'community',
      label: 'Community',
      icon: '👥'
    },
    {
      id: 'store',
      label: 'Store',
      icon: '🛍️'
    }
  ]

  return (
    <>
      {/* Main Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-b border-gray-200/30 dark:border-gray-700/30 shadow-lg z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">✝️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                  ChristianKit
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">Grow Your Faith Daily</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-orange-100 to-pink-100 dark:from-orange-900/40 dark:to-pink-900/40 text-orange-600 dark:text-orange-400 shadow-md'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Streak Display */}
              <div className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-orange-100 to-pink-100 dark:from-orange-900/40 dark:to-pink-900/40 px-3 py-2 rounded-xl border border-orange-200/50 dark:border-orange-700/50">
                <span className="text-orange-600 dark:text-orange-400 text-sm">🔥</span>
                <span className="text-orange-700 dark:text-orange-300 font-bold text-sm">7 Day</span>
              </div>
              
              <ThemeToggle />
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-300"
              >
                <span className="text-gray-600 dark:text-gray-400 text-lg">
                  {isMenuOpen ? '✕' : '☰'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      <div className={`lg:hidden fixed top-20 left-0 right-0 bg-white/98 dark:bg-gray-800/98 backdrop-blur-xl border-b border-gray-200/30 dark:border-gray-700/30 shadow-xl z-40 transition-all duration-300 ${
        isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}>
        <div className="container mx-auto px-6 py-4">
          <div className="grid grid-cols-2 gap-2">
            {navigationItems.map((item) => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id)
                    setIsMenuOpen(false)
                  }}
                  className={`flex flex-col items-center space-y-2 p-4 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-100 to-pink-100 dark:from-orange-900/40 dark:to-pink-900/40 text-orange-600 dark:text-orange-400 shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Spacer to prevent content from hiding under fixed nav */}
      <div className="h-20"></div>
    </>
  )
}



