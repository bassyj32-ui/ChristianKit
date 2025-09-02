// Notification Manager - Controls aggressive user re-engagement
import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { EmailService } from '../services/EmailService';
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
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    // Load saved settings from localStorage
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.warn('Failed to parse saved notification settings:', error);
      }
    }
    
    // Check if user has completed questionnaire
    const userPlan = localStorage.getItem('userPlan');
    if (userPlan) {
      try {
        const plan = JSON.parse(userPlan);
        if (plan.notificationPreferences) {
          return {
            emailEnabled: plan.notificationPreferences.emailEnabled,
            pushEnabled: plan.notificationPreferences.pushEnabled,
            urgencyLevel: plan.notificationPreferences.urgencyLevel,
            frequency: plan.notificationPreferences.frequency
          };
        }
      } catch (error) {
        console.warn('Failed to parse user plan:', error);
      }
    }
    
    // Default settings
    return {
      emailEnabled: true,
      pushEnabled: false,
      urgencyLevel: 'aggressive',
      frequency: 'constant'
    };
  });
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Register service worker for push notifications
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ Service Worker registered for notifications:', registration);
          } catch (error) {
            console.warn('⚠️ Service Worker registration failed:', error);
          }
        }

        // Check if notifications are supported
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          setPermissionStatus(permission);
          
          if (permission === 'granted') {
            console.log('Notification permission granted');
            // Start daily scheduling
            startDailyScheduling();
          }
        }
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    initializeNotifications();
  }, []);

  // Start daily notification scheduling
  const startDailyScheduling = () => {
    if (!user) return;

    // Get preferred time from user plan or use default 9 AM
    const userPlan = localStorage.getItem('userPlan');
    let preferredTime = '9:00 AM';
    
    if (userPlan) {
      try {
        const plan = JSON.parse(userPlan);
        if (plan.notificationPreferences?.preferredTime) {
          preferredTime = plan.notificationPreferences.preferredTime;
        }
      } catch (error) {
        console.warn('Failed to parse user plan for preferred time:', error);
      }
    }

    // Schedule daily prayer reminder at preferred time
    const scheduleDailyReminder = () => {
      const now = new Date();
      const reminderTime = new Date(now);
      
      // Parse preferred time (e.g., "9:00 AM" -> 9:00)
      const timeMatch = preferredTime.match(/(\d+):(\d+)\s*(AM|PM)/);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const period = timeMatch[3];
        
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        reminderTime.setHours(hours, minutes, 0, 0);
      } else {
        // Fallback to 9 AM
        reminderTime.setHours(9, 0, 0, 0);
      }
      
      // If it's already past the preferred time today, schedule for tomorrow
      if (now > reminderTime) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }
      
      const timeUntilReminder = reminderTime.getTime() - now.getTime();
      
      setTimeout(() => {
        showDailyReminder();
        // Schedule next day's reminder
        setInterval(showDailyReminder, 24 * 60 * 60 * 1000);
      }, timeUntilReminder);
      
      console.log(`⏰ Daily reminder scheduled for ${reminderTime.toLocaleString()} (preferred: ${preferredTime})`);
    };

    scheduleDailyReminder();
  };

  // Show daily prayer reminder
  const showDailyReminder = () => {
    if (permissionStatus === 'granted') {
      new Notification('🙏 Daily Prayer Time', {
        body: 'Time to connect with God and start your spiritual journey',
        icon: '/icon-192x192.png',
        tag: 'daily-reminder',
        requireInteraction: true,
        actions: [
          { action: 'pray', title: '🙏 Start Prayer' },
          { action: 'bible', title: '📖 Read Bible' }
        ]
      });
    }
  };

  // Save notification settings
  const saveSettings = (newSettings: Partial<NotificationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    // Save to localStorage
    localStorage.setItem('notificationSettings', JSON.stringify(updatedSettings));
    
    // Apply settings
    if (newSettings.pushEnabled !== undefined) {
      if (newSettings.pushEnabled && permissionStatus === 'granted') {
        startDailyScheduling();
      }
    }
    
    console.log('✅ Notification settings saved:', updatedSettings);
  };

  // Test email service
  const testEmailService = async () => {
    if (!user?.email) {
      alert('Please sign in to test email functionality');
      return;
    }

    try {
      const EmailService = await import('../services/EmailService');
      const emailService = EmailService.default.getInstance();
      
      const testSchedule = {
        userId: user.id,
        email: user.email,
        lastActivity: new Date(),
        daysSinceLastPrayer: 1,
        consecutiveMissedDays: 1,
        streak: 5
      };

      const result = await emailService.sendDailyReEngagementEmail(testSchedule);
      
      if (result) {
        alert('✅ Test email sent successfully! Check your inbox.');
      } else {
        alert('❌ Failed to send test email. Check console for details.');
      }
    } catch (error) {
      console.error('Test email error:', error);
      alert('❌ Error testing email service. Check console for details.');
    }
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

  // Close settings panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSettings) {
        const target = event.target as Element;
        if (!target.closest('.notification-manager')) {
          setShowSettings(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettings]);

  return (
    <div className="notification-manager">
      {/* Notification Permission Button */}
      {permissionStatus !== 'granted' && (
        <div className="fixed bottom-20 right-4 z-50 lg:bottom-4">
          <button
            onClick={requestPermissions}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 animate-pulse text-sm sm:text-base"
          >
            <span>🔔</span>
            <span className="font-semibold hidden sm:inline">Enable Prayer Reminders</span>
            <span className="font-semibold sm:hidden">Enable</span>
          </button>
        </div>
      )}

      {/* Minimal Notification Toggle */}
      {permissionStatus === 'granted' && (
        <div className="fixed bottom-20 right-4 z-50 lg:bottom-4">
          {/* Settings Toggle Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-full p-3 shadow-lg hover:bg-white/20 transition-all duration-300"
            title="Notification Settings"
          >
            <span className="text-xl">🔔</span>
          </button>

          {/* Settings Panel - Only show when toggled */}
          {showSettings && (
            <div className="absolute bottom-16 right-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl min-w-[280px]">
              <div className="text-center mb-4">
                <div className="text-2xl mb-2">🔔</div>
                <h3 className="text-white font-semibold">Notifications Active</h3>
                <p className="text-white/70 text-sm">Manage your spiritual reminders</p>
              </div>
              
              {/* Settings Panel */}
              <div className="space-y-3">
                {/* Push Notifications */}
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm">Push Notifications</span>
                  <button
                    onClick={() => saveSettings({ pushEnabled: !settings.pushEnabled })}
                    className={`w-12 h-6 rounded-full transition-colors duration-300 ${
                      settings.pushEnabled 
                        ? 'bg-green-500' 
                        : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 transform ${
                      settings.pushEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                
                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm">Email Notifications</span>
                  <button
                    onClick={() => saveSettings({ emailEnabled: !settings.emailEnabled })}
                    className={`w-12 h-6 rounded-full transition-colors duration-300 ${
                      settings.emailEnabled 
                        ? 'bg-green-500' 
                        : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 transform ${
                      settings.emailEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                
                {/* Urgency Level */}
                <div className="space-y-2">
                  <span className="text-white text-sm">Urgency Level</span>
                  <select
                    value={settings.urgencyLevel}
                    onChange={(e) => saveSettings({ urgencyLevel: e.target.value as any })}
                    className="w-full bg-white/20 text-white rounded-lg px-3 py-2 text-sm border border-white/30 focus:outline-none focus:border-amber-400"
                  >
                    <option value="gentle">Gentle</option>
                    <option value="moderate">Moderate</option>
                    <option value="aggressive">Aggressive</option>
                    <option value="ruthless">Ruthless</option>
                  </select>
                </div>
                
                {/* Frequency */}
                <div className="space-y-2">
                  <span className="text-white text-sm">Frequency</span>
                  <select
                    value={settings.frequency}
                    onChange={(e) => saveSettings({ frequency: e.target.value as any })}
                    className="w-full bg-white/20 text-white rounded-lg px-3 py-2 text-sm border border-white/30 focus:outline-none focus:border-amber-400"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="constant">Constant</option>
                  </select>
                </div>
              </div>
              
              {/* Test Buttons - Development Only */}
              {import.meta.env.DEV && (
                <div className="space-y-2">
                  <button
                    onClick={showDailyReminder}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
                  >
                    🧪 Test Notification
                  </button>
                  
                  <button
                    onClick={testEmailService}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-300"
                  >
                    📧 Test Email
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationManager;
