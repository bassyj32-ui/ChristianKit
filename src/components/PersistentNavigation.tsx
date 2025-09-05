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

  // Primary navigation items (shown in bottom bar)
  const primaryNavigationItems = [
    {
      id: 'home',
      label: 'Home',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      ),
      path: 'home'
    },
    {
      id: 'prayer',
      label: 'Prayer',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ),
      path: 'prayer'
    },
    {
      id: 'community',
      label: 'Community',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H16c-.8 0-1.54.37-2.01.99L12 11l-1.99-2.01A2.5 2.5 0 0 0 8 8H5.46c-.8 0-1.54.37-2.01.99L1 15.5V22h2v-6h2.5l2.5 7.5h2L10 16h4l1.5 7.5h2L18 16h2v6h2zM12 7.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5z"/>
        </svg>
      ),
      path: 'community'
    },
    {
      id: 'runner',
      label: 'Game',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.5 2c.83 0 1.5.67 1.5 1.5v17c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5v-17c0-.83.67-1.5 1.5-1.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      ),
      path: 'runner'
    }
  ]

  // Secondary navigation items (shown in desktop sidebar and mobile "More")
  const secondaryNavigationItems = [
    {
      id: 'bible',
      label: 'Bible',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
        </svg>
      ),
      path: 'bible'
    },
    {
      id: 'journal',
      label: 'Journal',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
        </svg>
      ),
      path: 'journal'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      ),
      path: 'profile'
    }
  ]

  // Tertiary navigation items (advanced features)
  const tertiaryNavigationItems = [
    {
      id: 'leaderboard',
      label: 'Leaderboard',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7.5 21H2V9h5.5v12zm7.25-18h-5.5v18h5.5V3zM22 11h-5.5v10H22V11z"/>
        </svg>
      ),
      path: 'leaderboard'
    },
    {
      id: 'analysis',
      label: 'Analysis',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6H16Z"/>
        </svg>
      ),
      path: 'analysis'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
        </svg>
      ),
      path: 'settings'
    }
  ]

  const handleNavigation = (tab: string) => {
    onNavigate(tab)
    setIsExpanded(false)
  }

  return (
    <>
      {/* Mobile Navigation Bar - Bottom */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-t border-amber-400/20">
        <div className="flex items-center justify-around py-2 px-4">
          {primaryNavigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 ${
                activeTab === item.path
                  ? 'bg-amber-400/20 text-amber-400 scale-110'
                  : 'text-slate-400 hover:text-amber-400 hover:bg-amber-400/10'
              }`}
            >
              <div className="mb-1">{item.icon}</div>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
          
          {/* More Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 ${
              isExpanded
                ? 'bg-amber-400/20 text-amber-400'
                : 'text-slate-400 hover:text-amber-400 hover:bg-amber-400/10'
            }`}
          >
            <svg className="w-5 h-5 mb-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z"/>
            </svg>
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </div>

      {/* Expanded Navigation Overlay */}
      {isExpanded && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setIsExpanded(false)}>
          <div className="absolute bottom-20 left-4 right-4 bg-black/90 backdrop-blur-xl border border-amber-400/20 rounded-2xl p-4">
            <div className="grid grid-cols-2 gap-3">
              {/* More Navigation Items */}
              {[...secondaryNavigationItems, ...tertiaryNavigationItems].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 ${
                    activeTab === item.path
                      ? 'bg-amber-400/20 text-amber-400'
                      : 'text-slate-400 hover:text-amber-400 hover:bg-amber-400/10'
                  }`}
                >
                  <div className="text-xl">{item.icon}</div>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Top App Bar Navigation */}
      <div className="hidden lg:block fixed top-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-xl border-b border-amber-400/20">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/christiankit-icon.svg" 
                alt="ChristianKit" 
                className="w-8 h-8"
              />
              <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">
                ChristianKit
              </h1>
            </div>
          </div>

          {/* Right Side Navigation */}
          <div className="flex items-center space-x-1">
            {/* Main Navigation */}
            <div className="flex items-center space-x-1">
              {primaryNavigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                    activeTab === item.path
                      ? 'bg-amber-400/20 text-amber-400'
                      : 'text-slate-400 hover:text-amber-400 hover:bg-amber-400/10'
                  }`}
                >
                  <div className="text-lg">{item.icon}</div>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>

            {/* More Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-300 ${
                isExpanded
                  ? 'bg-amber-400/20 text-amber-400'
                  : 'text-slate-400 hover:text-amber-400 hover:bg-amber-400/10'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z"/>
              </svg>
              <span className="font-medium hidden xl:block">More</span>
            </button>

            {/* User Info */}
            {user && (
              <div className="flex items-center space-x-3 ml-4">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center text-black font-bold text-sm">
                  {user?.user_metadata?.display_name?.[0] || user.email?.[0] || '👤'}
                </div>
                <div className="hidden xl:block">
                  <p className="text-white font-medium text-sm truncate max-w-32">
                    {user?.user_metadata?.display_name || 'User'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Navigation Dropdown */}
      {isExpanded && (
        <div className="fixed top-16 right-6 z-50 bg-black/90 backdrop-blur-xl border border-amber-400/20 rounded-2xl p-4 min-w-48">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">More</h3>
            {[...secondaryNavigationItems, ...tertiaryNavigationItems].map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 text-left ${
                  activeTab === item.path
                    ? 'bg-amber-400/20 text-amber-400'
                    : 'text-slate-400 hover:text-amber-400 hover:bg-amber-400/10'
                }`}
              >
                <div className="text-lg">{item.icon}</div>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
