import React, { useState, useEffect } from 'react';
import { realNotificationService } from '../services/RealNotificationService';
import { useSupabaseAuth } from './SupabaseAuthProvider';

export const CleanNotificationTest: React.FC = () => {
  const { user } = useSupabaseAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      loadStatus();
    }
  }, [user]);

  const loadStatus = async () => {
    try {
      const notificationStatus = await realNotificationService.getStatus();
      setStatus(notificationStatus);
    } catch (error) {
      console.error('Error loading status:', error);
    }
  };

  const handleInitialize = async () => {
    setIsLoading(true);
    setMessage('Initializing notification system...');
    
    try {
      await realNotificationService.initialize();
      await loadStatus();
      setMessage('✅ Notification system initialized!');
    } catch (error) {
      console.error('Error initializing:', error);
      setMessage('❌ Error: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setIsLoading(true);
    setMessage('Sending test notification...');
    
    try {
      const success = await realNotificationService.sendTestNotification();
      
      if (success) {
        setMessage('✅ Test notification sent successfully!');
      } else {
        setMessage('❌ Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      setMessage('❌ Error: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Please sign in to test notifications</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h3 className="text-xl font-bold text-gray-800 mb-4">🔔 Clean Notification Test</h3>
      
      {/* Status Display */}
      {status && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-gray-700 mb-2">Status:</h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${status.isSupported ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>Supported: {status.isSupported ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${status.permission === 'granted' ? 'bg-green-500' : status.permission === 'denied' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
              <span>Permission: {status.permission}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${status.isActive ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <span>Active: {status.isActive ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {(!status || status.permission !== 'granted') && (
          <button
            onClick={handleInitialize}
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? '🔄 Initializing...' : '🔔 Enable Notifications'}
          </button>
        )}
        
        {status && status.permission === 'granted' && (
          <button
            onClick={handleTestNotification}
            disabled={isLoading}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? '🔄 Sending...' : '🧪 Send Test Notification'}
          </button>
        )}
      </div>

      {/* Message Display */}
      {message && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">{message}</p>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 text-xs text-gray-500">
        <p>• Uses RealNotificationService only</p>
        <p>• Connects to Supabase Edge Functions</p>
        <p>• Works with PWA and web browsers</p>
      </div>
    </div>
  );
};
