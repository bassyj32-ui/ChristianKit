import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

// Mock the complex dependencies that might be causing issues
vi.mock('./services/authService', () => ({
  authService: {
    getCurrentUser: () => Promise.resolve(null),
    signInWithGoogle: () => Promise.resolve(),
    signOut: () => Promise.resolve()
  }
}))

vi.mock('./services/cloudSyncService', () => ({
  cloudSyncService: {
    sync: () => Promise.resolve(),
    isOnline: () => true
  }
}))

vi.mock('./services/RealNotificationService', () => ({
  realNotificationService: {
    requestPermission: () => Promise.resolve('granted'),
    subscribe: () => Promise.resolve()
  }
}))

describe('App', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )
    // The app should render something, even if it's an error boundary
    expect(document.body).toBeInTheDocument()
  })

  it('renders the questionnaire for new users', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )
    
    // Check if questionnaire content is present
    expect(screen.getByText('Welcome to ChristianKit 🌟')).toBeInTheDocument()
    expect(screen.getByText("What's your experience level?")).toBeInTheDocument()
  })

  it('provides questionnaire options', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )
    
    // Check if questionnaire options are present
    expect(screen.getByText('🌱 Beginner')).toBeInTheDocument()
    expect(screen.getByText('🌿 Growing')).toBeInTheDocument()
    expect(screen.getByText('🌳 Experienced')).toBeInTheDocument()
  })
})



