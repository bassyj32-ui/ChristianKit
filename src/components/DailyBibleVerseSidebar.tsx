import React, { useState, useEffect } from 'react'
import { bibleVersesByLevel, levelProgression } from '../data/verseLevels'

interface BibleVerse {
  id: string;
  verse: string;
  reference: string;
  category: string;
}

export const DailyBibleVerseSidebar: React.FC = () => {
  const [dailyVerse, setDailyVerse] = useState<BibleVerse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getDailyVerse = (): BibleVerse => {
      // Get current date as seed for consistent daily verse
      const today = new Date()
      const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000)

      // Use day of year to select verse consistently
      const verseIndex = dayOfYear % 100 // 100 verses total
      let verseCount = 0

      // Find which level and verse index corresponds to our day
      for (const level of levelProgression) {
        const verses = bibleVersesByLevel[level]
        if (verseCount + verses.length > verseIndex) {
          const verseInLevel = verseIndex - verseCount
          return verses[verseInLevel]
        }
        verseCount += verses.length
      }

      // Fallback to first verse if calculation fails
      return bibleVersesByLevel[1][0]
    }

    setDailyVerse(getDailyVerse())
    setIsLoading(false)
  }, [])

  if (isLoading || !dailyVerse) {
    return null // Don't show on mobile or during loading
  }

  return (
    <div className="hidden lg:block fixed left-4 top-1/2 transform -translate-y-1/2 z-30">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 max-w-xs shadow-2xl">
        <div className="text-center mb-3">
          <h3 className="text-sm font-bold text-white/80 uppercase tracking-wide">
            Daily Verse
          </h3>
        </div>

        <div className="text-center mb-4">
          <div className="text-2xl mb-2">📖</div>
          <p className="text-white text-sm leading-relaxed italic">
            "{dailyVerse.verse}"
          </p>
        </div>

        <div className="text-center">
          <p className="text-yellow-400 text-xs font-medium">
            {dailyVerse.reference}
          </p>
          <p className="text-white/60 text-xs mt-1 capitalize">
            {dailyVerse.category}
          </p>
        </div>

        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-white/50 text-xs text-center">
            Changes daily • {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}

export default DailyBibleVerseSidebar
















