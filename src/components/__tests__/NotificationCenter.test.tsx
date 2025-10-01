import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders, testUser } from '../../test/test-utils'
import NotificationCenter from '../NotificationCenter'

// Mock the Supabase auth provider
vi.mock('../../components/SupabaseAuthProvider', async (importOriginal) => {
  const actual = await importOriginal() as any
  return {
    ...actual,
    useSupabaseAuth: () => ({
      user: testUser,
    }),
  }
})

// Mock notification service functions
vi.mock('../../services/notificationService', () => ({
  getUserNotifications: vi.fn().mockResolvedValue([]),
  markNotificationAsRead: vi.fn().mockResolvedValue(true),
  markAllNotificationsAsRead: vi.fn().mockResolvedValue(true),
  getUnreadNotificationCount: vi.fn().mockResolvedValue(0),
  subscribeToNotifications: vi.fn().mockReturnValue(() => {}),
  subscribeToPushNotifications: vi.fn().mockResolvedValue(true),
}))

describe('NotificationCenter', () => {
  it('renders notification bell when user is authenticated', () => {
    renderWithProviders(<NotificationCenter />)

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('shows notification bell icon', () => {
    renderWithProviders(<NotificationCenter />)

    // Check that the notification bell SVG is present
    const bellIcon = document.querySelector('svg')
    expect(bellIcon).toBeInTheDocument()
  })
})
