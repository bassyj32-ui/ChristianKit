import React, { useState } from 'react'
import { useSupabaseAuth } from './SupabaseAuthProvider'

interface PersistentNavigationProps {
  activeTab: string
  onNavigate: (tab: string) => void
}

export const PersistentNavigation: React.FC<PersistentNavigationProps> = ({ 
  activeTab, 
  onNavigate 
}) => {
  const { user } = useSupabaseAuth()
  const [isExpanded, setIsExpanded] = useState(false)

  const navigationItems = [
    {
      id: 'prayer',
      label: 'Prayer',
      icon: '🙏',
      path: 'prayer'
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '🏠',
      path: 'dashboard'
    },
    {
      id: 'community',
      label: 'Community',
      icon: '👥',
      path: 'community'
    },
    {
      id: 'runner',
      label: 'Faith Runner',
      icon: '🎮',
      path: 'runner'
    },
    {
      id: 'bible',
      label: 'Bible',
      icon: '📖',
      path: 'bible'
    },
    {
      id: 'journal',
      label: 'Journal',
      icon: '📝',
      path: 'journal'
    }
  ]

  const handleNavigation = (tab: string) => {
    onNavigate(tab)
    setIsExpanded(false)
  }

  return (
    <>
      {/* Mobile Navigation Bar - Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-t border-yellow-400/20">
        <div className="flex items-center justify-around py-2 px-4">
          {navigationItems.slice(0, 4).map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 ${
                activeTab === item.path
                  ? 'bg-yellow-400/20 text-yellow-400 scale-110'
                  : 'text-slate-400 hover:text-yellow-400 hover:bg-yellow-400/10'
              }`}
            >
              <span className="text-lg mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
          
          {/* More Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 ${
              isExpanded
                ? 'bg-yellow-400/20 text-yellow-400'
                : 'text-slate-400 hover:text-yellow-400 hover:bg-yellow-400/10'
            }`}
          >
            <span className="text-lg mb-1">⋯</span>
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </div>

      {/* Expanded Navigation Overlay */}
      {isExpanded && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setIsExpanded(false)}>
          <div className="absolute bottom-20 left-4 right-4 bg-black/90 backdrop-blur-xl border border-yellow-400/20 rounded-2xl p-4">
            <div className="grid grid-cols-2 gap-3">
              {navigationItems.slice(4).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 ${
                    activeTab === item.path
                      ? 'bg-yellow-400/20 text-yellow-400'
                      : 'text-slate-400 hover:text-yellow-400 hover:bg-yellow-400/10'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
              
              {/* Profile */}
              <button
                onClick={() => handleNavigation('profile')}
                className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 ${
                  activeTab === 'profile'
                    ? 'bg-yellow-400/20 text-yellow-400'
                    : 'text-slate-400 hover:text-yellow-400 hover:bg-yellow-400/10'
                }`}
              >
                <span className="text-xl">👤</span>
                <span className="font-medium">Profile</span>
              </button>
              
              {/* Leaderboard */}
              <button
                onClick={() => handleNavigation('leaderboard')}
                className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 ${
                  activeTab === 'leaderboard'
                    ? 'bg-yellow-400/20 text-yellow-400'
                    : 'text-slate-400 hover:text-yellow-400 hover:bg-yellow-400/10'
                }`}
              >
                <span className="text-xl">🏆</span>
                <span className="font-medium">Leaderboard</span>
              </button>
              
              {/* Settings */}
              <button
                onClick={() => handleNavigation('settings')}
                className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 ${
                  activeTab === 'settings'
                    ? 'bg-yellow-400/20 text-yellow-400'
                    : 'text-slate-400 hover:text-yellow-400 hover:bg-yellow-400/10'
                }`}
              >
                <span className="text-xl">⚙️</span>
                <span className="font-medium">Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar Navigation */}
      <div className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 bg-black/90 backdrop-blur-xl border-r border-yellow-400/20 z-40">
        <div className="p-6">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
              ✝️ ChristianKit
            </h1>
            <p className="text-slate-400 text-sm mt-1">Your spiritual companion</p>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 text-left ${
                  activeTab === item.path
                    ? 'bg-yellow-400/20 text-yellow-400'
                    : 'text-slate-400 hover:text-yellow-400 hover:bg-yellow-400/10'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
            
            {/* Profile */}
            <button
              onClick={() => handleNavigation('profile')}
              className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 text-left ${
                activeTab === 'profile'
                  ? 'bg-yellow-400/20 text-yellow-400'
                  : 'text-slate-400 hover:text-yellow-400 hover:bg-yellow-400/10'
              }`}
            >
              <span className="text-xl">👤</span>
              <span className="font-medium">Profile</span>
            </button>
            
            {/* Leaderboard */}
            <button
              onClick={() => handleNavigation('leaderboard')}
              className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 text-left ${
                activeTab === 'leaderboard'
                  ? 'bg-yellow-400/20 text-yellow-400'
                  : 'text-slate-400 hover:text-yellow-400 hover:bg-yellow-400/10'
              }`}
            >
              <span className="text-xl">🏆</span>
              <span className="font-medium">Leaderboard</span>
            </button>
            
            {/* Settings */}
            <button
              onClick={() => handleNavigation('settings')}
              className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 text-left ${
                activeTab === 'settings'
                  ? 'bg-yellow-400/20 text-yellow-400'
                  : 'text-slate-400 hover:text-yellow-400 hover:bg-yellow-400/10'
              }`}
            >
              <span className="text-xl">⚙️</span>
              <span className="font-medium">Settings</span>
            </button>
          </nav>

          {/* User Info */}
          {user && (
            <div className="mt-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-black font-bold">
                  {user?.user_metadata?.display_name?.[0] || user.email?.[0] || '👤'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {user?.user_metadata?.display_name || 'User'}
                  </p>
                  <p className="text-slate-400 text-sm truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
