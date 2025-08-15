import React, { useState, useEffect } from 'react'

interface Verse {
  text: string
  reference: string
  translation: string
}

const mockVerses: Verse[] = [
  {
    text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
    reference: "John 3:16",
    translation: "NIV"
  },
  {
    text: "I can do all this through him who gives me strength.",
    reference: "Philippians 4:13",
    translation: "NIV"
  },
  {
    text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
    reference: "Proverbs 3:5-6",
    translation: "NIV"
  },
  {
    text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
    reference: "Joshua 1:9",
    translation: "NIV"
  },
  {
    text: "The Lord is my shepherd, I lack nothing.",
    reference: "Psalm 23:1",
    translation: "NIV"
  }
]

export const DailyVerse: React.FC = () => {
  const [animateIn, setAnimateIn] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [currentVerse, setCurrentVerse] = useState<Verse>(mockVerses[0])

  useEffect(() => {
    setAnimateIn(true)
    // Change verse daily based on date
    const today = new Date().getDate()
    const verseIndex = today % mockVerses.length
    setCurrentVerse(mockVerses[verseIndex])
  }, [])

  return (
    <div 
      className="bg-neutral-900/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-800 transition-all duration-500 transform hover:scale-[1.02]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="text-center">
        <div className="mb-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg mb-4">
            <span className="text-white text-xl sm:text-2xl">📖</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2">Daily Verse</h3>
          <p className="text-gray-400">Today's scripture to inspire your faith</p>
        </div>

        <div className={`transition-all duration-700 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <blockquote className="text-lg sm:text-xl md:text-2xl text-gray-200 leading-relaxed mb-6 italic">
            "{currentVerse.text}"
          </blockquote>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6">
            <cite className="text-base sm:text-lg font-bold text-green-400 not-italic">
              — {currentVerse.reference}
            </cite>
            <span className="px-3 py-1 bg-green-900/50 text-green-300 rounded-full text-xs sm:text-sm font-medium">
              {currentVerse.translation}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <button className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105">
              <span>💾</span>
              <span>Save</span>
            </button>
            <button className="flex items-center justify-center space-x-2 bg-neutral-800 text-green-400 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium border-2 border-neutral-700 hover:bg-neutral-700 transition-all duration-300 transform hover:scale-105">
              <span>📤</span>
              <span>Share</span>
            </button>
          </div>
        </div>

        {isHovered && (
          <div className="mt-6 pt-6 border-t border-neutral-700">
            <p className="text-xs sm:text-sm text-gray-400">
              💡 Tip: Meditate on this verse throughout your day. Let it guide your thoughts and actions.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
