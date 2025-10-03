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
      id: 'prayer',
      label: 'Prayer',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      ),
      path: 'prayer'
    },
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
      id: 'community',
      label: 'Community',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ),
      path: 'community'
    },
    {
      id: 'games',
      label: 'Games',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9 21 9.67 21 11s-.67 1.5-1.5 1.5z"/>
        </svg>
      ),
      path: 'runner'
    },
    {
      id: 'more',
      label: 'More',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
      ),
      path: 'more'
    }
  ]

  // Simplified More menu items - only Profile, Pricing, Settings
  const moreMenuItems = [
    {
      id: 'profile',
      label: 'Profile',
      path: 'profile'
    },
    {
      id: 'subscription',
      label: 'Pricing',
      path: 'subscription'
    },
    {
      id: 'settings',
      label: 'Settings',
      path: 'settings'
    }
  ]

  const handleNavigation = (tab: string) => {
    if (tab === 'more') {
      setIsExpanded(!isExpanded)
    } else {
      onNavigate(tab)
      setIsExpanded(false)
    }
  }

  return (
    <>
      {/* Mobile Navigation Bar - Bottom */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-black/90 backdrop-blur-xl border-t border-amber-400/20">
        <div className="flex items-center justify-around py-2 px-2">
          {primaryNavigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all duration-300 ${
                (activeTab === item.path) || (item.id === 'more' && isExpanded)
                  ? 'bg-amber-400/20 text-amber-400 scale-110'
                  : 'text-slate-400 hover:text-amber-400 hover:bg-amber-400/10'
              }`}
            >
              <div className="mb-0.5">{item.icon}</div>
              <span className="text-xs font-medium leading-tight">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modern Mobile Drawer */}
      {isExpanded && (
        <div className="lg:hidden fixed inset-0 z-[102] bg-black/50 backdrop-blur-sm" onClick={() => setIsExpanded(false)}>
          <div 
            className="absolute bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-amber-400/20 rounded-t-3xl p-6 transform transition-transform duration-300 ease-out translate-y-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="w-12 h-1 bg-slate-600 rounded-full mx-auto mb-8"></div>
            
            {/* Simple Menu Items */}
            <div className="space-y-2">
              {moreMenuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                    activeTab === item.path
                      ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                      : 'text-slate-300 hover:text-amber-400 hover:bg-amber-400/10 border border-transparent hover:border-amber-400/20'
                  }`}
                >
                  <span className="text-base font-medium">{item.label}</span>
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
            
            {/* Close button */}
            <button
              onClick={() => setIsExpanded(false)}
              className="w-full mt-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors duration-300 font-medium"
            >
              Close Menu
            </button>
          </div>
        </div>
      )}

      {/* Desktop Top App Bar Navigation */}
      <div className="hidden lg:block fixed top-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-xl border-b border-amber-400/20">
        <div className="flex items-center justify-between px-4 py-2">
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
            {/* Main Navigation - Prayer, Home, Community, Games */}
            <div className="flex items-center space-x-1">
              {primaryNavigationItems.filter(item => item.id !== 'more').map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-lg transition-all duration-300 ${
                    activeTab === item.path
                      ? 'bg-amber-400/20 text-amber-400'
                      : 'text-slate-400 hover:text-amber-400 hover:bg-amber-400/10'
                  }`}
                >
                  <div className="text-sm">{item.icon}</div>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Direct Access Items - Pricing, Profile, Settings */}
            <div className="flex items-center space-x-1 ml-4 pl-4 border-l border-slate-700">
              <button
                onClick={() => handleNavigation('subscription')}
                className={`flex items-center space-x-1 px-2 py-1 rounded-lg transition-all duration-300 ${
                  activeTab === 'subscription'
                    ? 'bg-amber-400/20 text-amber-400'
                    : 'text-slate-400 hover:text-amber-400 hover:bg-amber-400/10'
                }`}
              >
                <div className="text-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z"/>
                  </svg>
                </div>
                <span className="text-sm font-medium">Pricing</span>
              </button>
              
              <button
                onClick={() => handleNavigation('profile')}
                className={`flex items-center space-x-1 px-2 py-1 rounded-lg transition-all duration-300 ${
                  activeTab === 'profile'
                    ? 'bg-amber-400/20 text-amber-400'
                    : 'text-slate-400 hover:text-amber-400 hover:bg-amber-400/10'
                }`}
              >
                <div className="text-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <span className="text-sm font-medium">Profile</span>
              </button>
              
              <button
                onClick={() => handleNavigation('settings')}
                className={`flex items-center space-x-1 px-2 py-1 rounded-lg transition-all duration-300 ${
                  activeTab === 'settings'
                    ? 'bg-amber-400/20 text-amber-400'
                    : 'text-slate-400 hover:text-amber-400 hover:bg-amber-400/10'
                }`}
              >
                <div className="text-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                  </svg>
                </div>
                <span className="text-sm font-medium">Settings</span>
              </button>
            </div>

            {/* More Button - HIDDEN */}
            {/* <button
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
            </button> */}

            {/* User Info - HIDDEN */}
            {/* {user && (
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
            )} */}
          </div>
        </div>
      </div>

    </>
  )
}
