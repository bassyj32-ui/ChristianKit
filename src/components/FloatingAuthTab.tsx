import React, { useState } from 'react';
import { useSupabaseAuth } from './SupabaseAuthProvider';

interface FloatingAuthTabProps {
  className?: string;
  position?: 'left' | 'right';
}

export const FloatingAuthTab: React.FC<FloatingAuthTabProps> = ({ className = '', position = 'left' }) => {
  const { user, signInWithGoogle } = useSupabaseAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google sign-in error:', error);
      alert('Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show anything if user is signed in
  if (user) {
    return null;
  }

  return (
    <div className={`fixed z-50 ${position === 'right' ? 'right-4' : 'left-4'} ${className || 'top-4'}`}>
      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="flex items-center space-x-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-md border border-amber-500/30 rounded-full px-4 py-2 text-amber-100 hover:from-amber-500/30 hover:to-orange-500/30 transition-all duration-300 shadow-lg hover:shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </div>
        <span className="text-sm font-medium">
          {isLoading ? 'Signing in...' : 'Sign in'}
        </span>
        {isLoading && (
          <div className="w-4 h-4 border-2 border-amber-100/30 border-t-amber-100 rounded-full animate-spin"></div>
        )}
      </button>
    </div>
  );
};
