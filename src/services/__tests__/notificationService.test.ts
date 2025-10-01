import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createNotification, getUserNotifications, markNotificationAsRead } from '../notificationService'

// Mock the supabase module before importing the service
vi.mock('../../utils/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('NotificationService', () => {
  let supabase: any

  beforeAll(async () => {
    const supabaseModule = await import('../../utils/supabase')
    supabase = supabaseModule.supabase
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createNotification', () => {
    it('creates a notification successfully', async () => {
      // Arrange - Mock successful insert
      const mockInsertChain = {
        insert: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      vi.mocked(supabase.from).mockReturnValue(mockInsertChain as any)

      // Act
      const result = await createNotification(
        'user-123',
        'follow',
        'New Follower',
        'Someone followed you'
      )

      // Assert
      expect(result).toBe(true)
      expect(supabase.from).toHaveBeenCalledWith('notifications')
    })

    it('handles database errors gracefully', async () => {
      // Arrange - Mock error response (simulate the actual service behavior)
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          error: { message: 'Database error' }
        }),
      } as any)

      // Act
      const result = await createNotification(
        'user-123',
        'follow',
        'New Follower',
        'Someone followed you'
      )

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('getUserNotifications', () => {
    it('fetches user notifications successfully', async () => {
      // Arrange
      const mockNotifications = [
        {
          id: 'notif-1',
          user_id: 'user-123',
          type: 'follow',
          title: 'New Follower',
          message: 'Someone followed you',
          read: false,
          created_at: new Date().toISOString(),
        },
      ]

      const mockQueryChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: mockNotifications,
          error: null,
        }),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQueryChain as any)

      // Act
      const result = await getUserNotifications('user-123', 20)

      // Assert
      expect(result).toEqual(mockNotifications)
      expect(supabase.from).toHaveBeenCalledWith('notifications')
    })

    it('returns empty array on error', async () => {
      // Arrange - Mock error response
      const mockQueryChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQueryChain as any)

      // Act
      const result = await getUserNotifications('user-123', 20)

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('markNotificationAsRead', () => {
    it('marks notification as read successfully', async () => {
      // Arrange - Mock successful update
      const mockUpdateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      vi.mocked(supabase.from).mockReturnValue(mockUpdateChain as any)

      // Act
      const result = await markNotificationAsRead('notification-123')

      // Assert
      expect(result).toBe(true)
      expect(supabase.from).toHaveBeenCalledWith('notifications')
    })

    it('handles update errors', async () => {
      // Arrange - Mock error response
      const mockUpdateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: { message: 'Update failed' },
        }),
      }
      vi.mocked(supabase.from).mockReturnValue(mockUpdateChain as any)

      // Act
      const result = await markNotificationAsRead('notification-123')

      // Assert
      expect(result).toBe(false)
    })
  })
})
