// Notification Manager - Controls aggressive user re-engagement
import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
// import { emailService } from '../services/EmailService';
import { notificationScheduler } from '../services/NotificationScheduler';

interface NotificationManagerProps {
  user: User | null;
}

interface NotificationSettings {
  emailEnabled: boolean;
  pushEnabled: boolean;
  urgencyLevel: 'gentle' | 'moderate' | 'aggressive' | 'ruthless';
  frequency: 'hourly' | 'daily' | 'constant';
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({ user }) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    emailEnabled: true,
    pushEnabled: false,
    urgencyLevel: 'aggressive',
    frequency: 'constant'
  });
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    initializeNotifications();
    startUserTracking();
  }, [user]);

  /**
   * Initialize notification system
   */
  const initializeNotifications = async () => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }

    // Register service worker
    // Temporarily disabled service worker registration to fix MIME type issues
    // if ('serviceWorker' in navigator) {
    //   try {
    //     await navigator.serviceWorker.register('/sw.js');
    //     console.log('Service worker registered');
    //   } catch (error) {
    //     console.error('Service worker registration failed:', error);
    //   }
    // }
  };

  /**
   * Request notification permissions with spiritual motivation
   */
  const requestPermissions = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return;
    }

    // Show compelling permission request
    const granted = await showPermissionDialog();
    
    if (granted) {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        setSettings(prev => ({ ...prev, pushEnabled: true }));
        showWelcomeNotification();
      }
    }
  };

  /**
   * Show custom permission dialog with spiritual context
   */
  const showPermissionDialog = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center;">
          <div style="background: linear-gradient(135deg, #fbbf24, #f59e0b); border-radius: 20px; padding: 40px; max-width: 500px; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.5);">
            <div style="font-size: 64px; margin-bottom: 20px;">🔔</div>
            <h2 style="margin: 0 0 20px 0; color: white; font-size: 28px;">Enable Divine Notifications</h2>
            <p style="color: rgba(255,255,255,0.9); margin-bottom: 30px; font-size: 16px; line-height: 1.5;">
              Allow ChristianKit to send you spiritual reminders that will keep you connected to God throughout your day. 
              Our notifications will help you build unbreakable prayer habits and maintain your spiritual discipline.
            </p>
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; margin: 20px 0;">
              <h3 style="color: white; margin-top: 0;">What you'll receive:</h3>
              <ul style="text-align: left; color: rgba(255,255,255,0.9); margin: 0;">
                <li>🙏 Daily prayer reminders</li>
                <li>📖 Bible reading notifications</li>
                <li>🔥 Streak protection alerts</li>
                <li>✨ Spiritual growth encouragement</li>
                <li>⚡ Emergency prayer calls (when needed)</li>
              </ul>
            </div>
            <div style="display: flex; gap: 15px; margin-top: 30px;">
              <button id="allow-notifications" style="flex: 1; background: white; color: #f59e0b; border: none; padding: 15px 20px; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 16px;">✝️ Yes, Guide My Spirit</button>
              <button id="deny-notifications" style="flex: 1; background: rgba(0,0,0,0.3); color: white; border: none; padding: 15px 20px; border-radius: 10px; cursor: pointer;">Maybe Later</button>
            </div>
            <p style="font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 20px;">You can adjust notification intensity in settings</p>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      modal.querySelector('#allow-notifications')?.addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(true);
      });
      
      modal.querySelector('#deny-notifications')?.addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(false);
      });
    });
  };

  /**
   * Show welcome notification after permission granted
   */
  const showWelcomeNotification = () => {
    new Notification('🎉 Divine Connection Established!', {
      body: 'You\'re now connected to receive spiritual guidance. Your first prayer reminder is coming soon!',
      icon: '/icon-192x192.png',
      requireInteraction: true
    });
  };

  /**
   * Start tracking user activity for notifications
   */
  const startUserTracking = () => {
    if (!user) return;

    // Track last prayer time
    const lastPrayerTime = localStorage.getItem('lastPrayerTime');
    const now = new Date();
    
    if (!lastPrayerTime) {
      // New user - start gentle campaign
      startGentleCampaign();
    } else {
      const lastPrayer = new Date(lastPrayerTime);
      const hoursSinceLastPrayer = (now.getTime() - lastPrayer.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastPrayer >= 1) {
        // User is inactive - start aggressive campaign
        startAggressiveCampaign(hoursSinceLastPrayer);
      }
    }

    // Set up periodic checks
    setInterval(() => {
      checkUserActivity();
    }, 30 * 60 * 1000); // Check every 30 minutes
  };

  /**
   * Start gentle campaign for new users
   */
  const startGentleCampaign = () => {
    if (!user) return;

    const userActivity = {
      userId: user.id,
      email: user.email || '',
      lastPrayerTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      currentStreak: 0,
      notificationCount: 0
    };

    notificationScheduler.startRestlessNotifications(userActivity);
  };

  /**
   * Start aggressive campaign for inactive users
   */
  const startAggressiveCampaign = (hoursSinceLastPrayer: number) => {
    if (!user) return;

    const userActivity = {
      userId: user.id,
      email: user.email || '',
      lastPrayerTime: new Date(Date.now() - hoursSinceLastPrayer * 60 * 60 * 1000),
      currentStreak: parseInt(localStorage.getItem('prayerStreak') || '0'),
      notificationCount: parseInt(localStorage.getItem('notificationCount') || '0')
    };

    notificationScheduler.startRestlessNotifications(userActivity);
  };

  /**
   * Check user activity and escalate if needed
   */
  const checkUserActivity = () => {
    const lastActivity = localStorage.getItem('lastActivityTime');
    const lastPrayer = localStorage.getItem('lastPrayerTime');
    const now = new Date();

    if (lastActivity) {
      const lastActive = new Date(lastActivity);
      const minutesSinceActivity = (now.getTime() - lastActive.getTime()) / (1000 * 60);

      // If user hasn't been active for 30+ minutes, send immediate reminder
      if (minutesSinceActivity >= 30 && settings.pushEnabled) {
        sendImmediateReminder();
      }
    }

    if (lastPrayer) {
      const lastPrayerTime = new Date(lastPrayer);
      const hoursSinceLastPrayer = (now.getTime() - lastPrayerTime.getTime()) / (1000 * 60 * 60);

      // Escalate urgency based on time since last prayer
      if (hoursSinceLastPrayer >= 24) {
        sendCriticalReminder();
      } else if (hoursSinceLastPrayer >= 6) {
        sendUrgentReminder();
      }
    }
  };

  /**
   * Send immediate reminder notification
   */
  const sendImmediateReminder = () => {
    if (permissionStatus === 'granted') {
      new Notification('👀 We Miss You!', {
        body: 'You\'ve been away for a while. God is waiting for you to return.',
        icon: '/icon-192x192.png',
        vibrate: [200, 100, 200],
        actions: [
          { action: 'pray', title: '🙏 Pray Now' },
          { action: 'later', title: '⏰ 5 min' }
        ]
      });
    }
  };

  /**
   * Send urgent reminder
   */
  const sendUrgentReminder = () => {
    if (permissionStatus === 'granted') {
      new Notification('💝 We miss you!', {
        body: 'Ready to continue your prayer journey? We\'re here when you are.',
        icon: '/icon-192x192.png',
        requireInteraction: false,
        vibrate: [200],
        actions: [
          { action: 'gentle-pray', title: '🙏 Pray Now' }
        ]
      });
    }
  };

  /**
   * Send critical reminder
   */
  const sendCriticalReminder = () => {
    if (permissionStatus === 'granted') {
      new Notification('🌟 Welcome back!', {
        body: 'We\'d love to see you return to your prayer journey. No pressure, just love.',
        icon: '/icon-192x192.png',
        requireInteraction: false,
        vibrate: [200],
        actions: [
          { action: 'welcome-back', title: '🙏 Continue Journey' }
        ]
      });
    }
  };

  /**
   * Update user activity timestamp
   */
  const updateActivity = () => {
    localStorage.setItem('lastActivityTime', new Date().toISOString());
  };

  // Track user activity
  useEffect(() => {
    const handleActivity = () => updateActivity();
    
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, []);

  return (
    <div className="notification-manager">
      {/* Notification Permission Button */}
      {permissionStatus !== 'granted' && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={requestPermissions}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 animate-pulse"
          >
            <span>🔔</span>
            <span className="font-semibold">Enable Prayer Reminders</span>
          </button>
        </div>
      )}

      {/* Notification Status Indicator */}
      {permissionStatus === 'granted' && (
        <div className="fixed top-4 right-4 z-40">
          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs flex items-center space-x-1">
            <span>🔔</span>
            <span>Divine Notifications Active</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationManager;
