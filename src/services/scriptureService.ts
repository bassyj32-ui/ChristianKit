// Scripture Service - Handles Bible verse retrieval and management
export interface BibleVerse {
  id: string;
  reference: string;
  text: string;
  translation: string;
  book: string;
  chapter: number;
  verse: number;
}

export interface DailyVerse {
  verse: BibleVerse;
  theme: string;
  reflection: string;
}

class ScriptureService {
  private verses: BibleVerse[] = [
    {
      id: '1',
      reference: 'Psalm 46:10',
      text: 'Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth.',
      translation: 'NIV',
      book: 'Psalms',
      chapter: 46,
      verse: 10
    },
    {
      id: '2',
      reference: '1 Peter 5:7',
      text: 'Cast all your anxiety on him because he cares for you.',
      translation: 'NIV',
      book: '1 Peter',
      chapter: 5,
      verse: 7
    },
    {
      id: '3',
      reference: '1 Thessalonians 5:17',
      text: 'Pray without ceasing.',
      translation: 'NIV',
      book: '1 Thessalonians',
      chapter: 5,
      verse: 17
    },
    {
      id: '4',
      reference: 'Proverbs 3:5',
      text: 'Trust in the Lord with all your heart and lean not on your own understanding.',
      translation: 'NIV',
      book: 'Proverbs',
      chapter: 3,
      verse: 5
    },
    {
      id: '5',
      reference: 'Philippians 4:6',
      text: 'Do not be anxious about anything, but present your requests to God with thanksgiving.',
      translation: 'NIV',
      book: 'Philippians',
      chapter: 4,
      verse: 6
    }
  ];

  /**
   * Get a random daily verse
   */
  getDailyVerse(): DailyVerse {
    const randomIndex = Math.floor(Math.random() * this.verses.length);
    const verse = this.verses[randomIndex];
    
    const themes = [
      'Trust and Faith',
      'Prayer and Devotion',
      'Peace and Stillness',
      'Gratitude and Thanksgiving',
      'God\'s Care and Love'
    ];
    
    const reflections = [
      'Take a moment to reflect on how this verse speaks to your current situation.',
      'Consider how you can apply this truth to your daily life.',
      'Let this scripture guide your prayers and thoughts today.',
      'Meditate on the depth of God\'s love revealed in this verse.',
      'Use this verse as a foundation for your spiritual growth today.'
    ];

    return {
      verse,
      theme: themes[randomIndex % themes.length],
      reflection: reflections[randomIndex % reflections.length]
    };
  }

  /**
   * Search verses by keyword
   */
  searchVerses(query: string): BibleVerse[] {
    const lowercaseQuery = query.toLowerCase();
    return this.verses.filter(verse => 
      verse.text.toLowerCase().includes(lowercaseQuery) ||
      verse.reference.toLowerCase().includes(lowercaseQuery) ||
      verse.theme?.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Get verse by reference
   */
  getVerseByReference(reference: string): BibleVerse | null {
    return this.verses.find(verse => 
      verse.reference.toLowerCase() === reference.toLowerCase()
    ) || null;
  }

  /**
   * Get all verses
   */
  getAllVerses(): BibleVerse[] {
    return [...this.verses];
  }
}

export const scriptureService = new ScriptureService();
export default ScriptureService;
