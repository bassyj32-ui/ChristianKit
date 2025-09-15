import React, { useState, useEffect } from 'react';
import { bibleService, BibleVerse, BibleChapter } from '../services/BibleService';

interface BibleReaderProps {
  onClose: () => void;
}

interface BibleBook {
  name: string;
  chapters: number;
  testament: 'Old' | 'New';
  category: string;
}

export const BibleReader: React.FC<BibleReaderProps> = ({ onClose }) => {
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [bibleContent, setBibleContent] = useState<BibleChapter | null>(null);
  const [selectedTranslation, setSelectedTranslation] = useState('NIV');
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'books' | 'chapters' | 'reading'>('books');

  const translations = [
    { code: 'NIV', name: 'NIV' },
    { code: 'KJV', name: 'KJV' },
    { code: 'ESV', name: 'ESV' },
    { code: 'NKJV', name: 'NKJV' },
    { code: 'NLT', name: 'NLT' }
  ];

  // All 66 books of the Bible
  const bibleBooks: BibleBook[] = [
    // Old Testament
    { name: 'Genesis', chapters: 50, testament: 'Old', category: 'Law' },
    { name: 'Exodus', chapters: 40, testament: 'Old', category: 'Law' },
    { name: 'Leviticus', chapters: 27, testament: 'Old', category: 'Law' },
    { name: 'Numbers', chapters: 36, testament: 'Old', category: 'Law' },
    { name: 'Deuteronomy', chapters: 34, testament: 'Old', category: 'Law' },
    { name: 'Joshua', chapters: 24, testament: 'Old', category: 'Historical' },
    { name: 'Judges', chapters: 21, testament: 'Old', category: 'Historical' },
    { name: 'Ruth', chapters: 4, testament: 'Old', category: 'Historical' },
    { name: '1 Samuel', chapters: 31, testament: 'Old', category: 'Historical' },
    { name: '2 Samuel', chapters: 24, testament: 'Old', category: 'Historical' },
    { name: '1 Kings', chapters: 22, testament: 'Old', category: 'Historical' },
    { name: '2 Kings', chapters: 25, testament: 'Old', category: 'Historical' },
    { name: '1 Chronicles', chapters: 29, testament: 'Old', category: 'Historical' },
    { name: '2 Chronicles', chapters: 36, testament: 'Old', category: 'Historical' },
    { name: 'Ezra', chapters: 10, testament: 'Old', category: 'Historical' },
    { name: 'Nehemiah', chapters: 13, testament: 'Old', category: 'Historical' },
    { name: 'Esther', chapters: 10, testament: 'Old', category: 'Historical' },
    { name: 'Job', chapters: 42, testament: 'Old', category: 'Wisdom' },
    { name: 'Psalms', chapters: 150, testament: 'Old', category: 'Wisdom' },
    { name: 'Proverbs', chapters: 31, testament: 'Old', category: 'Wisdom' },
    { name: 'Ecclesiastes', chapters: 12, testament: 'Old', category: 'Wisdom' },
    { name: 'Song of Solomon', chapters: 8, testament: 'Old', category: 'Wisdom' },
    { name: 'Isaiah', chapters: 66, testament: 'Old', category: 'Prophetic' },
    { name: 'Jeremiah', chapters: 52, testament: 'Old', category: 'Prophetic' },
    { name: 'Lamentations', chapters: 5, testament: 'Old', category: 'Prophetic' },
    { name: 'Ezekiel', chapters: 48, testament: 'Old', category: 'Prophetic' },
    { name: 'Daniel', chapters: 12, testament: 'Old', category: 'Prophetic' },
    { name: 'Hosea', chapters: 14, testament: 'Old', category: 'Prophetic' },
    { name: 'Joel', chapters: 3, testament: 'Old', category: 'Prophetic' },
    { name: 'Amos', chapters: 9, testament: 'Old', category: 'Prophetic' },
    { name: 'Obadiah', chapters: 1, testament: 'Old', category: 'Prophetic' },
    { name: 'Jonah', chapters: 4, testament: 'Old', category: 'Prophetic' },
    { name: 'Micah', chapters: 7, testament: 'Old', category: 'Prophetic' },
    { name: 'Nahum', chapters: 3, testament: 'Old', category: 'Prophetic' },
    { name: 'Habakkuk', chapters: 3, testament: 'Old', category: 'Prophetic' },
    { name: 'Zephaniah', chapters: 3, testament: 'Old', category: 'Prophetic' },
    { name: 'Haggai', chapters: 2, testament: 'Old', category: 'Prophetic' },
    { name: 'Zechariah', chapters: 14, testament: 'Old', category: 'Prophetic' },
    { name: 'Malachi', chapters: 4, testament: 'Old', category: 'Prophetic' },
    
    // New Testament
    { name: 'Matthew', chapters: 28, testament: 'New', category: 'Gospel' },
    { name: 'Mark', chapters: 16, testament: 'New', category: 'Gospel' },
    { name: 'Luke', chapters: 24, testament: 'New', category: 'Gospel' },
    { name: 'John', chapters: 21, testament: 'New', category: 'Gospel' },
    { name: 'Acts', chapters: 28, testament: 'New', category: 'Historical' },
    { name: 'Romans', chapters: 16, testament: 'New', category: 'Epistle' },
    { name: '1 Corinthians', chapters: 16, testament: 'New', category: 'Epistle' },
    { name: '2 Corinthians', chapters: 13, testament: 'New', category: 'Epistle' },
    { name: 'Galatians', chapters: 6, testament: 'New', category: 'Epistle' },
    { name: 'Ephesians', chapters: 6, testament: 'New', category: 'Epistle' },
    { name: 'Philippians', chapters: 4, testament: 'New', category: 'Epistle' },
    { name: 'Colossians', chapters: 4, testament: 'New', category: 'Epistle' },
    { name: '1 Thessalonians', chapters: 5, testament: 'New', category: 'Epistle' },
    { name: '2 Thessalonians', chapters: 3, testament: 'New', category: 'Epistle' },
    { name: '1 Timothy', chapters: 6, testament: 'New', category: 'Epistle' },
    { name: '2 Timothy', chapters: 4, testament: 'New', category: 'Epistle' },
    { name: 'Titus', chapters: 3, testament: 'New', category: 'Epistle' },
    { name: 'Philemon', chapters: 1, testament: 'New', category: 'Epistle' },
    { name: 'Hebrews', chapters: 13, testament: 'New', category: 'Epistle' },
    { name: 'James', chapters: 5, testament: 'New', category: 'Epistle' },
    { name: '1 Peter', chapters: 5, testament: 'New', category: 'Epistle' },
    { name: '2 Peter', chapters: 3, testament: 'New', category: 'Epistle' },
    { name: '1 John', chapters: 5, testament: 'New', category: 'Epistle' },
    { name: '2 John', chapters: 1, testament: 'New', category: 'Epistle' },
    { name: '3 John', chapters: 1, testament: 'New', category: 'Epistle' },
    { name: 'Jude', chapters: 1, testament: 'New', category: 'Epistle' },
    { name: 'Revelation', chapters: 22, testament: 'New', category: 'Prophetic' }
  ];

  // Load chapter content
  const loadChapter = async () => {
    if (!selectedBook || !selectedChapter) return;

    setIsLoading(true);

    try {
      // Use the new getChapter method to fetch complete chapter content
      const chapterData = await bibleService.getChapter(selectedBook, selectedChapter, selectedTranslation);

      if (chapterData) {
        setBibleContent(chapterData);
      } else {
        // Fallback if chapter loading fails
        setBibleContent({
          book: selectedBook,
          chapter: selectedChapter,
          verses: [{
            verse: 1,
            text: `📖 ${selectedBook} Chapter ${selectedChapter} - Content Unavailable\n\nWe're working on adding complete Bible content. For now, you can enjoy our curated selection of popular verses and daily readings.\n\nCheck back soon for full chapter content!`
          }],
          translation: selectedTranslation
        });
      }

      setView('reading');
    } catch (error) {
      console.error('Error loading chapter:', error);
      // Show error message
      setBibleContent({
        book: selectedBook,
        chapter: selectedChapter,
        verses: [{
          verse: 1,
          text: `❌ Unable to load chapter content\n\n${selectedBook} Chapter ${selectedChapter} is not available yet.\n\nWe're working on adding more Bible content. Please try a different chapter or translation.`
        }],
        translation: selectedTranslation
      });
      setView('reading');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateChapter = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
      loadChapter();
    } else if (direction === 'next') {
      const currentBook = bibleBooks.find(b => b.name === selectedBook);
      if (currentBook && selectedChapter < currentBook.chapters) {
        setSelectedChapter(selectedChapter + 1);
        loadChapter();
      }
    }
  };

  const selectBook = (bookName: string) => {
    setSelectedBook(bookName);
    setSelectedChapter(1);
    setView('chapters');
  };

  const selectChapter = (chapter: number) => {
    setSelectedChapter(chapter);
    loadChapter();
  };

  const goBackToBooks = () => {
    setView('books');
    setSelectedBook('');
    setSelectedChapter(1);
  };

  const goBackToChapters = () => {
    setView('chapters');
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-[#0a0a0a] rounded-3xl border border-white/20 max-w-6xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-4">
            <button
              onClick={goBackToBooks}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-white">Bible Reader</h2>
            {selectedBook && (
              <span className="text-lg text-amber-400">• {selectedBook}</span>
            )}
            {selectedChapter > 0 && (
              <span className="text-lg text-amber-400">• Chapter {selectedChapter}</span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Translation Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-300 text-sm">Translation:</span>
              <select
                value={selectedTranslation}
                onChange={(e) => setSelectedTranslation(e.target.value)}
                className="bg-white/10 text-white border border-white/20 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-amber-400"
              >
                {translations.map((translation) => (
                  <option key={translation.code} value={translation.code}>
                    {translation.name}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {/* Books View */}
          {view === 'books' && (
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Old Testament */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-amber-400 border-b border-amber-400/30 pb-2">
                    Old Testament
                  </h3>
                  {bibleBooks
                    .filter(book => book.testament === 'Old')
                    .map((book) => (
                      <button
                        key={book.name}
                        onClick={() => selectBook(book.name)}
                        className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300"
                      >
                        <div className="font-medium text-white">{book.name}</div>
                        <div className="text-sm text-gray-400">
                          {book.chapters} chapters • {book.category}
                        </div>
                      </button>
                    ))}
                </div>

                {/* New Testament */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-amber-400 border-b border-amber-400/30 pb-2">
                    New Testament
                  </h3>
                  {bibleBooks
                    .filter(book => book.testament === 'New')
                    .map((book) => (
                      <button
                        key={book.name}
                        onClick={() => selectBook(book.name)}
                        className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300"
                      >
                        <div className="font-medium text-white">{book.name}</div>
                        <div className="text-sm text-gray-400">
                          {book.chapters} chapters • {book.category}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Chapters View */}
          {view === 'chapters' && (
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{selectedBook}</h3>
                <p className="text-gray-400">Select a chapter to read</p>
              </div>
              
              <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                {Array.from({ length: bibleBooks.find(b => b.name === selectedBook)?.chapters || 0 }, (_, i) => i + 1).map((chapter) => (
                  <button
                    key={chapter}
                    onClick={() => selectChapter(chapter)}
                    className="p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-amber-400/50 transition-all duration-300 text-center"
                  >
                    <span className="text-lg font-medium text-white">{chapter}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reading View */}
          {view === 'reading' && (
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
              {/* Chapter Navigation */}
              <div className="flex items-center justify-between mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                <button
                  onClick={() => navigateChapter('prev')}
                  disabled={selectedChapter <= 1}
                  className="flex items-center space-x-2 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Previous Chapter</span>
                </button>
                
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white">{selectedBook}</h3>
                  <p className="text-lg text-amber-400">Chapter {selectedChapter}</p>
                  <p className="text-sm text-gray-400">{selectedTranslation}</p>
                </div>
                
                <button
                  onClick={() => navigateChapter('next')}
                  disabled={selectedChapter >= (bibleBooks.find(b => b.name === selectedBook)?.chapters || 0)}
                  className="flex items-center space-x-2 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <span>Next Chapter</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Bible Content */}
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📖</div>
                  <p className="text-white text-lg">Loading chapter...</p>
                </div>
              ) : bibleContent ? (
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="text-lg text-white leading-relaxed">
                    {bibleContent.verses.map((verse, index) => (
                      <div key={verse.verse} className="mb-4">
                        <sup className="text-amber-400 font-bold mr-2">{verse.verse}</sup>
                        <span className="whitespace-pre-line">{verse.text}</span>
                        {index < bibleContent.verses.length - 1 && (
                          <span className="block h-2"></span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 text-right">
                    <span className="text-sm text-gray-400">
                      {bibleContent.book} {bibleContent.chapter} • {bibleContent.translation}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">❌</div>
                  <p className="text-white text-lg">Unable to load chapter content</p>
                  <p className="text-gray-400">Please try a different chapter or translation</p>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex justify-center mt-6 space-x-4">
                <button
                  onClick={goBackToChapters}
                  className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/20"
                >
                  Choose Another Chapter
                </button>
                <button
                  onClick={goBackToBooks}
                  className="px-6 py-3 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-all duration-300 border border-amber-400/30"
                >
                  Choose Another Book
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
