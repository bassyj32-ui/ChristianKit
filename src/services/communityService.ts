import { supabase } from '../utils/supabase';

export interface CommunityPost {
  id: string;
  author_id: string;
  content: string;
  category: 'prayer' | 'bible_study' | 'worship' | 'testimony' | 'encouragement' | 'general';
  hashtags: string[];
  amens_count: number;
  prayers_count: number;
  loves_count: number;
  is_live: boolean;
  moderation_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  author_name?: string;
  author_avatar?: string;
  author_handle?: string;
  author_profile_image?: string;
  engagement_score?: number;
}

export interface PaginationCursor {
  lastId: string;
  lastCreatedAt: string;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    hasNextPage: boolean;
    nextCursor?: PaginationCursor;
    limit: number;
    total?: number;
  };
}

export interface PostInteraction {
  id: string;
  post_id: string;
  user_id: string;
  interaction_type: 'amen' | 'love';
  created_at: string;
}

export interface Prayer {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  amens_count: number;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
}

// Enhanced getTrendingPosts with cursor-based pagination
export const getTrendingPosts = async (
  options: {
    limit?: number;
    cursor?: PaginationCursor;
    feedType?: 'all' | 'following' | 'trending';
    userId?: string;
    useCache?: boolean;
  } = {}
): Promise<PaginatedResponse<CommunityPost>> => {
  const { limit = 20, cursor, feedType = 'all', userId } = options;
  
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return { data: [], pagination: { hasNextPage: false, limit } };
    }

    console.log('🔍 Fetching posts with enhanced query:', {
      limit,
      cursor: cursor ? `${cursor.lastId}@${cursor.lastCreatedAt}` : 'none',
      feedType,
      userId: userId ? 'provided' : 'none'
    });

    let query = supabase
      .from('community_posts')
      .select(`
        *,
        profiles(
          display_name,
          avatar_url,
          email
        )
      `)
      .eq('moderation_status', 'approved')
      .eq('is_live', true);

    // Apply cursor-based pagination
    if (cursor) {
      query = query
        .lt('created_at', cursor.lastCreatedAt)
        .or(`created_at.lt.${cursor.lastCreatedAt},and(created_at.eq.${cursor.lastCreatedAt},id.lt.${cursor.lastId})`);
    }

    // Apply feed type filtering
    if (feedType === 'trending') {
      // Use engagement score for trending
      query = query.order('amens_count', { ascending: false })
                   .order('loves_count', { ascending: false })
                   .order('prayers_count', { ascending: false })
                   .order('created_at', { ascending: false });
    } else if (feedType === 'following' && userId) {
      // Get posts from followed users
      const { data: followedUsers } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', userId);
      
      if (followedUsers && followedUsers.length > 0) {
        const followingIds = followedUsers.map(f => f.following_id);
        query = query
          .in('author_id', followingIds)
          .order('created_at', { ascending: false });
      } else {
        // No followed users, return empty result
        return { data: [], pagination: { hasNextPage: false, limit } };
      }
    } else {
      // Default: chronological feed
      query = query.order('created_at', { ascending: false });
    }

    // Apply limit
    query = query.limit(limit + 1); // Get one extra to check if there are more

    const { data: posts, error } = await query;

    if (error) {
      console.error('❌ Error fetching posts:', error);
      // Fallback to simple query without profile join
      const { data: fallbackPosts, error: fallbackError } = await supabase
        .from('community_posts')
        .select('*')
        .eq('moderation_status', 'approved')
        .eq('is_live', true)
        .order('created_at', { ascending: false })
        .limit(limit + 1);

      if (fallbackError) {
        console.error('❌ Error fetching posts (fallback):', fallbackError);
        return { data: [], pagination: { hasNextPage: false, limit } };
      }

      const transformedFallback = (fallbackPosts || []).map((post: any) => {
        // Use existing author_name if available, otherwise use email-based name
        const emailName = post.author_name?.includes('@') ? post.author_name.split('@')[0] : post.author_name || 'user';
        const displayName = post.author_name || emailName;
        
        return {
          ...post,
          author_name: displayName,
          author_avatar: post.author_avatar || '👤',
          author_handle: `@${emailName}`
        };
      });

      const hasNextPage = transformedFallback.length > limit;
      const data = hasNextPage ? transformedFallback.slice(0, limit) : transformedFallback;
      const lastPost = data[data.length - 1];

      return {
        data,
        pagination: {
          hasNextPage,
          nextCursor: hasNextPage && lastPost ? {
            lastId: lastPost.id,
            lastCreatedAt: lastPost.created_at,
            limit
          } : undefined,
          limit
        }
      };
    }

    console.log('✅ Fetched posts:', posts?.length || 0, 'posts found');
    
    // Debug: Log first post's profile data
    if (posts && posts.length > 0) {
      console.log('🔍 First post profile data:', {
        author_id: posts[0].author_id,
        profiles: posts[0].profiles,
        hasDisplayName: !!posts[0].profiles?.display_name,
        hasEmail: !!posts[0].profiles?.email,
        rawPost: posts[0]
      });
    }

    // Debug: Log all posts to see what's happening
    console.log('🔍 All posts raw data:', posts?.map(p => ({
      id: p.id,
      author_id: p.author_id,
      profiles: p.profiles,
      resolved_name: p.profiles?.display_name || p.profiles?.email?.split('@')[0] || 'fallback'
    })));

    // Transform data
    const transformedPosts = (posts || []).map((post: any) => {
      // Prioritize display_name from profiles table, then fallback to email name
      const emailName = post.profiles?.email?.split('@')[0] || 'user';
      const displayName = post.profiles?.display_name || emailName;
      
      return {
        ...post,
        author_name: displayName,
        author_avatar: post.profiles?.avatar_url || post.author_avatar || '👤',
        author_handle: `@${emailName}`,
        engagement_score: (post.amens_count || 0) + (post.loves_count || 0) * 2 + (post.prayers_count || 0) * 3
      };
    });

    // Check if there are more posts
    const hasNextPage = transformedPosts.length > limit;
    const data = hasNextPage ? transformedPosts.slice(0, limit) : transformedPosts;
    const lastPost = data[data.length - 1];

    return {
      data,
      pagination: {
        hasNextPage,
        nextCursor: hasNextPage && lastPost ? {
          lastId: lastPost.id,
          lastCreatedAt: lastPost.created_at,
          limit
        } : undefined,
        limit
      }
    };
  } catch (error) {
    console.error('Error fetching trending posts:', error);
    return { data: [], pagination: { hasNextPage: false, limit } };
  }
};

// Create a new post - simplified version
export const createPost = async (postData: {
  content: string;
  category: CommunityPost['category'];
  hashtags?: string[];
}, currentUser?: any): Promise<CommunityPost | null> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return null;
    }
    
    // Use passed user or try to get from Supabase auth
    let user = currentUser;
    if (!user) {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      user = supabaseUser;
    }
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Extract hashtags from content
    const hashtags = postData.hashtags || 
      postData.content.match(/#\w+/g)?.map(tag => tag.slice(1)) || [];

    // Create post
    console.log('🚀 Creating post with data:', {
      author_id: user.id,
      content: postData.content,
      category: postData.category,
      hashtags,
      is_live: true,
      moderation_status: 'approved'
    });

    const { data: post, error } = await supabase
      .from('community_posts')
      .insert({
        author_id: user.id,
        content: postData.content,
        category: postData.category,
        hashtags,
        is_live: true,
        moderation_status: 'approved'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating post:', error);
      throw error;
    }

    console.log('✅ Post created successfully:', post);
    return post;
  } catch (error) {
    console.error('Error creating post:', error);
    return null;
  }
};

// Add interaction (amen or love) - simplified version
export const addPostInteraction = async (
  postId: string, 
  interactionType: 'amen' | 'love',
  currentUser?: any
): Promise<boolean> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return false;
    }
    
    // Use passed user or try to get from Supabase auth
    let user = currentUser;
    if (!user) {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      user = supabaseUser;
    }
    
    if (!user) {
      return false;
    }

    // Check if interaction already exists
    const { data: existing } = await supabase
      .from('post_interactions')
      .select()
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .eq('interaction_type', interactionType)
      .single();

    if (existing) {
      // Remove interaction (toggle off)
      await supabase
        .from('post_interactions')
        .delete()
        .eq('id', existing.id);

      // Decrease count
      const countField = `${interactionType}s_count`;
      const { data: currentPost } = await supabase
        .from('community_posts')
        .select(countField)
        .eq('id', postId)
        .single();
      
      await supabase
        .from('community_posts')
        .update({ [countField]: Math.max(0, ((currentPost as any)?.[countField] || 1) - 1) })
        .eq('id', postId);

      return false;
    } else {
      // Add interaction
      await supabase
        .from('post_interactions')
        .insert({
          post_id: postId,
          user_id: user.id,
          interaction_type: interactionType
        });

      // Increase count
      const countField = `${interactionType}s_count`;
      const { data: currentPost } = await supabase
        .from('community_posts')
        .select(countField)
        .eq('id', postId)
        .single();
      
      await supabase
        .from('community_posts')
        .update({ [countField]: ((currentPost as any)?.[countField] || 0) + 1 })
        .eq('id', postId);

      return true;
    }
  } catch (error) {
    console.error('Error adding interaction:', error);
    return false;
  }
};

// Add prayer (comment) - simplified version
export const addPrayer = async (
  postId: string, 
  content: string, 
  currentUser?: any
): Promise<Prayer | null> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return null;
    }
    
    // Use passed user or try to get from Supabase auth
    let user = currentUser;
    if (!user) {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      user = supabaseUser;
    }
    
    if (!user) {
      return null;
    }

    // Get current prayers count
    const { data: currentPost } = await supabase
      .from('community_posts')
      .select('prayers_count')
      .eq('id', postId)
      .single();

    // Increase prayers count
    await supabase
      .from('community_posts')
      .update({ 
        prayers_count: (currentPost?.prayers_count || 0) + 1 
      })
      .eq('id', postId);

    // Return a mock prayer object
    return {
      id: `prayer_${Date.now()}`,
      post_id: postId,
      author_id: user.id,
      content,
      amens_count: 0,
      created_at: new Date().toISOString(),
      author_name: user.user_metadata?.display_name || 'Anonymous',
      author_avatar: user.user_metadata?.avatar_url || '👤'
    };
  } catch (error) {
    console.error('Error adding prayer:', error);
    return null;
  }
};

// ================================================================
// CACHING STRATEGY
// ================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CommunityCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Generate cache key for posts
  getPostsCacheKey(feedType: string, cursor?: PaginationCursor, userId?: string): string {
    const cursorKey = cursor ? `${cursor.lastId}-${cursor.lastCreatedAt}` : 'initial';
    return `posts-${feedType}-${cursorKey}-${userId || 'anon'}`;
  }
}

const communityCache = new CommunityCache();

// ================================================================
// REAL-TIME SUBSCRIPTIONS
// ================================================================

export interface RealtimeSubscription {
  unsubscribe: () => void;
}

export const subscribeToCommunityUpdates = (
  onNewPost: (post: CommunityPost) => void,
  onPostUpdate: (post: CommunityPost) => void,
  onPostDelete: (postId: string) => void
): RealtimeSubscription | null => {
  if (!supabase) {
    console.warn('Supabase client not initialized for real-time subscriptions');
    return null;
  }

  console.log('🔴 Setting up real-time community subscriptions...');

  const subscription = supabase
    .channel('community_posts')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'community_posts',
        filter: 'moderation_status=eq.approved'
      },
      (payload) => {
        console.log('🆕 New post received:', payload.new);
        const newPost = transformPostData(payload.new);
        onNewPost(newPost);
        
        // Invalidate cache
        communityCache.clear();
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'community_posts'
      },
      (payload) => {
        console.log('🔄 Post updated:', payload.new);
        const updatedPost = transformPostData(payload.new);
        onPostUpdate(updatedPost);
        
        // Invalidate cache
        communityCache.clear();
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'community_posts'
      },
      (payload) => {
        console.log('🗑️ Post deleted:', payload.old);
        onPostDelete(payload.old.id);
        
        // Invalidate cache
        communityCache.clear();
      }
    )
    .subscribe((status) => {
      console.log('📡 Real-time subscription status:', status);
    });

  return {
    unsubscribe: () => {
      console.log('🔴 Unsubscribing from community updates...');
      subscription.unsubscribe();
    }
  };
};

// Helper function to transform post data
const transformPostData = (post: any): CommunityPost => ({
  ...post,
  author_name: post.author_name || 'Anonymous',
  author_avatar: post.author_avatar || '👤',
  author_handle: `@user${post.author_id?.slice(0, 8) || 'user'}`,
  engagement_score: (post.amens_count || 0) + (post.loves_count || 0) * 2 + (post.prayers_count || 0) * 3
});

// ================================================================
// ENHANCED SEARCH FUNCTIONALITY
// ================================================================

export const searchPosts = async (
  query: string,
  options: {
    limit?: number;
    category?: string;
    userId?: string;
  } = {}
): Promise<PaginatedResponse<CommunityPost>> => {
  const { limit = 20, category, userId } = options;
  
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return { data: [], pagination: { hasNextPage: false, limit } };
    }

    console.log('🔍 Searching posts with query:', query);

    let searchQuery = supabase
      .from('community_posts')
      .select(`
        *,
        profiles!inner(
          display_name,
          avatar_url
        )
      `)
      .eq('moderation_status', 'approved')
      .eq('is_live', true)
      .textSearch('content', query)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (category) {
      searchQuery = searchQuery.eq('category', category);
    }

    if (userId) {
      searchQuery = searchQuery.eq('author_id', userId);
    }

    const { data: posts, error } = await searchQuery;

    if (error) {
      console.error('❌ Search error:', error);
      return { data: [], pagination: { hasNextPage: false, limit } };
    }

    const transformedPosts = (posts || []).map(transformPostData);

    return {
      data: transformedPosts,
      pagination: { hasNextPage: false, limit }
    };
  } catch (error) {
    console.error('Error searching posts:', error);
    return { data: [], pagination: { hasNextPage: false, limit } };
  }
};

// ================================================================
// TRENDING HASHTAGS
// ================================================================

export const getTrendingHashtags = async (limit: number = 10): Promise<Array<{tag: string, count: number}>> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return [];
    }

    // Get posts from last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: posts, error } = await supabase
      .from('community_posts')
      .select('hashtags')
      .eq('moderation_status', 'approved')
      .eq('is_live', true)
      .gte('created_at', yesterday);

    if (error) {
      console.error('❌ Error fetching hashtags:', error);
      return [];
    }

    // Count hashtags
    const hashtagCounts: { [key: string]: number } = {};
    posts?.forEach(post => {
      post.hashtags?.forEach((tag: string) => {
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
      });
    });

    // Sort by count and return top hashtags
    return Object.entries(hashtagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting trending hashtags:', error);
    return [];
  }
};

// ================================================================
// ENHANCED CACHING FOR POSTS
// ================================================================

export const getTrendingPostsWithCache = async (
  options: {
    limit?: number;
    cursor?: PaginationCursor;
    feedType?: 'all' | 'following' | 'trending';
    userId?: string;
    useCache?: boolean;
  } = {}
): Promise<PaginatedResponse<CommunityPost>> => {
  const { useCache = true, ...otherOptions } = options;
  
  // Generate cache key
  const cacheKey = communityCache.getPostsCacheKey(
    otherOptions.feedType || 'all',
    otherOptions.cursor,
    otherOptions.userId
  );

  // Try to get from cache first
  if (useCache) {
    const cachedData = communityCache.get<PaginatedResponse<CommunityPost>>(cacheKey);
    if (cachedData) {
      console.log('📦 Returning cached posts data');
      return cachedData;
    }
  }

  // Fetch from database
  const result = await getTrendingPosts(otherOptions);
  
  // Cache the result
  if (useCache && result.data.length > 0) {
    communityCache.set(cacheKey, result, 2 * 60 * 1000); // 2 minutes cache
  }

  return result;
};

// ================================================================
// USER PROFILE & FOLLOW MANAGEMENT
// ================================================================

export const createUserProfile = async (user: any): Promise<boolean> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return false;
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Anonymous',
        avatar_url: user.user_metadata?.avatar_url || '👤',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating user profile:', error);
      return false;
    }

    console.log('✅ User profile created:', data);
    return true;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return false;
  }
};

export const followUser = async (userId: string, currentUser?: any): Promise<boolean> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return false;
    }
    
    let user = currentUser;
    if (!user) {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      user = supabaseUser;
    }
    
    if (!user || user.id === userId) {
      return false;
    }

    // Check if already following
    const { data: existing } = await supabase
      .from('user_follows')
      .select()
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .single();

    if (existing) {
      // Unfollow
      await supabase
        .from('user_follows')
        .delete()
        .eq('id', existing.id);
      return false;
    } else {
      // Follow
      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: user.id,
          following_id: userId
        });

      if (error) {
        console.error('❌ Error following user:', error);
        return false;
      }
      return true;
    }
  } catch (error) {
    console.error('Error following user:', error);
    return false;
  }
};

export const getUserProfile = async (userId: string): Promise<any> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Error fetching user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const getFollowedUsers = async (currentUser?: any): Promise<string[]> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return [];
    }
    
    let user = currentUser;
    if (!user) {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      user = supabaseUser;
    }
    
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', user.id);

    if (error) {
      console.error('❌ Error fetching followed users:', error);
      return [];
    }

    return data?.map(f => f.following_id) || [];
  } catch (error) {
    console.error('Error fetching followed users:', error);
    return [];
  }
};

// ================================================================
// DATABASE CONNECTION TEST
// ================================================================

export const testDatabaseConnection = async (): Promise<{ success: boolean; message: string; details?: any }> => {
  try {
    if (!supabase) {
      return { success: false, message: 'Supabase client not initialized' }
    }
    
    console.log('🔧 Testing database connection...')
    
    // Test 1: Check if we can connect to the database
    const { data: testData, error: testError } = await supabase
      .from('community_posts')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ Database connection test failed:', testError)
      return { 
        success: false, 
        message: `Database connection failed: ${testError.message}`,
        details: testError
      }
    }
    
    console.log('✅ Database connection successful')
    
    // Test 2: Check table structure
    const { data: posts, error: postsError } = await supabase
      .from('community_posts')
      .select('*')
      .limit(1)
    
    if (postsError) {
      console.error('❌ Community posts table query failed:', postsError)
      return { 
        success: false, 
        message: `Community posts table query failed: ${postsError.message}`,
        details: postsError
      }
    }
    
    console.log('✅ Community posts table accessible, structure:', posts)
    
    return { 
      success: true, 
      message: 'Database connection and table structure are working correctly',
      details: { postsCount: posts?.length || 0 }
    }
    
  } catch (error) {
    console.error('❌ Database test error:', error)
    return { 
      success: false, 
      message: `Database test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    }
  }
}