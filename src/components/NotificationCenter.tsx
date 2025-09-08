import React, { useState, useEffect, useRef } from 'react';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  subscribeToNotifications,
  type Notification 
} from '../services/notificationService';
import { useSupabaseAuth } from './SupabaseAuthProvider';

interface NotificationCenterProps {
  onUserSelect?: (userId: string) => void;
  onPostSelect?: (postId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  onUserSelect,
  onPostSelect
}) => {
  const { user } = useSupabaseAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      loadUnreadCount();
      
      // Subscribe to real-time notifications
      const unsubscribe = subscribeToNotifications(user.id, (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(newNotification.title, {
            body: newNotification.message,
            icon: '/christiankit-icon.svg'
          });
        }
      });

      return unsubscribe;
    }
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const data = await getUserNotifications(user.id, 20);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    if (!user?.id) return;

    try {
      const count = await getUnreadNotificationCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    // Handle navigation based on notification type
    if (notification.data?.actor_id && onUserSelect) {
      onUserSelect(notification.data.actor_id);
    } else if (notification.data?.post_id && onPostSelect) {
      onPostSelect(notification.data.post_id);
    }

    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;

    try {
      await markAllNotificationsAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'follow':
        return (
          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        );
      case 'amen':
        return (
          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
            <span className="text-sm">🙏</span>
          </div>
        );
      case 'love':
        return (
          <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
            <span className="text-sm">❤️</span>
          </div>
        );
      case 'prayer':
        return (
          <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
            <span className="text-sm">💬</span>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h5v-5H4v5zM13 3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        );
    }
  };

  if (!user) return null;

  return (
    <div ref={dropdownRef} className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          requestNotificationPermission();
        }}
        className="relative p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
      >
        <svg className="w-6 h-6 text-slate-300 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h5v-5H4v5zM13 3L4 14h7v7l9-11h-7z" />
        </svg>
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </div>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="text-lg font-bold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-slate-400 text-sm">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h5v-5H4v5zM13 3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-slate-300 font-medium">No notifications yet</p>
                <p className="text-slate-400 text-sm mt-1">We'll notify you when something happens</p>
              </div>
            ) : (
              <div className="py-2">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-4 hover:bg-white/5 transition-colors duration-200 border-l-2 ${
                      notification.read ? 'border-transparent' : 'border-yellow-400'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      {getNotificationIcon(notification.type)}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`text-sm font-semibold ${notification.read ? 'text-slate-300' : 'text-white'}`}>
                            {notification.title}
                          </h4>
                          <span className="text-xs text-slate-500">
                            {formatTimestamp(notification.created_at)}
                          </span>
                        </div>
                        
                        <p className={`text-sm ${notification.read ? 'text-slate-400' : 'text-slate-300'}`}>
                          {notification.message}
                        </p>

                        {/* Actor Avatar */}
                        {notification.data?.actor_avatar && (
                          <div className="flex items-center space-x-2 mt-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-black text-xs">
                              {notification.data.actor_avatar}
                            </div>
                            <span className="text-xs text-slate-500">
                              {notification.data.actor_name}
                            </span>
                          </div>
                        )}

                        {/* Post Preview */}
                        {notification.data?.post_content && (
                          <div className="mt-2 p-2 bg-white/5 rounded-lg">
                            <p className="text-xs text-slate-400 italic">
                              "{notification.data.post_content}..."
                            </p>
                          </div>
                        )}

                        {/* Unread Indicator */}
                        {!notification.read && (
                          <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-white/10 text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;

