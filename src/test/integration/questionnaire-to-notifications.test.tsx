import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, testUser } from '../test-utils'
import { UserQuestionnaire } from '../../components/UserQuestionnaire'
import { createNotificationServiceMocks } from '../notification-mock'
import { realNotificationService } from '../../services/RealNotificationService'

// Mock Supabase auth
vi.mock('../../components/SupabaseAuthProvider', async (importOriginal) => {
  const actual = await importOriginal() as any
  return {
    ...actual,
    useSupabaseAuth: () => ({
      user: testUser,
    }),
  }
})

// Mock notification service
vi.mock('../../services/RealNotificationService', () => {
  return {
    realNotificationService: {
      initialize: vi.fn().mockResolvedValue(true),
      subscribe: vi.fn().mockResolvedValue(true),
      sendNotification: vi.fn().mockResolvedValue(true),
      getSubscription: vi.fn().mockResolvedValue(null),
      isSupported: vi.fn().mockReturnValue(true),
    },
  }
})

describe.skip('Integration: Questionnaire to Notifications', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
  })

  it('completes questionnaire and sets up notifications', async () => {
    // Arrange
    const onComplete = vi.fn()
    renderWithProviders(<UserQuestionnaire onComplete={onComplete} />)

    // Act - Step 1: Select experience level
    const beginnerButton = screen.getByText('🌱 Beginner')
    await user.click(beginnerButton)

    // Click next
    const nextButton = screen.getByText('Next →')
    await user.click(nextButton)

    // Step 2: Select time commitment
    const fiveMinButton = screen.getByText('5 minutes')
    await user.click(fiveMinButton)

    // Click next
    await user.click(nextButton)

    // Step 3: Configure notifications (push enabled by default)
    const completeButton = screen.getByText('Complete Setup ✨')
    await user.click(completeButton)

    // Assert - Check that notification service was called
    await waitFor(() => {
      expect(realNotificationService.subscribe).toHaveBeenCalled()
    })

    // Assert - Check that onComplete was called with user plan
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        experienceLevel: 'beginner',
        dailyTimeCommitment: '5min',
        notificationPreferences: expect.objectContaining({
          pushEnabled: true,
          emailEnabled: true,
          preferredTime: '9:00 AM',
        }),
      })
    )
  })

  it('respects user notification preferences', async () => {
    // Arrange
    const onComplete = vi.fn()
    renderWithProviders(<UserQuestionnaire onComplete={onComplete} />)

    // Act - Complete questionnaire with different preferences
    await user.click(screen.getByText('🌿 Growing')) // Intermediate level
    await user.click(screen.getByText('Next →'))
    await user.click(screen.getByText('10 minutes')) // More time
    await user.click(screen.getByText('Next →'))

    // Disable email notifications
    const emailToggle = screen.getByText('Email Reminders').closest('div')?.querySelector('button')
    if (emailToggle) {
      await user.click(emailToggle) // This should disable email
    }

    // Change time to 8 PM
    const timeSelect = screen.getByRole('combobox')
    await user.selectOptions(timeSelect, '8:00 PM')

    await user.click(screen.getByText('Complete Setup ✨'))

    // Assert - Check preferences were set correctly
    await waitForTL(() => {
      expect(mockNotificationService.enableNotifications).toHaveBeenCalledWith(
        expect.objectContaining({
          preferredTime: '8:00 PM',
          emailEnabled: false, // Should be disabled
          pushEnabled: true, // Should still be enabled
          experienceLevel: 'intermediate',
          isActive: true,
        })
      )
    })
  })

  it('handles notification setup failures gracefully', async () => {
    // Arrange - Mock notification service to fail
    const { realNotificationService } = await import('../../services/RealNotificationService')
    vi.mocked(realNotificationService.subscribe).mockRejectedValue(new Error('VAPID keys not configured'))

    const onComplete = vi.fn()
    renderWithProviders(<UserQuestionnaire onComplete={onComplete} />)

    // Act - Complete questionnaire
    await user.click(screen.getByText('🌱 Beginner'))
    await user.click(screen.getByText('Next →'))
    await user.click(screen.getByText('5 minutes'))
    await user.click(screen.getByText('Next →'))
    await user.click(screen.getByText('Complete Setup ✨'))

    // Assert - onComplete should still be called even if notifications fail
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled()
    })

    // The notification service should have been called but failed
    expect(realNotificationService.subscribe).toHaveBeenCalled()
  })
})
