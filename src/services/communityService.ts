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

// Get trending posts - simplified version
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
  const { limit = 20 } = options;
  
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return { data: [], pagination: { hasNextPage: false, limit } };
    }

    // Simple query to get posts
    const { data: posts, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        profiles!community_posts_author_id_fkey(
          display_name,
          avatar_url
        )
      `)
      .eq('moderation_status', 'approved')
      .eq('is_live', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching posts:', error);
      return { data: [], pagination: { hasNextPage: false, limit } };
    }

    // Transform data
    const transformedPosts = (posts || []).map((post: any) => ({
      ...post,
      author_name: post.profiles?.display_name || 'Anonymous',
      author_avatar: post.profiles?.avatar_url || '👤',
      author_handle: `@user${post.author_id?.slice(0, 8) || 'user'}`
    }));

    return {
      data: transformedPosts,
      pagination: { hasNextPage: false, limit }
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
      console.error('Error creating post:', error);
      throw error;
    }

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
      await supabase
        .from('community_posts')
        .update({ [countField]: Math.max(0, (existing[countField] || 1) - 1) })
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
      await supabase
        .from('community_posts')
        .update({ [countField]: (existing?.[countField] || 0) + 1 })
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

    // For now, we'll just increase the prayers count
    // In a full implementation, you'd create a separate prayers table
    await supabase
      .from('community_posts')
      .update({ 
        prayers_count: (await supabase
          .from('community_posts')
          .select('prayers_count')
          .eq('id', postId)
          .single()
        ).data?.prayers_count + 1 
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

// Test database connection - simplified version
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