import React, { useState, useEffect } from 'react'

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

  // Always show for testing/debugging purposes
  // if (isInstalled || !showInstallPrompt || !deferredPrompt) {
  //   return null
  // }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-lg">
      
      <div className="relative max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Enhanced app info */}
          <div className="flex items-center space-x-3">
            {/* Icon container */}
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-sm text-white">📱</span>
              </div>
              
              {/* Floating cross badge */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center border border-white shadow-sm">
                <span className="text-xs text-white font-bold">✝</span>
              </div>
            </div>
            
            {/* Text content */}
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Install ChristianKit
              </h3>
              <p className="hidden md:block text-xs text-gray-500">
                Transform your device into a spiritual sanctuary
              </p>
            </div>
          </div>
          
          {/* Right side - Action buttons with app theme */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 bg-transparent hover:bg-gray-100 rounded-md font-medium transition-colors"
            >
              Not now
            </button>
            
            <button
              onClick={handleInstallClick}
              disabled={!deferredPrompt}
              className="px-4 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-md hover:bg-orange-600 disabled:bg-gray-400 transition-colors shadow-sm hover:shadow-md disabled:cursor-not-allowed"
            >
              {deferredPrompt ? 'Install' : 'Not Available'}
            </button>
          </div>
        </div>
      </div>
      

    </div>
  )
}
