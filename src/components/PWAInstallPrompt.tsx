import React, { useState, useEffect } from 'react';

interface PWAInstallPromptProps {
  onInstall?: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  onInstall
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if PWA is already installed
    const checkInstallation = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          (window.navigator as any).standalone === true) {
        setIsInstalled(true);
      }
    };

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      onInstall?.();
    };

    // Check initial state
    checkInstallation();

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if user has previously dismissed the banner
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }

    // Show immediately when app loads (no delay)
    if (!isInstalled && !isDismissed) {
      setShowInstallPrompt(true);
      // Add slight delay for smooth animation
      setTimeout(() => setIsVisible(true), 100);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onInstall, isInstalled, isDismissed]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // If no deferred prompt, show a message
      alert('PWA installation prompt not available. This usually means the app is already installed or not eligible for installation.');
      return;
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('✅ PWA installation accepted');
        setIsInstalled(true);
        setShowInstallPrompt(false);
        onInstall?.();
      } else {
        console.log('❌ PWA installation declined');
      }

      // Clear the deferred prompt
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error during PWA installation:', error);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  // Don't show if PWA is already installed or user dismissed
  if (isInstalled || isDismissed || !showInstallPrompt) {
    return null;
  }

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-[9999] transform transition-all duration-700 ease-out ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background overlay for better visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/95 to-blue-800/95 backdrop-blur-xl" />
      
      {/* Animated border glow */}
      <div className={`absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 rounded-b-3xl transition-all duration-700 ${
        isHovered ? 'opacity-100' : 'opacity-60'
      }`} style={{ filter: 'blur(20px)' }} />
      
      {/* Main banner container */}
      <div className="relative bg-gradient-to-r from-blue-900/90 via-blue-800/90 to-blue-900/90 backdrop-blur-2xl border-2 border-amber-400/50 rounded-b-3xl p-4 sm:p-6 mx-2 sm:mx-4 shadow-2xl">
        
        {/* Animated header with pulsing effect */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Animated icon container with pulsing effect */}
            <div className="relative animate-pulse">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-400/30 to-yellow-500/30 border-2 border-amber-400/50 flex items-center justify-center backdrop-blur-sm shadow-lg">
                <div className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400 animate-bounce">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              
              {/* Floating cross icon with bounce animation */}
              <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center border-2 border-blue-900 animate-bounce">
                <span className="text-xs text-white font-bold">✝</span>
              </div>
            </div>
            
            {/* Text content with gradient text */}
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
                <span className="animate-pulse">📱</span>
                <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 bg-clip-text text-transparent">
                  Install ChristianKit
                </span>
              </h3>
              <p className="text-blue-100 text-sm leading-relaxed max-w-xs">
                Transform your device into a spiritual sanctuary with quick access to prayer, Bible study, and daily devotionals
              </p>
            </div>
          </div>
          
          {/* Benefits badges with hover effects */}
          <div className="hidden sm:flex flex-col items-center space-y-2">
            <div className="bg-gradient-to-r from-amber-400/20 to-yellow-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-amber-400/50 hover:scale-105 transition-transform duration-300">
              <span className="text-xs font-bold text-amber-400">✨ Offline Access</span>
            </div>
            <div className="bg-gradient-to-r from-green-400/20 to-blue-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-green-400/50 hover:scale-105 transition-transform duration-300">
              <span className="text-xs font-bold text-green-400">🚀 Faster Loading</span>
            </div>
          </div>
        </div>

        {/* Action buttons with enhanced styling */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDismiss}
              className="px-4 py-2.5 text-sm font-medium text-blue-200 bg-blue-800/50 border border-blue-600/50 rounded-xl hover:bg-blue-700/50 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              Maybe Later
            </button>
            
            <button
              onClick={handleInstallClick}
              className="relative px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-amber-400 to-yellow-500 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:from-yellow-500 hover:to-amber-400 group/install animate-pulse"
            >
              <span className="relative z-10 flex items-center space-x-2">
                <span className="animate-bounce">📲</span>
                <span>Install App</span>
              </span>
              
              {/* Enhanced button glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-xl blur opacity-0 group-hover/install:opacity-100 transition-opacity duration-300" />
            </button>
          </div>
          
          {/* Feature highlights with icons */}
          <div className="hidden lg:flex items-center space-x-4 text-xs text-blue-200">
            <div className="flex items-center space-x-1 hover:scale-110 transition-transform duration-300">
              <span>🔒</span>
              <span>Secure</span>
            </div>
            <div className="flex items-center space-x-1 hover:scale-110 transition-transform duration-300">
              <span>⚡</span>
              <span>Fast</span>
            </div>
            <div className="flex items-center space-x-1 hover:scale-110 transition-transform duration-300">
              <span>💾</span>
              <span>Offline</span>
            </div>
          </div>
        </div>

        {/* Debug info for troubleshooting */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-blue-900/30 rounded-lg border border-blue-600/50">
            <details className="text-xs text-blue-200">
              <summary className="cursor-pointer hover:text-blue-100">🔧 Debug Info</summary>
              <div className="mt-2 space-y-1">
                <div>Service Worker: {'serviceWorker' in navigator ? '✅' : '❌'}</div>
                <div>HTTPS: {window.location.protocol === 'https:' ? '✅' : '❌'}</div>
                <div>Manifest: {document.querySelector('link[rel="manifest"]') ? '✅' : '❌'}</div>
                <div>Icons: {document.querySelector('link[rel="icon"]') ? '✅' : '❌'}</div>
                <div>Standalone: {window.matchMedia('(display-mode: standalone)').matches ? '✅' : '❌'}</div>
                <div>Deferred Prompt: {deferredPrompt ? '✅' : '❌'}</div>
              </div>
            </details>
          </div>
        )}

        {/* Animated bottom accent line */}
        <div className="absolute bottom-0 left-6 right-6 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-60 animate-pulse" />
        
        {/* Attention-grabbing pulse ring */}
        <div className="absolute inset-0 rounded-b-3xl border-2 border-amber-400/30 animate-ping" />
      </div>
    </div>
  );
};

// Export the main component
export default PWAInstallPrompt;

// Keep backward compatibility
export const NotificationPermissionBanner = PWAInstallPrompt;
