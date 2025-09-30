// Bible Service with reliable fallback content and API integration
interface BibleVerse {
  reference: string;
  text: string;
  translation: string;
  book: string;
  chapter: number;
  verse: number;
}

interface BibleChapter {
  book: string;
  chapter: number;
  verses: { verse: number; text: string }[];
  translation: string;
}

interface BibleSearchResult {
  reference: string;
  text: string;
  translation: string;
  book: string;
  chapter: number;
  verse: number;
  score?: number;
}

class BibleService {
  // Updated to use the correct version codes that Bible Gateway supports
  private translations = ['NIV', 'KJV', 'ESV', 'NKJV', 'NLT', 'NASB', 'CSB', 'MSG'];

  constructor() {
    // Test the service
    this.testService();
  }

  // Test method to check if service is working
  private testService() {
    try {
      // Bible Service initialized successfully
    } catch (error) {
      console.error('Bible Service test failed:', error);
    }
  }

  // Daily verse suggestions for different moods
  private dailyVerses = [
    { reference: 'Psalm 46:10', mood: 'peace' },
    { reference: 'Philippians 4:6-7', mood: 'anxiety' },
    { reference: 'Isaiah 40:31', mood: 'strength' },
    { reference: 'Romans 8:28', mood: 'trust' },
    { reference: 'Joshua 1:9', mood: 'courage' },
    { reference: 'Psalm 23:1-3', mood: 'comfort' },
    { reference: 'Matthew 11:28-30', mood: 'rest' },
    { reference: '2 Corinthians 4:16-18', mood: 'hope' }
  ];

  // Get a complete chapter
  async getChapter(book: string, chapter: number, translation: string = 'NIV'): Promise<BibleChapter | null> {
    try {
      // Fetching chapter

      // Try Bible API first
      const apiChapter = await this.fetchChapterFromAPI(book, chapter, translation);
      if (apiChapter) {
        return apiChapter;
      }

      // Fallback to local content
      return this.getFallbackChapter(book, chapter, translation);

    } catch (error) {
      console.error('Error fetching chapter:', error);
      return this.getFallbackChapter(book, chapter, translation);
    }
  }

  // Fetch chapter from Bible API
  private async fetchChapterFromAPI(book: string, chapter: number, translation: string): Promise<BibleChapter | null> {
    try {
      // Using ESV API as primary source (free for personal use)
      const ESV_API_KEY = (import.meta as any).env?.VITE_ESV_API_KEY;

      if (ESV_API_KEY) {
        const response = await fetch(`https://api.esv.org/v3/passage/text/?q=${book}+${chapter}&include-passage-references=false&include-verse-numbers=true&include-footnotes=false&include-short-copyright=false&include-passage-horizontal-lines=false&include-heading-horizontal-lines=false`, {
          headers: {
            'Authorization': `Token ${ESV_API_KEY}`,
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          return this.parseESVResponse(data, book, chapter, translation);
        }
      }

      // Fallback to other APIs if ESV fails
      return await this.tryAlternativeAPIs(book, chapter, translation);

    } catch (error) {
      console.error('Bible API error:', error);
      return null;
    }
  }

  // Parse ESV API response
  private parseESVResponse(data: any, book: string, chapter: number, translation: string): BibleChapter {
    const verses: { verse: number; text: string }[] = [];

    if (data.passages && data.passages[0]) {
      const passage = data.passages[0];
      // Split by verse numbers and parse
      const verseRegex = /\[(\d+)\]\s*([^[\n]+)/g;
      let match;

      while ((match = verseRegex.exec(passage)) !== null) {
        verses.push({
          verse: parseInt(match[1]),
          text: match[2].trim()
        });
      }
    }

    return {
      book,
      chapter,
      verses,
      translation
    };
  }

  // Try alternative Bible APIs
  private async tryAlternativeAPIs(book: string, chapter: number, translation: string): Promise<BibleChapter | null> {
    try {
      // Try Bible Gateway API (if available)
      const response = await fetch(`https://www.biblegateway.com/passage/?search=${book}+${chapter}&version=${translation}&interface=print`);

      if (response.ok) {
        const html = await response.text();
        return this.parseBibleGatewayResponse(html, book, chapter, translation);
      }
    } catch (error) {
      console.error('Alternative API error:', error);
    }

    return null;
  }

  // Parse Bible Gateway HTML response
  private parseBibleGatewayResponse(html: string, book: string, chapter: number, translation: string): BibleChapter {
    const verses: { verse: number; text: string }[] = [];

    // Simple HTML parsing for verse content
    const verseRegex = /<span[^>]*data-verse="(\d+)"[^>]*>(.*?)<\/span>/g;
    let match;

    while ((match = verseRegex.exec(html)) !== null) {
      verses.push({
        verse: parseInt(match[1]),
        text: match[2].replace(/<[^>]*>/g, '').trim()
      });
    }

    return {
      book,
      chapter,
      verses,
      translation
    };
  }

  // Get a specific verse or passage
  async getVerse(reference: string, translation: string = 'NIV'): Promise<BibleVerse | null> {
    try {
      // Fetching verse
      
      // Check if we have specific fallback content for this reference
      const fallbackVerse = this.getFallbackVerse(reference);
      
      if (fallbackVerse) {
        // Update the translation to match user's choice
        fallbackVerse.translation = translation;
        return fallbackVerse;
      }
      
      // For any other reference, show "Coming Soon" message
      return this.createComingSoonVerse(reference, translation);
      
    } catch (error) {
      console.error('Error fetching verse:', error);
      // Using fallback content instead
      return this.getFallbackVerse(reference) || this.createComingSoonVerse(reference, translation);
    }
  }

  // Get verse of the day
  getVerseOfTheDay(): { reference: string; mood: string } {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return this.dailyVerses[dayOfYear % this.dailyVerses.length];
  }

  // Get daily reading suggestion
  getDailyReading(): { reference: string; description: string } {
    const suggestions = [
      { reference: 'Psalm 1', description: 'The Way of the Righteous' },
      { reference: 'Matthew 5:1-12', description: 'The Beatitudes' },
      { reference: 'John 3:1-21', description: 'Nicodemus and New Birth' },
      { reference: 'Romans 8:1-17', description: 'Life in the Spirit' },
      { reference: '1 Corinthians 13', description: 'The Love Chapter' },
      { reference: 'Galatians 5:16-26', description: 'Fruit of the Spirit' },
      { reference: 'Ephesians 6:10-18', description: 'Armor of God' },
      { reference: 'Philippians 4:4-9', description: 'Rejoice Always' }
    ];

    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return suggestions[dayOfYear % suggestions.length];
  }

  // Search for verses
  async searchVerses(query: string, translation: string = 'NIV', limit: number = 10): Promise<BibleSearchResult[]> {
    try {
      // Searching for
      
      // Use fallback search results for now
      const results = this.getFallbackSearchResults(query);
      
      // Limit results and update translations
      return results.slice(0, limit).map(result => ({
        ...result,
        translation: translation
      }));
      
    } catch (error) {
      console.error('Search error:', error);
      // Using fallback search results
      return this.getFallbackSearchResults(query);
    }
  }

  // Get available translations
  async getAvailableTranslations(): Promise<string[]> {
    return this.translations;
  }

  // Parse Bible reference (e.g., "Matt 5:1-3" or "John 3:16")
  private parseReference(reference: string): { book: string; chapter: number; verse?: number; endVerse?: number } {
    const match = reference.match(/^(\w+)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);
    
    if (match) {
      return {
        book: match[1],
        chapter: parseInt(match[2]),
        verse: match[3] ? parseInt(match[3]) : undefined,
        endVerse: match[4] ? parseInt(match[4]) : undefined
      };
    }
    
    return { book: 'Unknown', chapter: 1 };
  }

  // Clean text content
  private cleanText(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/\s+/g, ' ') // Remove extra whitespace
      .replace(/\[.*?\]/g, '') // Remove brackets and content
      .trim();
  }

  // Create verse from available content when fallback doesn't exist
  private createVerseFromAvailableContent(reference: string, translation: string): BibleVerse | null {
    const parsed = this.parseReference(reference);
    
    // Generate a meaningful verse based on the reference
    const bookName = parsed.book;
    const chapter = parsed.chapter;
    const verse = parsed.verse || 1;
    
    // Create a verse that makes sense for the reference
    const verseText = `This is ${bookName} chapter ${chapter}${verse > 1 ? `, verse ${verse}` : ''}. The Word of God is living and active, sharper than any two-edged sword.`;
    
    return {
      reference: reference,
      text: verseText,
      translation: translation,
      book: bookName,
      chapter: chapter,
      verse: verse
    };
  }

  // Enhanced fallback content when API is not available
  private getFallbackVerse(reference: string): BibleVerse | null {
    const fallbackVerses: { [key: string]: string } = {
      // Popular verses
      'John 3:16': 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
      'Psalm 46:10': 'Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth.',
      'Philippians 4:6-7': 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.',
      'Isaiah 40:31': 'But those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.',
      'Romans 8:28': 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
      'Joshua 1:9': 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go.',
      'Psalm 23:1-3': 'The LORD is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.',
      'Matthew 11:28-30': 'Come to me, all you who are weary and burdened, and I will give you rest. Take my yoke upon you and learn from me, for I am gentle and humble in heart, and you will find rest for your souls. For my yoke is easy and my burden is light.',
      '2 Corinthians 4:16-18': 'Therefore we do not lose heart. Though outwardly we are wasting away, yet inwardly we are being renewed day by day. For our light and momentary troubles are achieving for us an eternal glory that far outweighs them all.',
      
      // Genesis
      'Genesis 1:1': 'In the beginning God created the heavens and the earth.',
      'Genesis 1:26': 'Then God said, "Let us make mankind in our image, in our likeness, so that they may rule over the fish in the sea and the birds in the sky, over the livestock and all the wild animals, and over all the creatures that move along the ground."',
      
      // Psalms
      'Psalm 1:1': 'Blessed is the one who does not walk in step with the wicked or stand in the way that sinners take or sit in the company of mockers.',
      'Psalm 19:1': 'The heavens declare the glory of God; the skies proclaim the work of his hands.',
      'Psalm 119:105': 'Your word is a lamp for my feet, a light on my path.',
      
      // Gospels
      'Matthew 5:3': 'Blessed are the poor in spirit, for theirs is the kingdom of heaven.',
      'Matthew 6:33': 'But seek first his kingdom and his righteousness, and all these things will be given to you as well.',
      'Mark 10:27': 'Jesus looked at them and said, "With man this is impossible, but not with God; all things are possible with God."',
      'Luke 6:31': 'Do to others as you would have them do to you.',
      'John 1:1': 'In the beginning was the Word, and the Word was with God, and the Word was God.',
      'John 14:6': 'Jesus answered, "I am the way and the truth and the life. No one comes to the Father except through me."',
      
      // Epistles
      'Romans 3:23': 'For all have sinned and fall short of the glory of God.',
      'Romans 12:2': 'Do not conform to the pattern of this world, but be transformed by the renewing of your mind. Then you will be able to test and approve what God\'s will is—his good, pleasing and perfect will.',
      '1 Corinthians 13:4-7': 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs. Love does not delight in evil but rejoices with the truth. It always protects, always trusts, always hopes, always perseveres.',
      'Galatians 5:22-23': 'But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control. Against such things there is no law.',
      'Ephesians 2:8-9': 'For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God—not by works, so that no one can boast.',
      'Philippians 4:13': 'I can do all this through him who gives me strength.',
      'Colossians 3:23': 'Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.',
      '1 Thessalonians 5:16-18': 'Rejoice always, pray continually, give thanks in all circumstances; for this is God\'s will for you in Christ Jesus.',
      '2 Timothy 3:16-17': 'All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness, so that the servant of God may be thoroughly equipped for every good work.',
      'Hebrews 11:1': 'Now faith is confidence in what we hope for and assurance about what we do not see.',
      'James 1:5': 'If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you.',
      '1 Peter 5:7': 'Cast all your anxiety on him because he cares for you.',
      '1 John 4:8': 'Whoever does not love does not know God, because God is love.',
      'Revelation 3:20': 'Here I am! I stand at the door and knock. If anyone hears my voice and opens the door, I will come in and eat with that person, and they with me.'
    };

    const text = fallbackVerses[reference];
    if (!text) return null;

    const parsed = this.parseReference(reference);
    
    return {
      reference: reference,
      text: text,
      translation: 'NIV',
      book: parsed.book,
      chapter: parsed.chapter,
      verse: parsed.verse || 1
    };
  }

  // Enhanced fallback search results
  private getFallbackSearchResults(query: string): BibleSearchResult[] {
    const allVerses = [
      { reference: 'John 3:16', text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.', book: 'John', chapter: 3, verse: 16 },
      { reference: 'Psalm 46:10', text: 'Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth.', book: 'Psalm', chapter: 46, verse: 10 },
      { reference: 'Philippians 4:6-7', text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.', book: 'Philippians', chapter: 4, verse: 6 },
      { reference: 'Isaiah 40:31', text: 'But those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.', book: 'Isaiah', chapter: 40, verse: 31 },
      { reference: 'Romans 8:28', text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.', book: 'Romans', chapter: 8, verse: 28 },
      { reference: 'Matthew 11:28-30', text: 'Come to me, all you who are weary and burdened, and I will give you rest. Take my yoke upon you and learn from me, for I am gentle and humble in heart, and you will find rest for your souls.', book: 'Matthew', chapter: 11, verse: 28 },
      { reference: 'Psalm 23:1-3', text: 'The LORD is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.', book: 'Psalm', chapter: 23, verse: 1 },
      { reference: '1 Corinthians 13:4-7', text: 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs.', book: '1 Corinthians', chapter: 13, verse: 4 }
    ];

    const queryLower = query.toLowerCase();
    return allVerses
      .filter(verse => 
        verse.text.toLowerCase().includes(queryLower) || 
        verse.reference.toLowerCase().includes(queryLower) ||
        verse.book.toLowerCase().includes(queryLower)
      )
      .map(verse => ({
        ...verse,
        translation: 'NIV',
        score: 1.0
      }));
  }

  // Get fallback chapter when API is not available
  private getFallbackChapter(book: string, chapter: number, translation: string): BibleChapter {
    const verses: { verse: number; text: string }[] = [];

    // For now, return a single verse indicating content is coming soon
    verses.push({
      verse: 1,
      text: `📖 ${book} Chapter ${chapter} - Coming Soon!\n\nWe're working on adding complete Bible content to ChristianKit. For now, you can enjoy our curated selection of popular verses and daily readings.\n\nCheck back soon for full chapter content!`
    });

    return {
      book,
      chapter,
      verses,
      translation
    };
  }

  // Create a "Coming Soon" verse for references without specific content
  private createComingSoonVerse(reference: string, translation: string): BibleVerse {
    const parsed = this.parseReference(reference);
    
    return {
      reference: reference,
      text: `📖 ${reference} - Coming Soon!\n\nWe're working on adding more Bible content. For now, you can enjoy our curated selection of popular verses and daily readings.`,
      translation: translation,
      book: parsed.book,
      chapter: parsed.chapter,
      verse: parsed.verse || 1
    };
  }
}

export const bibleService = new BibleService();
export type { BibleVerse, BibleChapter, BibleSearchResult };
