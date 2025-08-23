import React, { useState } from 'react';
import { bibleService, BibleSearchResult } from '../services/BibleService';

interface BibleSearchProps {
  onClose: () => void;
}

export const BibleSearch: React.FC<BibleSearchProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BibleSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTranslation, setSelectedTranslation] = useState('niv');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const translations = [
    { code: 'niv', name: 'NIV' },
    { code: 'kjv', name: 'KJV' },
    { code: 'esv', name: 'ESV' },
    { code: 'nkjv', name: 'NKJV' },
    { code: 'nlt', name: 'NLT' }
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await bibleService.searchVerses(searchQuery, selectedTranslation, 20);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-[#0a0a0a] rounded-3xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Search the Bible</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6">
          <div className="flex space-x-3 mb-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search for verses, topics, or keywords..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="px-6 py-3 bg-amber-500 text-black font-semibold rounded-xl hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Translation Selection */}
          <div className="flex items-center space-x-4 mb-4">
            <span className="text-gray-300">Translation:</span>
            <div className="flex space-x-2">
              {translations.map((translation) => (
                <button
                  key={translation.code}
                  onClick={() => setSelectedTranslation(translation.code)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    selectedTranslation === translation.code
                      ? 'bg-amber-500 text-black'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {translation.name}
                </button>
              ))}
            </div>
          </div>

          {/* Search Tips */}
          <div className="text-sm text-gray-400 mb-4">
            <p>💡 <strong>Search tips:</strong> Try searching for topics like "love", "faith", "peace" or specific references like "John 3:16"</p>
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto p-6 border-t border-white/10">
          {searchResults.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                Found {searchResults.length} results for "{searchQuery}"
              </h3>
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-lg font-semibold text-amber-400">
                      {result.reference}
                    </div>
                    <div className="text-sm text-gray-400">
                      {result.translation}
                    </div>
                  </div>
                  <div className="text-white leading-relaxed mb-3">
                    "{result.text}"
                  </div>
                  <div className="text-sm text-gray-400">
                    {result.book} {result.chapter}:{result.verse}
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery && !isSearching ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📖</div>
              <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
              <p className="text-gray-400">Try different keywords or check your spelling</p>
            </div>
          ) : !searchQuery ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-white mb-2">Ready to search</h3>
              <p className="text-gray-400">Enter your search terms above to find Bible verses</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
