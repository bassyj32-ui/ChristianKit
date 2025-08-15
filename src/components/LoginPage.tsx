import React from 'react';
import { useAuth } from './AuthProvider';
import { SimpleLogo } from './SimpleLogo';

export const LoginPage: React.FC = () => {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-6">
        {/* Logo and Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <SimpleLogo size="xl" />
          </div>
          <p className="text-gray-400 text-lg">
            Transform your spiritual journey today
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-neutral-900/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-neutral-800">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-100 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-400">
              Sign in to continue your spiritual journey
            </p>
          </div>

          {/* Google Sign In Button */}
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full bg-white text-gray-900 rounded-xl py-4 px-6 font-bold text-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg mb-6 flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>

          {/* Features Preview */}
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 rounded-xl p-4 border border-green-500/30">
              <h3 className="text-lg font-bold text-green-400 mb-3">✨ What you'll get:</h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Prayer timer with guided sessions</li>
                <li>• Daily Bible verses and meditation</li>
                <li>• Habit tracking and progress analytics</li>
                <li>• Community of fellow believers</li>
                <li>• Personalized spiritual journey</li>
              </ul>
            </div>
          </div>

          {/* Terms */}
          <p className="text-xs text-gray-500 text-center mt-6">
            By signing in, you agree to our{' '}
            <a href="#" className="text-green-400 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-green-400 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};
