import React, { useState, useEffect, useRef } from 'react';
import { searchUsers, followUser, unfollowUser, isFollowing } from '../services/userProfileService';
import { useSupabaseAuth } from './SupabaseAuthProvider';

interface UserSearchProps {
  onUserSelect?: (userId: string) => void;
  className?: string;
}

interface SearchUser {
  id: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  posts_count: number;
  amens_received: number;
  followers_count: number;
}

export const UserSearch: React.FC<UserSearchProps> = ({ onUserSelect, className = '' }) => {
  const { user } = useSupabaseAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch();
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const performSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const searchResults = await searchUsers(query.trim(), 8);
      
      // Filter out current user
      const filteredResults = searchResults.filter(result => result.id !== user?.id);
      
      setResults(filteredResults);
      setIsOpen(true);

      // Check following status for each user
      if (user?.id) {
        const statusPromises = filteredResults.map(async (result) => {
          const following = await isFollowing(user.id, result.id);
          return { userId: result.id, following };
        });

        const statuses = await Promise.all(statusPromises);
        const statusMap = statuses.reduce((acc, { userId, following }) => {
          acc[userId] = following;
          return acc;
        }, {} as Record<string, boolean>);

        setFollowingStatus(statusMap);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowToggle = async (userId: string, currentlyFollowing: boolean) => {
    if (!user?.id) return;

    try {
      if (currentlyFollowing) {
        await unfollowUser(user.id, userId);
      } else {
        await followUser(user.id, userId);
      }

      setFollowingStatus(prev => ({
        ...prev,
        [userId]: !currentlyFollowing
      }));
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleUserClick = (userId: string) => {
    onUserSelect?.(userId);
    setIsOpen(false);
    setQuery('');
    inputRef.current?.blur();
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Search believers..."
          className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <svg className="w-5 h-5 text-slate-400 hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-slate-400 text-sm">Searching...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-xl">🔍</span>
              </div>
              <p className="text-slate-400 text-sm">No believers found</p>
              <p className="text-slate-500 text-xs mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="py-2">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors duration-200 group"
                >
                  <div
                    className="flex items-center space-x-3 flex-1 cursor-pointer"
                    onClick={() => handleUserClick(result.id)}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 rounded-full flex items-center justify-center text-black text-sm font-semibold flex-shrink-0">
                      {result.avatar_url ? (
                        <img 
                          src={result.avatar_url} 
                          alt={result.display_name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <span>{result.display_name?.[0] || '👤'}</span>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-white text-sm group-hover:text-yellow-300 transition-colors truncate">
                          {result.display_name}
                        </h4>
                        {result.posts_count > 10 && (
                          <div className="px-2 py-0.5 bg-yellow-400/20 rounded-full">
                            <span className="text-xs text-yellow-300 font-medium">Active</span>
                          </div>
                        )}
                      </div>
                      {result.bio && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{result.bio}</p>
                      )}
                      <div className="flex items-center space-x-3 mt-1 text-xs text-slate-500">
                        <span>{result.posts_count} posts</span>
                        <span>•</span>
                        <span>{result.followers_count} followers</span>
                        <span>•</span>
                        <span>{result.amens_received} amens</span>
                      </div>
                    </div>
                  </div>

                  {/* Follow Button */}
                  {user?.id && user.id !== result.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollowToggle(result.id, followingStatus[result.id] || false);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                        followingStatus[result.id]
                          ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                          : 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:from-amber-500 hover:to-yellow-400'
                      }`}
                    >
                      {followingStatus[result.id] ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSearch;

