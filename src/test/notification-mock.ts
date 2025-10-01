import { vi } from 'vitest'

// Mock data for notifications
export const mockNotifications = [
  {
    id: 'notification-1',
    user_id: 'user-1',
    type: 'follow' as const,
    title: 'New Follower',
    message: 'John Doe started following you',
    read: false,
    created_at: new Date().toISOString(),
    data: {
      actor_id: 'user-2',
      actor_name: 'John Doe',
      actor_avatar: 'avatar-url',
    },
  },
  {
    id: 'notification-2',
    user_id: 'user-1',
    type: 'amen' as const,
    title: 'Amen Received',
    message: 'Jane Smith said Amen to your prayer',
    read: true,
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    data: {
      actor_id: 'user-3',
      actor_name: 'Jane Smith',
      post_id: 'post-1',
      post_content: 'Thank you Lord for...',
    },
  },
]

// Mock push subscription data
export const mockPushSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
  keys: {
    p256dh: 'test-p256dh-key',
    auth: 'test-auth-key',
  },
}

// Mock notification preferences
export const mockNotificationPreferences = {
  user_id: 'user-1',
  preferred_time: '09:00',
  timezone: 'America/New_York',
  push_enabled: true,
  email_enabled: true,
  is_active: true,
}

// Mock user profile
export const mockUserProfile = {
  id: 'user-1',
  email: 'test@example.com',
  display_name: 'Test User',
  experience_level: 'beginner',
}

// Helper to mock the RealNotificationService
export const mockRealNotificationService = () => {
  const mockService = {
    initialize: vi.fn().mockResolvedValue(undefined),
    getUserPreferences: vi.fn().mockResolvedValue(mockNotificationPreferences),
    saveUserPreferences: vi.fn().mockResolvedValue(true),
    enableNotifications: vi.fn().mockResolvedValue(true),
    disableNotifications: vi.fn().mockResolvedValue(true),
    getStatus: vi.fn().mockResolvedValue({
      isSupported: true,
      permission: 'granted',
      isActive: true,
      preferences: mockNotificationPreferences,
    }),
    sendTestNotification: vi.fn().mockResolvedValue(true),
    requestPushPermission: vi.fn().mockResolvedValue(true),
  }

  vi.mock('../services/RealNotificationService', () => ({
    realNotificationService: mockService,
  }))

  return mockService
}

// Helper to create notification service mocks
export const createNotificationServiceMocks = () => ({
  createNotification: vi.fn().mockResolvedValue(true),
  getUserNotifications: vi.fn().mockResolvedValue(mockNotifications),
  markNotificationAsRead: vi.fn().mockResolvedValue(true),
  markAllNotificationsAsRead: vi.fn().mockResolvedValue(true),
  getUnreadNotificationCount: vi.fn().mockResolvedValue(1),
  subscribeToNotifications: vi.fn().mockReturnValue(() => {}),
  subscribeToPushNotifications: vi.fn().mockResolvedValue(true),
})

// Helper to mock the notificationService
export const mockNotificationService = () => {
  const mockService = createNotificationServiceMocks()

  vi.mock('../services/notificationService', () => mockService)

  return mockService
}

// Helper to mock web-push library
export const mockWebPush = () => {
  const mockWebPushLib = {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue(undefined),
  }

  vi.mock('https://esm.sh/web-push@3.6.7', () => mockWebPushLib)

  return mockWebPushLib
}
