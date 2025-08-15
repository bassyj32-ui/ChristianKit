import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'

describe('App', () => {
  it('renders the main heading', () => {
    render(<App />)
    expect(screen.getByText('ChristianKit')).toBeInTheDocument()
  })

  it('renders the description text', () => {
    render(<App />)
    expect(screen.getByText('Grow Your Faith Daily')).toBeInTheDocument()
  })

  it('renders navigation tabs', () => {
    render(<App />)
    expect(screen.getByText('prayer')).toBeInTheDocument()
    expect(screen.getByText('dashboard')).toBeInTheDocument()
    expect(screen.getByText('journal')).toBeInTheDocument()
    expect(screen.getByText('community')).toBeInTheDocument()
    expect(screen.getByText('store')).toBeInTheDocument()
  })

  it('shows prayer timer as default', () => {
    render(<App />)
    expect(screen.getByText('Prayer Timer')).toBeInTheDocument()
    expect(screen.getByText('Set aside dedicated time for prayer and reflection')).toBeInTheDocument()
  })

  it('shows current tab content', () => {
    render(<App />)
    expect(screen.getByText('15:00')).toBeInTheDocument()
    expect(screen.getByText('Minutes remaining')).toBeInTheDocument()
  })

  it('switches tabs when clicked', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Click on dashboard tab
    const dashboardTab = screen.getByText('dashboard')
    await user.click(dashboardTab)
    
    // Should show dashboard content
    expect(screen.getByText('Welcome Back!')).toBeInTheDocument()
  })
})




import userEvent from '@testing-library/user-event'
import { App } from './App'

describe('App', () => {
  it('renders the main heading', () => {
    render(<App />)
    expect(screen.getByText('ChristianKit')).toBeInTheDocument()
  })

  it('renders the description text', () => {
    render(<App />)
    expect(screen.getByText('Grow Your Faith Daily')).toBeInTheDocument()
  })

  it('renders navigation tabs', () => {
    render(<App />)
    expect(screen.getByText('prayer')).toBeInTheDocument()
    expect(screen.getByText('dashboard')).toBeInTheDocument()
    expect(screen.getByText('journal')).toBeInTheDocument()
    expect(screen.getByText('community')).toBeInTheDocument()
    expect(screen.getByText('store')).toBeInTheDocument()
  })

  it('shows prayer timer as default', () => {
    render(<App />)
    expect(screen.getByText('Prayer Timer')).toBeInTheDocument()
    expect(screen.getByText('Set aside dedicated time for prayer and reflection')).toBeInTheDocument()
  })

  it('shows current tab content', () => {
    render(<App />)
    expect(screen.getByText('15:00')).toBeInTheDocument()
    expect(screen.getByText('Minutes remaining')).toBeInTheDocument()
  })

  it('switches tabs when clicked', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Click on dashboard tab
    const dashboardTab = screen.getByText('dashboard')
    await user.click(dashboardTab)
    
    // Should show dashboard content
    expect(screen.getByText('Welcome Back!')).toBeInTheDocument()
  })
})



