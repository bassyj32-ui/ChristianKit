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
    <div className="bg-[var(--color-neutral-800)]/5 backdrop-blur-xl border border-[var(--color-neutral-700)]/10 rounded-2xl p-3 sm:p-4 mb-4 mx-2 sm:mx-0 hover:bg-[var(--color-neutral-800)]/8 transition-all duration-300">
      <div className="flex items-center justify-between">
        {/* Left side: Icon and text */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--color-primary-500)]/20 flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-primary-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm sm:text-base font-medium text-[var(--color-neutral-50)]">
              📱 Install ChristianKit
            </h3>
            <p className="text-xs text-[var(--color-neutral-400)]">
              Get quick access from your home screen
            </p>
          </div>
        </div>

        {/* Right side: Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDismiss}
            className="px-2 py-1.5 text-xs font-medium text-[var(--color-neutral-400)] bg-[var(--color-neutral-800)]/20 border border-[var(--color-neutral-700)]/20 rounded-lg hover:bg-[var(--color-neutral-800)]/30 transition-all duration-200"
          >
            Dismiss
          </button>
          
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-primary-600)] border border-[var(--color-primary-500)] rounded-lg hover:from-[var(--color-primary-600)] hover:to-[var(--color-primary-700)] transition-all duration-200 transform hover:scale-105"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
};

// Export the main component
export default PWAInstallPrompt;

// Keep backward compatibility
export const NotificationPermissionBanner = PWAInstallPrompt;
