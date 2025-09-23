import React, { useState, useEffect } from 'react'
import { OsmoCard, OsmoButton, OsmoGradientText } from '../theme/osmoComponents'

interface BibleVerse {
  text: string
  reference: string
  theme: string
}

export const BibleVersesSidebar: React.FC = () => {
  const [dailyVerses, setDailyVerses] = useState<BibleVerse[]>([])

  const versesByTheme = {
    hope: [
      {
        text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, to give you hope and a future.",
        reference: "Jeremiah 29:11",
        theme: "Hope"
      },
      {
        text: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.",
        reference: "Isaiah 40:31",
        theme: "Hope"
      },
      {
        text: "May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.",
        reference: "Romans 15:13",
        theme: "Hope"
      }
    ],
    peace: [
      {
        text: "Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.",
        reference: "John 14:27",
        theme: "Peace"
      },
      {
        text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",
        reference: "Philippians 4:6",
        theme: "Peace"
      },
      {
        text: "Cast all your anxiety on him because he cares for you.",
        reference: "1 Peter 5:7",
        theme: "Peace"
      }
    ],
    strength: [
      {
        text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
        reference: "Joshua 1:9",
        theme: "Strength"
      },
      {
        text: "I can do all this through him who gives me strength.",
        reference: "Philippians 4:13",
        theme: "Strength"
      },
      {
        text: "The Lord is my strength and my defense; he has become my salvation. He is my God, and I will praise him.",
        reference: "Exodus 15:2",
        theme: "Strength"
      }
    ],
    love: [
      {
        text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
        reference: "John 3:16",
        theme: "Love"
      },
      {
        text: "But God demonstrates his own love for us in this: While we were still sinners, Christ died for us.",
        reference: "Romans 5:8",
        theme: "Love"
      },
      {
        text: "See what great love the Father has lavished on us, that we should be called children of God! And that is what we are!",
        reference: "1 John 3:1",
        theme: "Love"
      }
    ],
    faith: [
      {
        text: "Now faith is confidence in what we hope for and assurance about what we do not see.",
        reference: "Hebrews 11:1",
        theme: "Faith"
      },
      {
        text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
        reference: "Proverbs 3:5-6",
        theme: "Faith"
      },
      {
        text: "And without faith it is impossible to please God, because anyone who comes to him must believe that he exists and that he rewards those who earnestly seek him.",
        reference: "Hebrews 11:6",
        theme: "Faith"
      }
    ]
  }

  // Get daily verses (random, different themes)
  const getDailyVerses = (): BibleVerse[] => {
    const today = new Date().toDateString()
    const savedVerses = localStorage.getItem('dailyVerses')
    const savedDate = localStorage.getItem('dailyVersesDate')
    
    if (savedVerses && savedDate === today) {
      return JSON.parse(savedVerses)
    }
    
    // Get random verse from each of 3 different themes
    const themes = Object.keys(versesByTheme) as (keyof typeof versesByTheme)[]
    const selectedThemes = themes.sort(() => 0.5 - Math.random()).slice(0, 3)
    
    const newDailyVerses = selectedThemes.map(theme => {
      const themesVerses = versesByTheme[theme]
      const randomIndex = Math.floor(Math.random() * themesVerses.length)
      return themesVerses[randomIndex]
    })
    
    localStorage.setItem('dailyVerses', JSON.stringify(newDailyVerses))
    localStorage.setItem('dailyVersesDate', today)
    
    return newDailyVerses
  }

  useEffect(() => {
    setDailyVerses(getDailyVerses())
  }, [])

  const getThemeIcon = (theme: string): string => {
    const icons = {
      'Hope': '🌟',
      'Peace': '🕊️',
      'Strength': '💪',
      'Love': '❤️',
      'Faith': '✝️'
    }
    return icons[theme as keyof typeof icons] || '✝️'
  }

  const getThemeColor = (theme: string): string => {
    const colors = {
      'Hope': 'from-yellow-400 to-amber-500',
      'Peace': 'from-blue-400 to-cyan-500',
      'Strength': 'from-red-400 to-pink-500',
      'Love': 'from-pink-400 to-rose-500',
      'Faith': 'from-purple-400 to-indigo-500'
    }
    return colors[theme as keyof typeof colors] || 'from-yellow-400 to-amber-500'
  }

  return (
    <div className="sticky top-4 space-y-4">
      {/* 3 Daily Verses - Separate Osmo Cards */}
      {dailyVerses.map((verse, index) => (
        <OsmoCard key={index} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getThemeIcon(verse.theme)}</span>
              <OsmoGradientText className="text-lg font-bold">
                Daily {verse.theme}
              </OsmoGradientText>
            </div>
          </div>
          
          <blockquote className="text-white text-sm leading-relaxed mb-4 italic">
            "{verse.text}"
          </blockquote>
          
          <cite className={`bg-gradient-to-r ${getThemeColor(verse.theme)} bg-clip-text text-transparent font-semibold text-sm`}>
            - {verse.reference}
          </cite>
        </OsmoCard>
      ))}

      {/* PWA Download - Osmo Style */}
      <OsmoCard className="p-6 text-center">
        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center mx-auto mb-3">
          <span className="text-black text-xl font-bold">📱</span>
        </div>
        <OsmoGradientText className="text-lg font-bold mb-2">
          Get ChristianKit App
        </OsmoGradientText>
        <p className="text-gray-400 text-sm mb-4">
          Take your faith journey everywhere with our mobile app
        </p>
        <OsmoButton className="w-full">
          Download Now
        </OsmoButton>
      </OsmoCard>
    </div>
  )
}