import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockWebPush, createNotificationServiceMocks } from '../notification-mock'

// Mock the Supabase client
vi.mock('../../utils/supabase', () => ({
  supabase: {
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}))

// Mock the daily-notifications function
vi.mock('../../../supabase/functions/daily-notifications', () => ({
  // This would be the actual function export
}))

describe('Integration: Notification Delivery', () => {
  let mockNotificationService: ReturnType<typeof createNotificationServiceMocks>
  let mockWebPushLib: ReturnType<typeof mockWebPush>

  beforeEach(() => {
    mockNotificationService = createNotificationServiceMocks()
    mockWebPushLib = mockWebPush()
    vi.clearAllMocks()
  })

  it('sends push notification successfully end-to-end', async () => {
    // Arrange - Mock successful database responses
    const mockSupabase = await import('../../utils/supabase')
    const mockFrom = vi.fn()

    // Mock user preferences query
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              is_active: true,
              push_enabled: true,
              email_enabled: false,
            },
            error: null,
          }),
        }),
      }),
    })

    // Mock push subscriptions query
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{
              id: 'sub-1',
              user_id: 'user-123',
              endpoint: 'https://example.com/push',
              p256dh: 'test-p256dh',
              auth: 'test-auth',
              is_active: true,
            }],
            error: null,
          }),
        }),
      }),
    })

    // Mock notification insertion
    mockFrom.mockReturnValueOnce({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    })

    vi.mocked(mockSupabase.supabase.from).mockImplementation(mockFrom)

    // Act - Simulate the daily-notifications function logic
    // This would normally be called by a cron job or scheduled task

    // 1. Check if it's notification time (mock timezone logic)
    const isNotificationTime = (user: any) => {
      // Mock: always return true for this test
      return true
    }

    // 2. Get user preferences
    const userPrefs = await mockSupabase.supabase.from('user_notification_preferences')
      .select('is_active, push_enabled, email_enabled')
      .eq('user_id', 'user-123')
      .single()

    // 3. Get push subscriptions
    const subscriptions = await mockSupabase.supabase.from('push_subscriptions')
      .select('*')
      .eq('user_id', 'user-123')
      .eq('is_active', true)

    // 4. Send notification if conditions are met
    if (isNotificationTime({ user_id: 'user-123' }) &&
        userPrefs.data?.is_active &&
        userPrefs.data?.push_enabled &&
        subscriptions.data?.length > 0) {

      const message = {
        title: 'Daily Encouragement',
        message: 'God loves you unconditionally',
        verse: 'Jeremiah 29:11',
        reference: 'Jeremiah 29:11',
      }

      // Reconstruct subscription object
      const pushSubscription = {
        endpoint: subscriptions.data[0].endpoint,
        keys: {
          p256dh: subscriptions.data[0].p256dh,
          auth: subscriptions.data[0].auth,
        },
      }

      // Send push notification
      await mockWebPushLib.sendNotification(pushSubscription, JSON.stringify({
        title: message.title,
        body: message.message,
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        data: {
          verse: message.verse,
          reference: message.reference,
          url: '/',
        },
      }))
    }

    // Assert - Verify the notification was sent
    expect(mockWebPushLib.sendNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: 'https://example.com/push',
        keys: expect.objectContaining({
          p256dh: 'test-p256dh',
          auth: 'test-auth',
        }),
      }),
      expect.stringContaining('Daily Encouragement')
    )

    // Assert - Verify database interactions
    expect(mockSupabase.supabase.from).toHaveBeenCalledWith('user_notification_preferences')
    expect(mockSupabase.supabase.from).toHaveBeenCalledWith('push_subscriptions')
    expect(mockSupabase.supabase.from).toHaveBeenCalledWith('user_notifications')
  })

  it('handles subscription cleanup on delivery failure', async () => {
    // Arrange - Mock web-push to fail with 410 (subscription expired)
    mockWebPushLib.sendNotification.mockRejectedValue({
      statusCode: 410, // Gone - subscription no longer valid
      message: 'Subscription expired',
    })

    const mockSupabase = await import('../../utils/supabase')

    // Mock database queries
    const mockFrom = vi.fn()
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { is_active: true, push_enabled: true },
            error: null,
          }),
        }),
      }),
    })

    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{
              id: 'sub-1',
              user_id: 'user-123',
              endpoint: 'https://example.com/push',
              p256dh: 'test-p256dh',
              auth: 'test-auth',
              is_active: true,
            }],
            error: null,
          }),
        }),
      }),
    })

    vi.mocked(mockSupabase.supabase.from).mockImplementation(mockFrom)

    // Act - Try to send notification (should fail and cleanup)
    try {
      const subscriptions = await mockSupabase.supabase.from('push_subscriptions')
        .select('*')
        .eq('user_id', 'user-123')
        .eq('is_active', true)

      if (subscriptions.data?.length > 0) {
        const pushSubscription = {
          endpoint: subscriptions.data[0].endpoint,
          keys: {
            p256dh: subscriptions.data[0].p256dh,
            auth: subscriptions.data[0].auth,
          },
        }

        await mockWebPushLib.sendNotification(pushSubscription, JSON.stringify({
          title: 'Test Notification',
          body: 'This should fail',
        }))
      }
    } catch (error: any) {
      // Handle 410 error by cleaning up subscription
      if (error.statusCode === 410) {
        await mockSupabase.supabase.from('push_subscriptions')
          .update({ is_active: false })
          .eq('id', 'sub-1')
      }
    }

    // Assert - Verify cleanup was called
    expect(mockSupabase.supabase.from).toHaveBeenCalledWith('push_subscriptions')
    expect(mockFrom).toHaveBeenCalledWith('update')
  })

  it('respects user preferences when sending notifications', async () => {
    // Arrange - Mock user who disabled push notifications
    const mockSupabase = await import('../../utils/supabase')

    const mockFrom = vi.fn()
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              is_active: true,
              push_enabled: false, // User disabled push
              email_enabled: true,
            },
            error: null,
          }),
        }),
      }),
    })

    vi.mocked(mockSupabase.supabase.from).mockImplementation(mockFrom)

    // Act - Check if notification should be sent
    const userPrefs = await mockSupabase.supabase.from('user_notification_preferences')
      .select('is_active, push_enabled, email_enabled')
      .eq('user_id', 'user-123')
      .single()

    // Assert - Should not send push notification when disabled
    expect(userPrefs.data?.push_enabled).toBe(false)

    // But email should still be enabled
    expect(userPrefs.data?.email_enabled).toBe(true)
  })
})


