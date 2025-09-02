import { supabase } from '../utils/supabase';

export interface SearchFilters {
  category?: string;
  authorId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hashtag?: string;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'date' | 'popularity';
}

export interface SearchResult<T> {
  data: T[];
  totalCount: number;
  hasMore: boolean;
  searchTime: number;
}

export interface PostSearchResult {
  id: string;
  content: string;
  category: string;
  hashtags: string[];
  authorId: string;
  authorName: string;
  createdAt: string;
  searchRank: number;
}

export interface UserSearchResult {
  id: string;
  displayName: string;
  bio: string;
  location: string;
  avatarUrl: string;
  searchRank: number;
}

export interface SearchSuggestion {
  suggestion: string;
  type: 'category' | 'hashtag';
  count: number;
}

export class SearchService {
  private static instance: SearchService;
  private searchHistory: string[] = [];
  private searchCache: Map<string, any> = new Map();

  private constructor() {
    this.loadSearchHistory();
  }

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  /**
   * Search posts with advanced filters
   */
  public async searchPosts(
    query: string = '',
    filters: SearchFilters = {},
    options: SearchOptions = {}
  ): Promise<SearchResult<PostSearchResult>> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.rpc('search_posts', {
        search_query: query,
        category_filter: filters.category || null,
        author_filter: filters.authorId || null,
        date_from: filters.dateFrom?.toISOString() || null,
        date_to: filters.dateTo?.toISOString() || null,
        hashtag_filter: filters.hashtag || null,
        limit_count: options.limit || 20,
        offset_count: options.offset || 0
      });

      if (error) throw error;

      // Add to search history
      if (query.trim()) {
        this.addToSearchHistory(query);
      }

      const result: SearchResult<PostSearchResult> = {
        data: data || [],
        totalCount: (data || []).length,
        hasMore: (data || []).length === (options.limit || 20),
        searchTime: Date.now() - startTime
      };

      return result;
    } catch (error) {
      console.error('Post search failed:', error);
      throw error;
    }
  }

  /**
   * Search users
   */
  public async searchUsers(
    query: string = '',
    locationFilter?: string,
    options: SearchOptions = {}
  ): Promise<SearchResult<UserSearchResult>> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.rpc('search_users', {
        search_query: query,
        location_filter: locationFilter || null,
        limit_count: options.limit || 20,
        offset_count: options.offset || 0
      });

      if (error) throw error;

      const result: SearchResult<UserSearchResult> = {
        data: data || [],
        totalCount: (data || []).length,
        hasMore: (data || []).length === (options.limit || 20),
        searchTime: Date.now() - startTime
      };

      return result;
    } catch (error) {
      console.error('User search failed:', error);
      throw error;
    }
  }

  /**
   * Get search suggestions for autocomplete
   */
  public async getSearchSuggestions(
    partialQuery: string,
    type: 'posts' | 'hashtags' = 'posts'
  ): Promise<SearchSuggestion[]> {
    try {
      const { data, error } = await supabase.rpc('get_search_suggestions', {
        partial_query: partialQuery,
        suggestion_type: type === 'posts' ? 'posts' : 'hashtags'
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Search suggestions failed:', error);
      return [];
    }
  }

  /**
   * Get trending hashtags
   */
  public async getTrendingHashtags(limit: number = 10): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('hashtags')
        .eq('moderation_status', 'approved')
        .eq('is_live', true)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const hashtagCounts = new Map<string, number>();
      
      data?.forEach(post => {
        post.hashtags?.forEach(hashtag => {
          hashtagCounts.set(hashtag, (hashtagCounts.get(hashtag) || 0) + 1);
        });
      });

      return Array.from(hashtagCounts.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([hashtag]) => hashtag);
    } catch (error) {
      console.error('Trending hashtags failed:', error);
      return [];
    }
  }

  /**
   * Add query to search history
   */
  private addToSearchHistory(query: string): void {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) return;

    // Remove if exists, add to front
    this.searchHistory = this.searchHistory.filter(q => q !== trimmedQuery);
    this.searchHistory.unshift(trimmedQuery);

    // Keep only last 10 searches
    this.searchHistory = this.searchHistory.slice(0, 10);
    
    // Save to localStorage
    localStorage.setItem('christiankit_search_history', JSON.stringify(this.searchHistory));
  }

  /**
   * Load search history from localStorage
   */
  private loadSearchHistory(): void {
    try {
      const saved = localStorage.getItem('christiankit_search_history');
      if (saved) {
        this.searchHistory = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }

  /**
   * Get search history
   */
  public getSearchHistory(): string[] {
    return [...this.searchHistory];
  }

  /**
   * Clear search history
   */
  public clearSearchHistory(): void {
    this.searchHistory = [];
    localStorage.removeItem('christiankit_search_history');
  }

  /**
   * Get search statistics
   */
  public getSearchStats(): { totalSearches: number; averageTime: number } {
    return {
      totalSearches: this.searchHistory.length,
      averageTime: 0 // Could be enhanced with actual timing data
    };
  }
}

// Export singleton instance
export const searchService = SearchService.getInstance();