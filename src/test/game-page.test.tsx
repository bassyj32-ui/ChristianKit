import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders } from './test-utils'
import BibleVerseMemoryMatch from '../components/BibleVerseMemoryMatch'

// Mock the Bible verses data
vi.mock('../data/verseLevels', () => ({
  bibleVersesByLevel: {
    1: [
      {
        id: 'test-verse-1',
        verse: 'For God so loved the world',
        reference: 'John 3:16',
        category: 'salvation'
      }
    ]
  },
  levelProgression: [1, 2, 3],
  getVersesForLevel: () => [
    {
      id: 'test-verse-1',
      verse: 'For God so loved the world',
      reference: 'John 3:16',
      category: 'salvation'
    }
  ],
  getTotalLevels: () => 12
}))

describe('BibleVerseMemoryMatch Game Page', () => {
  it('renders the game page without crashing', () => {
    const { container } = renderWithProviders(<BibleVerseMemoryMatch />)

    // Should render the main title
    expect(container.querySelector('h1')).toBeInTheDocument()
    expect(container.textContent).toContain('Bible Verse Match')
  })

  it('shows game start button when game is not started', () => {
    const { container } = renderWithProviders(<BibleVerseMemoryMatch />)

    // Should show the start game button
    const startButton = container.querySelector('button')
    expect(startButton).toBeInTheDocument()
    expect(startButton?.textContent).toContain('Start Game')
  })

  it('displays current level and best score', () => {
    const { container } = renderWithProviders(<BibleVerseMemoryMatch />)

    // Should show level and score information
    expect(container.textContent).toContain('Level 1')
    expect(container.textContent).toContain('Best Score')
  })

  it('shows game instructions', () => {
    const { container } = renderWithProviders(<BibleVerseMemoryMatch />)

    // Should show how to play instructions
    expect(container.textContent).toContain('How to Play')
    expect(container.textContent).toContain('Click cards to reveal Bible verses')
  })
})


