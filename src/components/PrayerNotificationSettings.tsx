import React, { useState, useEffect } from 'react';
import { dailyPrayerNotificationService, type PrayerReminder } from '../services/dailyPrayerNotificationService';
import { pushNotificationService } from '../services/pushNotificationService';
import { useSupabaseAuth } from './SupabaseAuthProvider';

interface PrayerNotificationSettingsProps {
  onClose?: () => void;
}

export const PrayerNotificationSettings: React.FC<PrayerNotificationSettingsProps> = ({ onClose }) => {
  const { user } = useSupabaseAuth();
  const [reminders, setReminders] = useState<PrayerReminder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<{
    isSupported: boolean;
    permission: NotificationPermission;
    isSubscribed: boolean;
  }>({
    isSupported: false,
    permission: 'default',
    isSubscribed: false
  });
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: '',
    message: '',
    time: '08:00',
    days: [1, 2, 3, 4, 5, 6, 0] as number[],
    verse: '',
    verseReference: ''
  });

  useEffect(() => {
    if (user?.id) {
      loadReminders();
      checkNotificationStatus();
    }
  }, [user?.id]);

  const loadReminders = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const userReminders = await dailyPrayerNotificationService.getUserReminders(user.id);
      setReminders(userReminders);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkNotificationStatus = async () => {
    try {
      const status = await pushNotificationService.getSubscriptionStatus();
      setNotificationStatus(status);
    } catch (error) {
      console.error('Error checking notification status:', error);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      const success = await dailyPrayerNotificationService.requestPermissionsAndSetup();
      if (success) {
        await checkNotificationStatus();
        await loadReminders();
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    }
  };

  const handleToggleReminder = async (reminderId: string, isActive: boolean) => {
    try {
      await dailyPrayerNotificationService.updateReminder(reminderId, { is_active: !isActive });
      await loadReminders();
    } catch (error) {
      console.error('Error toggling reminder:', error);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (confirm('Are you sure you want to delete this prayer reminder?')) {
      try {
        await dailyPrayerNotificationService.deleteReminder(reminderId);
        await loadReminders();
      } catch (error) {
        console.error('Error deleting reminder:', error);
      }
    }
  };

  const handleAddReminder = async () => {
    if (!user?.id || !newReminder.title || !newReminder.message) return;

    try {
      await dailyPrayerNotificationService.createCustomReminder(
        user.id,
        newReminder.title,
        newReminder.message,
        newReminder.time,
        newReminder.days,
        newReminder.verse || undefined,
        newReminder.verseReference || undefined
      );

      // Reset form
      setNewReminder({
        title: '',
        message: '',
        time: '08:00',
        days: [1, 2, 3, 4, 5, 6, 0],
        verse: '',
        verseReference: ''
      });
      setShowAddReminder(false);
      await loadReminders();
    } catch (error) {
      console.error('Error adding reminder:', error);
    }
  };

  const handleDayToggle = (day: number) => {
    setNewReminder(prev => ({
      ...prev,
      days: prev.days.includes(day) 
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day].sort()
    }));
  };

  const getDayName = (day: number) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[day];
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'morning': return '🌅';
      case 'midday': return '☀️';
      case 'evening': return '🌙';
      default: return '🔔';
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400">Please sign in to manage prayer notifications</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Prayer Notifications</h1>
          <p className="text-slate-300">Set up daily reminders to connect with God</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
          >
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Notification Status */}
      <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Notification Status</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${notificationStatus.isSupported ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-slate-300">
                  Browser Support: {notificationStatus.isSupported ? 'Supported' : 'Not Supported'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${notificationStatus.permission === 'granted' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-sm text-slate-300">
                  Permission: {notificationStatus.permission}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${notificationStatus.isSubscribed ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <span className="text-sm text-slate-300">
                  Subscribed: {notificationStatus.isSubscribed ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
          
          {notificationStatus.permission !== 'granted' && (
            <button
              onClick={handleEnableNotifications}
              className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-6 py-3 rounded-xl font-semibold hover:from-amber-500 hover:to-yellow-400 transition-all duration-300"
            >
              Enable Notifications
            </button>
          )}
        </div>
      </div>

      {/* Prayer Reminders List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Your Prayer Reminders</h2>
          <button
            onClick={() => setShowAddReminder(true)}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all duration-300 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Reminder</span>
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-300">Loading reminders...</p>
          </div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🙏</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Prayer Reminders Yet</h3>
            <p className="text-slate-400 mb-6">Create your first reminder to start building a consistent prayer habit</p>
            <button
              onClick={() => setShowAddReminder(true)}
              className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-6 py-3 rounded-xl font-semibold hover:from-amber-500 hover:to-yellow-400 transition-all duration-300"
            >
              Create First Reminder
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`bg-white/5 rounded-2xl p-6 border transition-all duration-300 ${
                  reminder.is_active ? 'border-yellow-400/30' : 'border-white/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="text-2xl">
                      {getNotificationTypeIcon(reminder.notification_type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{reminder.title}</h3>
                      <p className="text-slate-300 mb-3">{reminder.message}</p>
                      
                      {reminder.verse && (
                        <div className="bg-white/5 rounded-lg p-3 mb-3">
                          <p className="text-sm text-slate-200 italic">"{reminder.verse}"</p>
                          {reminder.verse_reference && (
                            <p className="text-xs text-yellow-400 mt-1">- {reminder.verse_reference}</p>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-slate-400">
                        <span>⏰ {formatTime(reminder.time)}</span>
                        <span>📅 {reminder.days.map(day => getDayName(day)).join(', ')}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          reminder.is_active 
                            ? 'bg-green-500/20 text-green-300' 
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {reminder.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleReminder(reminder.id, reminder.is_active)}
                      className={`p-2 rounded-lg transition-colors duration-200 ${
                        reminder.is_active
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                      }`}
                      title={reminder.is_active ? 'Disable reminder' : 'Enable reminder'}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={reminder.is_active ? "M15 17h5l-5 5v-5zM4 19h5v-5H4v5zM13 3L4 14h7v7l9-11h-7z" : "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 12M6 6l12 12"} />
                      </svg>
                    </button>
                    
                    {reminder.notification_type === 'custom' && (
                      <button
                        onClick={() => handleDeleteReminder(reminder.id)}
                        className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors duration-200"
                        title="Delete reminder"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Reminder Modal */}
      {showAddReminder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-2xl max-w-md w-full border border-white/10">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Add Prayer Reminder</h3>
                <button
                  onClick={() => setShowAddReminder(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Morning Prayer"
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Message</label>
                  <textarea
                    value={newReminder.message}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="e.g., Start your day with God's presence"
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 resize-none"
                    rows={3}
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Time</label>
                  <input
                    type="time"
                    value={newReminder.time}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                  />
                </div>

                {/* Days */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Days</label>
                  <div className="flex space-x-2">
                    {[0, 1, 2, 3, 4, 5, 6].map(day => (
                      <button
                        key={day}
                        onClick={() => handleDayToggle(day)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 ${
                          newReminder.days.includes(day)
                            ? 'bg-yellow-400 text-black'
                            : 'bg-white/10 text-slate-400 hover:bg-white/20'
                        }`}
                      >
                        {getDayName(day)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Verse */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Bible Verse (Optional)</label>
                  <textarea
                    value={newReminder.verse}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, verse: e.target.value }))}
                    placeholder="Enter a Bible verse for inspiration"
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 resize-none"
                    rows={2}
                  />
                </div>

                {/* Verse Reference */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Verse Reference (Optional)</label>
                  <input
                    type="text"
                    value={newReminder.verseReference}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, verseReference: e.target.value }))}
                    placeholder="e.g., John 3:16"
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-white/10">
                <button
                  onClick={() => setShowAddReminder(false)}
                  className="px-6 py-2 text-slate-400 hover:text-white transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddReminder}
                  disabled={!newReminder.title || !newReminder.message}
                  className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-6 py-2 rounded-lg font-semibold hover:from-amber-500 hover:to-yellow-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Reminder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrayerNotificationSettings;

