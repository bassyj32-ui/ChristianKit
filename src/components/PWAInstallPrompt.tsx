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

    // TEMPORARY: Force show for testing
    setTimeout(() => {
      if (!isInstalled && !isDismissed) {
        setShowInstallPrompt(true);
      }
    }, 1000);

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
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)]/20 via-[var(--accent-secondary)]/10 to-[var(--spiritual-purple)]/20 rounded-3xl blur-xl transition-all duration-700 ${
        isHovered ? 'opacity-100 scale-110' : 'opacity-60 scale-100'
      }`} />
      
      {/* Main card */}
      <div className="relative bg-[var(--glass-light)] backdrop-blur-2xl border border-[var(--glass-border)] rounded-3xl p-6 mb-6 mx-2 sm:mx-0 transition-all duration-500 hover:scale-[1.02] hover:bg-[var(--glass-medium)] hover:border-[var(--accent-primary)]/30">
        
        {/* Header with spiritual accent */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {/* Animated icon container */}
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--spiritual-purple)]/20 border border-[var(--accent-primary)]/30 flex items-center justify-center backdrop-blur-sm">
                <div className="w-8 h-8 text-[var(--accent-primary)] animate-pulse">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              
              {/* Floating cross icon */}
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-[var(--spiritual-rose)] to-[var(--spiritual-purple)] rounded-full flex items-center justify-center border-2 border-[var(--bg-primary)]">
                <span className="text-xs text-white font-bold">✝</span>
              </div>
            </div>
            
            {/* Text content */}
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center space-x-2">
                <span>📱</span>
                <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--spiritual-purple)] bg-clip-text text-transparent">
                  Install ChristianKit
                </span>
              </h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-xs">
                Transform your device into a spiritual sanctuary with quick access to prayer, Bible study, and daily devotionals
              </p>
            </div>
          </div>
          
          {/* Benefits badge */}
          <div className="hidden sm:flex flex-col items-center space-y-2">
            <div className="bg-gradient-to-r from-[var(--accent-primary)]/20 to-[var(--spiritual-purple)]/20 backdrop-blur-sm px-4 py-2 rounded-2xl border border-[var(--accent-primary)]/30">
              <span className="text-xs font-bold text-[var(--accent-primary)]">✨ Offline Access</span>
            </div>
            <div className="bg-gradient-to-r from-[var(--spiritual-green)]/20 to-[var(--spiritual-blue)]/20 backdrop-blur-sm px-4 py-2 rounded-2xl border border-[var(--spiritual-green)]/30">
              <span className="text-xs font-bold text-[var(--spiritual-green)]">🚀 Faster Loading</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDismiss}
              className="px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] bg-[var(--glass-medium)] border border-[var(--glass-border)] rounded-2xl hover:bg-[var(--glass-dark)] hover:border-[var(--glass-border)] transition-all duration-300 hover:scale-105"
            >
              Maybe Later
            </button>
            
            <button
              onClick={handleInstallClick}
              className="relative px-6 py-3 text-sm font-bold text-[var(--text-inverse)] bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:from-[var(--accent-secondary)] hover:to-[var(--accent-primary)] group/install"
            >
              <span className="relative z-10 flex items-center space-x-2">
                <span>📲</span>
                <span>Install App</span>
              </span>
              
              {/* Button glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-2xl blur opacity-0 group-hover/install:opacity-100 transition-opacity duration-300" />
            </button>
          </div>
          
          {/* Feature highlights */}
          <div className="hidden lg:flex items-center space-x-4 text-xs text-[var(--text-tertiary)]">
            <div className="flex items-center space-x-1">
              <span>🔒</span>
              <span>Secure</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>⚡</span>
              <span>Fast</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>💾</span>
              <span>Offline</span>
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-30" />
      </div>
    </div>
  );
};

// Export the main component
export default PWAInstallPrompt;

// Keep backward compatibility
export const NotificationPermissionBanner = PWAInstallPrompt;
