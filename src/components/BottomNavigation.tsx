import React from 'react'

interface NavigationItem {
  id: string
  label: string
  icon: string
  path: string
}

interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tabId: string) => void
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange }) => {
  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '🏠',
      path: '/'
    },
    {
      id: 'prayer',
      label: 'Prayer',
      icon: '🙏',
      path: '/prayer'
    },
    {
      id: 'journal',
      label: 'Journal',
      icon: '📝',
      path: '/journal'
    },
    {
      id: 'community',
      label: 'Community',
      icon: '👥',
      path: '/community'
    },
    {
      id: 'store',
      label: 'Store',
      icon: '🛍️',
      path: '/store'
    }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-t border-gray-200/30 dark:border-gray-700/30 shadow-2xl z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around py-3">
          {navigationItems.map((item) => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-2xl transition-all duration-300 transform hover:scale-110 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-100 to-pink-100 dark:from-orange-900/40 dark:to-pink-900/40 text-orange-600 dark:text-orange-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {/* Icon */}
                <div className={`text-2xl transition-all duration-300 ${
                  isActive ? 'transform scale-110' : ''
                }`}>
                  {item.icon}
                </div>
                
                {/* Label */}
                <span className={`text-xs font-medium transition-all duration-300 ${
                  isActive ? 'font-bold' : ''
                }`}>
                  {item.label}
                </span>
                
                {/* Active Indicator */}
                {isActive && (
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse shadow-lg shadow-orange-400/50" />
                )}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Bottom Border Glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-30" />
    </nav>
  )
}
