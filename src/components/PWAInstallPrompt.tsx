import React, { useState, useEffect } from 'react'
import { OsmoCard, OsmoButton, OsmoGradientText } from '../theme/osmoComponents'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
        return true
      }
      return false
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    // Check if already installed
    if (!checkIfInstalled()) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.addEventListener('appinstalled', handleAppInstalled)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }

    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
  }

  // Don't show if already installed or no prompt available
  if (isInstalled || !showInstallPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top-4 duration-500">
      {/* Tab-like design with glowing border and pulsing effect */}
      <div className="bg-[var(--bg-primary)] border-b-2 border-amber-400 shadow-amber-400/50 backdrop-blur-xl animate-pulse">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            {/* Left side - App icon and info */}
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              {/* Actual ChristianKit app icon */}
              <div className="relative flex-shrink-0">
                <img 
                  src="/icon-192x192.png" 
                  alt="ChristianKit" 
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg shadow-sm"
                />
                {/* Install indicator badge with glow */}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center border-2 border-[var(--bg-primary)] shadow-lg shadow-emerald-400/50">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                </div>
              </div>
              
              {/* App info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)] truncate">
                    ChristianKit
                  </h3>
                  <span className="text-xs text-amber-400 font-medium bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">
                    Install
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] truncate">
                  <span className="text-amber-400 font-medium">Spiritual sanctuary</span> • Offline access • Notifications
                </p>
              </div>
            </div>
            
            {/* Right side - Enhanced action buttons */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent hover:bg-[var(--glass-light)] rounded-lg transition-all duration-200 font-medium"
              >
                <span className="hidden sm:inline">Not now</span>
                <span className="sm:hidden">Later</span>
              </button>
              
              {/* Larger, more prominent install button */}
              <button
                onClick={handleInstallClick}
                disabled={!deferredPrompt}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-gray-600 disabled:to-gray-700 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-xl hover:shadow-2xl disabled:cursor-not-allowed flex items-center gap-2 border border-amber-400/30 hover:scale-105 transform"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                <span className="hidden sm:inline">Install App</span>
                <span className="sm:hidden">Install</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
