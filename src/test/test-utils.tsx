import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { SupabaseAuthProvider } from '../components/SupabaseAuthProvider'

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
  withRouter?: boolean
}

const AllTheProviders = ({ children, withRouter = true }: { children: React.ReactNode; withRouter?: boolean }) => {
  const content = withRouter ? (
    <BrowserRouter>
      <SupabaseAuthProvider>
        {children}
      </SupabaseAuthProvider>
    </BrowserRouter>
  ) : (
    <SupabaseAuthProvider>
      {children}
    </SupabaseAuthProvider>
  )

  return content
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialEntries = ['/'], withRouter = true, ...renderOptions } = options

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders withRouter={withRouter}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  })
}

// Mock user for testing
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
  },
}

// Mock auth state
export const mockAuthState = {
  user: mockUser,
  session: {
    access_token: 'mock-token',
    refresh_token: 'mock-refresh-token',
  },
}

// Helper to create mock notifications
export const createMockNotification = (overrides = {}) => ({
  id: 'notification-id',
  user_id: mockUser.id,
  type: 'follow' as const,
  title: 'New Follower',
  message: 'Someone followed you',
  read: false,
  created_at: new Date().toISOString(),
  data: {
    actor_id: 'actor-id',
    actor_name: 'Actor Name',
  },
  ...overrides,
})

// Helper to wait for async operations
export const waitFor = (ms: number = 0) =>
  new Promise(resolve => setTimeout(resolve, ms))

// Re-export testing-library functions (excluding conflicting ones)
export { screen, fireEvent, cleanup } from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'

// Export our custom utilities with distinct names to avoid conflicts
export { customRender as renderWithProviders }
export { mockUser as testUser, mockAuthState as testAuthState, createMockNotification as createTestNotification, waitFor as waitForTest }
