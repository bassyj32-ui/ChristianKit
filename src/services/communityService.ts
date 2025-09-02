import { supabase } from '../utils/supabase';
import { rateLimitService } from './rateLimitService';
import { contentModerationService } from './contentModerationService';
import { paginationService } from './paginationService';
import { enhancedCacheService } from './enhancedCacheService';

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

// Get trending posts with author info and caching
export const getTrendingPosts = async (
  options: {
    limit?: number;
    cursor?: string;
    useCache?: boolean;
  } = {}
): Promise<{
  data: CommunityPost[];
  pagination: {
    hasNextPage: boolean;
    nextCursor?: string;
    limit: number;
  };
}> => {
  const { limit = 20, cursor, useCache = true } = options;
  
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return { data: [], pagination: { hasNextPage: false, limit } };
    }

    const cacheKey = `trending_posts:${limit}:${cursor || 'first'}`;
    
    if (useCache) {
      const cached = await enhancedCacheService.get<{
        data: CommunityPost[];
        pagination: any;
      }>(cacheKey, 'trending_posts');
      
      if (cached) {
        return cached;
      }
    }

    // Build query with cursor pagination
    let query = supabase
      .from('posts')
      .select(`
        *,
        user_profiles!posts_author_id_fkey(
          display_name,
          avatar_url,
          handle
        )
      `)
      .eq('moderation_status', 'approved')
      .eq('is_live', true);

    const paginationOptions = paginationService.createCursorOptions({
      limit,
      cursor,
      sortBy: 'created_at',
      sortOrder: 'desc'
    });

    query = paginationService.buildCursorSupabaseQuery(query, paginationOptions);
    
    const { data: posts, error } = await query;

    if (error) throw error;

    // Process results with pagination
    const { data: processedData, hasNextPage } = paginationService.processCursorResults(posts || [], limit);

    // Transform data
    const transformedPosts = (processedData || []).map((post: any) => ({
      ...post,
      author_name: post.user_profiles?.display_name || 'Anonymous',
      author_avatar: post.user_profiles?.avatar_url || '👤',
      author_handle: post.user_profiles?.handle || `@user${post.author_id?.slice(0, 8) || 'user'}`
    }));

    // Calculate trending score and sort
    const trendingPosts = transformedPosts
      .map((post: any) => ({
        ...post,
        trendingScore: (post.amens_count || 0) * 3 + (post.prayers_count || 0) * 2 + (post.loves_count || 0)
      }))
      .sort((a: any, b: any) => (b.trendingScore || 0) - (a.trendingScore || 0));

    // Create pagination result
    const result = paginationService.createInfiniteScrollResult(
      trendingPosts,
      paginationOptions,
      hasNextPage
    );

    // Cache the result
    if (useCache) {
      await enhancedCacheService.set(cacheKey, result, 'trending_posts');
    }

    return result;
  } catch (error) {
    console.error('Error fetching trending posts:', error);
    return { data: [], pagination: { hasNextPage: false, limit } };
  }
};

// Create a new post with rate limiting and content moderation
export const createPost = async (postData: {
  content: string;
  category: CommunityPost['category'];
  hashtags?: string[];
}, currentUser?: any): Promise<{
  success: boolean;
  post?: CommunityPost;
  error?: string;
  moderationResult?: any;
}> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return { success: false, error: 'Database not available' };
    }
    
    // Use passed user or try to get from Supabase auth
    let user = currentUser;
    if (!user) {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      user = supabaseUser;
    }
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Check rate limiting
    const rateLimitCheck = await rateLimitService.checkRateLimit(user.id, 'POST_CREATION');
    if (!rateLimitCheck.allowed) {
      return { 
        success: false, 
        error: `Rate limit exceeded. Please wait ${Math.ceil((rateLimitCheck.retryAfter || 0) / 1000)} seconds.` 
      };
    }

    // Content moderation
    const moderationResult = await contentModerationService.moderateContent(
      postData.content,
      user.id,
      postData.category
    );

    if (!moderationResult.isApproved) {
      return {
        success: false,
        error: moderationResult.reason || 'Content was not approved',
        moderationResult
      };
    }

    // Extract hashtags from content
    const hashtags = postData.hashtags || 
      postData.content.match(/#\w+/g)?.map(tag => tag.slice(1)) || [];

    // Create post with moderation status
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        author_id: user.id,
        content: postData.content,
        category: postData.category,
        hashtags,
        is_live: moderationResult.isApproved && !moderationResult.requiresReview,
        moderation_status: moderationResult.isApproved ? 'approved' : 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    // Record rate limit action
    await rateLimitService.recordAction(user.id, 'POST_CREATION');

    // Invalidate related caches
    await enhancedCacheService.invalidate('trending_posts');
    await enhancedCacheService.invalidate('posts');

    return {
      success: true,
      post,
      moderationResult
    };
  } catch (error) {
    console.error('Error creating post:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

// Get posts with pagination and caching
export const getPosts = async (
  options: {
    page?: number;
    limit?: number;
    category?: string;
    authorId?: string;
    useCache?: boolean;
  } = {}
): Promise<{
  data: CommunityPost[];
  pagination: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    totalCount?: number;
    currentPage: number;
    totalPages?: number;
    limit: number;
  };
}> => {
  const { page = 1, limit = 20, category, authorId, useCache = true } = options;
  
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return { 
        data: [], 
        pagination: { 
          hasNextPage: false, 
          hasPreviousPage: false, 
          currentPage: page, 
          limit 
        } 
      };
    }

    const cacheKey = `posts:${page}:${limit}:${category || 'all'}:${authorId || 'all'}`;
    
    if (useCache) {
      const cached = await enhancedCacheService.get<{
        data: CommunityPost[];
        pagination: any;
      }>(cacheKey, 'posts');
      
      if (cached) {
        return cached;
      }
    }

    // Build query
    let query = supabase
      .from('posts')
      .select(`
        *,
        user_profiles!posts_author_id_fkey(
          display_name,
          avatar_url,
          handle
        )
      `)
      .eq('moderation_status', 'approved')
      .eq('is_live', true);

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    if (authorId) {
      query = query.eq('author_id', authorId);
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('moderation_status', 'approved')
      .eq('is_live', true)
      .eq(category ? 'category' : 'id', category || 'id');

    // Apply pagination
    const paginationOptions = paginationService.createOptions({
      page,
      limit,
      sortBy: 'created_at',
      sortOrder: 'desc'
    });

    query = paginationService.buildSupabaseQuery(query, paginationOptions);
    
    const { data: posts, error } = await query;

    if (error) throw error;

    // Transform data
    const transformedPosts = (posts || []).map((post: any) => ({
      ...post,
      author_name: post.user_profiles?.display_name || 'Anonymous',
      author_avatar: post.user_profiles?.avatar_url || '👤',
      author_handle: post.user_profiles?.handle || `@user${post.author_id?.slice(0, 8) || 'user'}`
    }));

    // Create pagination result
    const result = paginationService.createPaginationResult(
      transformedPosts,
      paginationOptions,
      count || 0
    );

    // Cache the result
    if (useCache) {
      await enhancedCacheService.set(cacheKey, result, 'posts');
    }

    return result;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return { 
      data: [], 
      pagination: { 
        hasNextPage: false, 
        hasPreviousPage: false, 
        currentPage: page, 
        limit 
      } 
    };
  }
};

// Add interaction (amen or love) with rate limiting
export const addPostInteraction = async (
  postId: string, 
  interactionType: 'amen' | 'love',
  currentUser?: any
): Promise<{
  success: boolean;
  added: boolean;
  error?: string;
}> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return { success: false, added: false, error: 'Database not available' };
    }
    
    // Use passed user or try to get from Supabase auth
    let user = currentUser;
    if (!user) {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      user = supabaseUser;
    }
    
    if (!user) {
      return { success: false, added: false, error: 'User not authenticated' };
    }

    // Check rate limiting
    const rateLimitCheck = await rateLimitService.checkRateLimit(user.id, 'INTERACTION');
    if (!rateLimitCheck.allowed) {
      return { 
        success: false, 
        added: false,
        error: `Rate limit exceeded. Please wait ${Math.ceil((rateLimitCheck.retryAfter || 0) / 1000)} seconds.` 
      };
    }

    // Check if interaction already exists
    const { data: existing } = await supabase
      .from('post_interactions')
      .select()
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .eq('interaction_type', interactionType)
      .single();

    let added = false;

    if (existing) {
      // Remove interaction (toggle off)
      await supabase
        .from('post_interactions')
        .delete()
        .eq('id', existing.id);

      // Decrease count
      const countField = `${interactionType}s_count`;
      await supabase
        .from('posts')
        .update({ [countField]: Math.max(0, (existing[countField] || 1) - 1) })
        .eq('id', postId);

      added = false;
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
      await supabase
        .from('posts')
        .update({ [countField]: (existing?.[countField] || 0) + 1 })
        .eq('id', postId);

      added = true;
    }

    // Record rate limit action
    await rateLimitService.recordAction(user.id, 'INTERACTION');

    // Invalidate related caches
    await enhancedCacheService.invalidate('trending_posts');
    await enhancedCacheService.invalidate('posts');
    await enhancedCacheService.invalidate(`post_${postId}`);

    return { success: true, added };
  } catch (error) {
    console.error('Error adding interaction:', error);
    return { 
      success: false, 
      added: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

// Add prayer (comment) with rate limiting and moderation
export const addPrayer = async (
  postId: string, 
  content: string, 
  currentUser?: any
): Promise<{
  success: boolean;
  prayer?: Prayer;
  error?: string;
}> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return { success: false, error: 'Database not available' };
    }
    
    // Use passed user or try to get from Supabase auth
    let user = currentUser;
    if (!user) {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      user = supabaseUser;
    }
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Check rate limiting
    const rateLimitCheck = await rateLimitService.checkRateLimit(user.id, 'PRAYER');
    if (!rateLimitCheck.allowed) {
      return { 
        success: false, 
        error: `Rate limit exceeded. Please wait ${Math.ceil((rateLimitCheck.retryAfter || 0) / 1000)} seconds.` 
      };
    }

    // Content moderation for prayer
    const moderationResult = await contentModerationService.moderateContent(
      content,
      user.id,
      'prayer'
    );

    if (!moderationResult.isApproved) {
      return {
        success: false,
        error: moderationResult.reason || 'Prayer content was not approved'
      };
    }

    const { data: prayer, error } = await supabase
      .from('prayers')
      .insert({
        post_id: postId,
        author_id: user.id,
        content
      })
      .select()
      .single();

    if (error) throw error;

    // Increase prayers count on post
    await supabase
      .from('posts')
      .update({ 
        prayers_count: (await supabase
          .from('posts')
          .select('prayers_count')
          .eq('id', postId)
          .single()
        ).data?.prayers_count + 1 
      })
      .eq('id', postId);

    // Record rate limit action
    await rateLimitService.recordAction(user.id, 'PRAYER');

    // Invalidate related caches
    await enhancedCacheService.invalidate('trending_posts');
    await enhancedCacheService.invalidate(`post_${postId}`);

    return { success: true, prayer };
  } catch (error) {
    console.error('Error adding prayer:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

// Get prayers for a post with caching
export const getPostPrayers = async (
  postId: string,
  useCache: boolean = true
): Promise<Prayer[]> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return [];
    }

    const cacheKey = `post_prayers:${postId}`;
    
    if (useCache) {
      const cached = await enhancedCacheService.get<Prayer[]>(cacheKey, 'post_interactions');
      if (cached) {
        return cached;
      }
    }
    
    const { data: prayers, error } = await supabase
      .from('prayers')
      .select(`
        *,
        user_profiles!prayers_author_id_fkey(
          display_name,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const transformedPrayers = (prayers || []).map((prayer: any) => ({
      ...prayer,
      author_name: prayer.user_profiles?.display_name || 'Anonymous',
      author_avatar: prayer.user_profiles?.avatar_url || '👤'
    }));

    // Cache the result
    if (useCache) {
      await enhancedCacheService.set(cacheKey, transformedPrayers, 'post_interactions');
    }

    return transformedPrayers;
  } catch (error) {
    console.error('Error fetching prayers:', error);
    return [];
  }
};

// Get trending hashtags with caching
export const getTrendingHashtags = async (
  limit: number = 20,
  useCache: boolean = true
): Promise<Array<{tag: string, post_count: number}>> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return [];
    }

    const cacheKey = `trending_hashtags:${limit}`;
    
    if (useCache) {
      const cached = await enhancedCacheService.get<Array<{tag: string, post_count: number}>>(
        cacheKey, 
        'trending_posts'
      );
      if (cached) {
        return cached;
      }
    }
    
    const { data: hashtags, error } = await supabase
      .from('hashtags')
      .select('tag, post_count')
      .order('post_count', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const result = hashtags || [];

    // Cache the result
    if (useCache) {
      await enhancedCacheService.set(cacheKey, result, 'trending_posts');
    }

    return result;
  } catch (error) {
    console.error('Error fetching trending hashtags:', error);
    return [];
  }
};

// Real-time subscription for posts
export const subscribeToPosts = (callback: (payload: any) => void) => {
  if (!supabase) {
    console.warn('Supabase client not initialized');
    return null;
  }
  
  return supabase
    .channel('posts_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'posts' }, 
      (payload) => {
        // Invalidate related caches when posts change
        enhancedCacheService.invalidate('trending_posts');
        enhancedCacheService.invalidate('posts');
        callback(payload);
      }
    )
    .subscribe();
};

// Real-time subscription for interactions
export const subscribeToInteractions = (callback: (payload: any) => void) => {
  if (!supabase) {
    console.warn('Supabase client not initialized');
    return null;
  }
  
  return supabase
    .channel('interactions_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'post_interactions' }, 
      (payload) => {
        // Invalidate related caches when interactions change
        enhancedCacheService.invalidate('trending_posts');
        enhancedCacheService.invalidate('posts');
        callback(payload);
      }
    )
    .subscribe();
};

// Real-time subscription for prayers
export const subscribeToPrayers = (callback: (payload: any) => void) => {
  if (!supabase) {
    console.warn('Supabase client not initialized');
    return null;
  }
  
  return supabase
    .channel('prayers_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'prayers' }, 
      (payload) => {
        // Invalidate related caches when prayers change
        enhancedCacheService.invalidate('trending_posts');
        const postId = (payload.new as any)?.post_id || (payload.old as any)?.post_id;
        if (postId) {
          enhancedCacheService.invalidate(`post_${postId}`);
        }
        callback(payload);
      }
    )
    .subscribe();
};

// Test database connection and table structure
export const testDatabaseConnection = async (): Promise<{ success: boolean; message: string; details?: any }> => {
  try {
    if (!supabase) {
      return { success: false, message: 'Supabase client not initialized' }
    }
    
    console.log('🔧 Testing database connection...')
    
    // Test 1: Check if we can connect to the database
    const { data: testData, error: testError } = await supabase
      .from('posts')
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
      .from('posts')
      .select('*')
      .limit(1)
    
    if (postsError) {
      console.error('❌ Posts table query failed:', postsError)
      return { 
        success: false, 
        message: `Posts table query failed: ${postsError.message}`,
        details: postsError
      }
    }
    
    console.log('✅ Posts table accessible, structure:', posts)
    
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

// Get moderation queue for admin review
export const getModerationQueue = async (
  options: {
    page?: number;
    limit?: number;
    status?: 'pending' | 'rejected';
  } = {}
): Promise<{
  data: CommunityPost[];
  pagination: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    totalCount?: number;
    currentPage: number;
    totalPages?: number;
    limit: number;
  };
}> => {
  const { page = 1, limit = 20, status = 'pending' } = options;
  
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return { 
        data: [], 
        pagination: { 
          hasNextPage: false, 
          hasPreviousPage: false, 
          currentPage: page, 
          limit 
        } 
      };
    }

    // Build query for moderation queue
    let query = supabase
      .from('posts')
      .select(`
        *,
        user_profiles!posts_author_id_fkey(
          display_name,
          avatar_url,
          handle
        )
      `)
      .eq('moderation_status', status);

    // Get total count
    const { count } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('moderation_status', status);

    // Apply pagination
    const paginationOptions = paginationService.createOptions({
      page,
      limit,
      sortBy: 'created_at',
      sortOrder: 'desc'
    });

    query = paginationService.buildSupabaseQuery(query, paginationOptions);
    
    const { data: posts, error } = await query;

    if (error) throw error;

    // Transform data
    const transformedPosts = (posts || []).map((post: any) => ({
      ...post,
      author_name: post.user_profiles?.display_name || 'Anonymous',
      author_avatar: post.user_profiles?.avatar_url || '👤',
      author_handle: post.user_profiles?.handle || `@user${post.author_id?.slice(0, 8) || 'user'}`
    }));

    // Create pagination result
    const result = paginationService.createPaginationResult(
      transformedPosts,
      paginationOptions,
      count || 0
    );

    return result;
  } catch (error) {
    console.error('Error fetching moderation queue:', error);
    return { 
      data: [], 
      pagination: { 
        hasNextPage: false, 
        hasPreviousPage: false, 
        currentPage: page, 
        limit 
      } 
    };
  }
};

// Approve or reject post (admin function)
export const moderatePost = async (
  postId: string,
  action: 'approve' | 'reject',
  reason?: string,
  currentUser?: any
): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return { success: false, error: 'Database not available' };
    }
    
    // Use passed user or try to get from Supabase auth
    let user = currentUser;
    if (!user) {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      user = supabaseUser;
    }
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // TODO: Check if user has admin privileges
    // This would require checking user roles/permissions

    const { error } = await supabase
      .from('posts')
      .update({
        moderation_status: action === 'approve' ? 'approved' : 'rejected',
        is_live: action === 'approve',
        rejected_reason: action === 'reject' ? reason : null
      })
      .eq('id', postId);

    if (error) throw error;

    // Invalidate related caches
    await enhancedCacheService.invalidate('trending_posts');
    await enhancedCacheService.invalidate('posts');
    await enhancedCacheService.invalidate(`post_${postId}`);

    return { success: true };
  } catch (error) {
    console.error('Error moderating post:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};
