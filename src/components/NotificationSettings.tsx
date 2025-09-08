import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { pushNotificationService } from '../services/pushNotificationService';
import { NotificationAPI } from '../api/notificationApi';

interface NotificationPreferences {
  email_enabled: boolean;
  push_enabled: boolean;
  prayer_reminders: boolean;
  community_updates: boolean;
  daily_motivation: boolean;
  weekly_progress: boolean;
  bible_study: boolean;
  preferred_time: string;
  reminder_intensity: 'gentle' | 'motivating' | 'aggressive';
  timezone: string;
}

export const NotificationSettings: React.FC = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_enabled: true,
    push_enabled: false,
    prayer_reminders: true,
    community_updates: true,
    daily_motivation: true,
    weekly_progress: false,
    bible_study: true,
    preferred_time: '09:00',
    reminder_intensity: 'gentle',
    timezone: 'UTC'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadNotificationPreferences();
      checkNotificationStatus();
    }
  }, [user]);

  const loadNotificationPreferences = async () => {
    try {
      if (user) {
        const prefs = await NotificationAPI.getUserPreferences(user.id);
        if (prefs) {
          setPreferences(prefs);
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const checkNotificationStatus = async () => {
    try {
      const status = await pushNotificationService.getSubscriptionStatus();
      setSubscriptionStatus(status);
      setPermissionStatus(status.permission);
      setFcmToken(status.fcmToken);
      
      if (status.permission === 'granted') {
        setPreferences(prev => ({ ...prev, push_enabled: true }));
      }
    } catch (error) {
      console.error('Error checking notification status:', error);
    }
  };

  const handlePermissionRequest = async () => {
    setIsLoading(true);
    setMessage('Requesting notification permission...');
    
    try {
      const token = await pushNotificationService.requestPermissionAndToken();
      
      if (token) {
        setFcmToken(token);
        setPreferences(prev => ({ ...prev, push_enabled: true }));
        setPermissionStatus('granted');
        setMessage('✅ Push notifications enabled successfully!');
        
        // Save preferences
        await savePreferences({ ...preferences, push_enabled: true });
        
        // Refresh status
        await checkNotificationStatus();
      } else {
        setMessage('❌ Failed to enable push notifications');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      setMessage('❌ Error enabling push notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceChange = async (key: keyof NotificationPreferences, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    await savePreferences(newPreferences);
  };

  const savePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      if (user) {
        const success = await NotificationAPI.updateUserPreferences(user.id, newPreferences);
        if (success) {
          console.log('Preferences saved successfully');
        }
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const handleTestNotification = async () => {
    setIsLoading(true);
    setMessage('Sending test notification...');
    
    try {
      const success = await pushNotificationService.sendTestNotification();
      if (success) {
        setMessage('✅ Test notification sent successfully!');
      } else {
        setMessage('❌ Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      setMessage('❌ Error sending test notification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestPushNotification = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setMessage('Sending push notification...');
    
    try {
      const success = await NotificationAPI.sendToUser(user.id, {
        title: '🧪 Test Push Notification',
        body: 'This is a test push notification from ChristianKit!',
        data: { type: 'test', timestamp: new Date().toISOString() }
      });
      
      if (success) {
        setMessage('✅ Push notification sent successfully!');
      } else {
        setMessage('❌ Failed to send push notification');
      }
    } catch (error) {
      console.error('Error sending push notification:', error);
      setMessage('❌ Error sending push notification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    setMessage('Unsubscribing from push notifications...');
    
    try {
      const success = await pushNotificationService.unsubscribeFromPushNotifications();
      if (success) {
        setPreferences(prev => ({ ...prev, push_enabled: false }));
        setFcmToken(null);
        setPermissionStatus('denied');
        setMessage('✅ Unsubscribed from push notifications');
        
        await savePreferences({ ...preferences, push_enabled: false });
        await checkNotificationStatus();
      } else {
        setMessage('❌ Failed to unsubscribe');
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      setMessage('❌ Error unsubscribing');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'granted': return 'text-green-600';
      case 'denied': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'granted': return '✅';
      case 'denied': return '❌';
      default: return '⚠️';
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Please sign in to manage notification settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🔔 Notification Settings</h1>
        <p className="text-gray-600">Manage how and when you receive notifications from ChristianKit</p>
      </div>

      {/* Status Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">📱 Notification Status</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Browser Permission:</span>
              <span className={`font-medium ${getStatusColor(permissionStatus)}`}>
                {getStatusIcon(permissionStatus)} {permissionStatus}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Push Enabled:</span>
              <span className={`font-medium ${preferences.push_enabled ? 'text-green-600' : 'text-red-600'}`}>
                {preferences.push_enabled ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-700">FCM Token:</span>
              <span className="font-medium text-gray-900">
                {fcmToken ? '✅ Active' : '❌ Not Set'}
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Service Worker:</span>
              <span className={`font-medium ${subscriptionStatus?.isSupported ? 'text-green-600' : 'text-red-600'}`}>
                {subscriptionStatus?.isSupported ? '✅ Supported' : '❌ Not Supported'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-700">VAPID Key:</span>
              <span className={`font-medium ${subscriptionStatus?.hasVapidKey ? 'text-green-600' : 'text-red-600'}`}>
                {subscriptionStatus?.hasVapidKey ? '✅ Set' : '❌ Missing'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Subscription:</span>
              <span className={`font-medium ${subscriptionStatus?.isSubscribed ? 'text-green-600' : 'text-red-600'}`}>
                {subscriptionStatus?.isSubscribed ? '✅ Active' : '❌ Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          {permissionStatus !== 'granted' && (
            <button
              onClick={handlePermissionRequest}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '🔄 Enabling...' : '🔔 Enable Push Notifications'}
            </button>
          )}
          
          {permissionStatus === 'granted' && (
            <>
              <button
                onClick={handleTestNotification}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '🔄 Sending...' : '🧪 Send Test Notification'}
              </button>
              
              <button
                onClick={handleTestPushNotification}
                disabled={isLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '🔄 Sending...' : '📱 Send Test Push'}
              </button>
              
              <button
                onClick={handleUnsubscribe}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '🔄 Unsubscribing...' : '🚫 Unsubscribe'}
              </button>
            </>
          )}
        </div>

        {/* Status Message */}
        {message && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">{message}</p>
          </div>
        )}
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">⚙️ Notification Preferences</h2>
        
        <div className="space-y-6">
          {/* Notification Types */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Notification Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={preferences.prayer_reminders}
                  onChange={(e) => handlePreferenceChange('prayer_reminders', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">🙏 Prayer Reminders</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={preferences.bible_study}
                  onChange={(e) => handlePreferenceChange('bible_study', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">📖 Bible Study</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={preferences.daily_motivation}
                  onChange={(e) => handlePreferenceChange('daily_motivation', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">✨ Daily Motivation</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={preferences.community_updates}
                  onChange={(e) => handlePreferenceChange('community_updates', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">👥 Community Updates</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={preferences.weekly_progress}
                  onChange={(e) => handlePreferenceChange('weekly_progress', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">📊 Weekly Progress</span>
              </label>
            </div>
          </div>

          {/* Timing Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Timing & Intensity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Time
                </label>
                <input
                  type="time"
                  value={preferences.preferred_time}
                  onChange={(e) => handlePreferenceChange('preferred_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reminder Intensity
                </label>
                <select
                  value={preferences.reminder_intensity}
                  onChange={(e) => handlePreferenceChange('reminder_intensity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="gentle">Gentle</option>
                  <option value="motivating">Motivating</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Delivery Methods */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Delivery Methods</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={preferences.email_enabled}
                  onChange={(e) => handlePreferenceChange('email_enabled', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">📧 Email Notifications</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={preferences.push_enabled}
                  onChange={(e) => handlePreferenceChange('push_enabled', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">📱 Push Notifications</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🔧 Technical Information</h2>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">FCM Token:</span>
            <span className="font-mono text-gray-900 break-all">
              {fcmToken ? `${fcmToken.substring(0, 20)}...` : 'Not available'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Service Worker:</span>
            <span className="text-gray-900">
              {subscriptionStatus?.isSupported ? 'Supported' : 'Not Supported'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Push Manager:</span>
            <span className="text-gray-900">
              {subscriptionStatus?.isSubscribed ? 'Subscribed' : 'Not Subscribed'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">VAPID Key:</span>
            <span className="text-gray-900">
              {subscriptionStatus?.hasVapidKey ? 'Configured' : 'Missing'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};












