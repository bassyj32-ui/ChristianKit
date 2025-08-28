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

// Get trending posts with author info
export const getTrendingPosts = async (limit: number = 50): Promise<CommunityPost[]> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return [];
    }
    
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Calculate trending score and sort
    return (posts || [])
      .map((post: any) => ({
        ...post,
        author_name: post.author_name || 'Anonymous',
        author_avatar: post.author_avatar || '👤',
        author_handle: post.author_handle || `@user${post.author_id?.slice(0, 8) || 'user'}`
      }))
      .map((post: any) => ({
        ...post,
        trendingScore: (post.amens_count || 0) * 3 + (post.prayers_count || 0) * 2 + (post.loves_count || 0)
      }))
      .sort((a: any, b: any) => (b.trendingScore || 0) - (a.trendingScore || 0));
  } catch (error) {
    console.error('Error fetching trending posts:', error);
    return [];
  }
};

// Create a new post
export const createPost = async (postData: {
  content: string;
  category: CommunityPost['category'];
  hashtags?: string[];
}): Promise<CommunityPost | null> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return null;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Extract hashtags from content
    const hashtags = postData.hashtags || 
      postData.content.match(/#\w+/g)?.map(tag => tag.slice(1)) || [];

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        author_id: user.id,
        content: postData.content,
        category: postData.category,
        hashtags,
        is_live: false
      })
      .select()
      .single();

    if (error) throw error;

    return post;
  } catch (error) {
    console.error('Error creating post:', error);
    return null;
  }
};

// Add interaction (amen or love)
export const addPostInteraction = async (
  postId: string, 
  interactionType: 'amen' | 'love'
): Promise<boolean> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return false;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

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
        .from('posts')
        .update({ [countField]: (existing[countField] || 1) - 1 })
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
        .from('posts')
        .update({ [countField]: (existing?.[countField] || 0) + 1 })
        .eq('id', postId);

      return true;
    }
  } catch (error) {
    console.error('Error adding interaction:', error);
    return false;
  }
};

// Add prayer (comment)
export const addPrayer = async (postId: string, content: string): Promise<Prayer | null> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return null;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

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
      .update({ prayers_count: (prayer.prayers_count || 0) + 1 })
      .eq('id', postId);

    return prayer;
  } catch (error) {
    console.error('Error adding prayer:', error);
    return null;
  }
};

// Get prayers for a post
export const getPostPrayers = async (postId: string): Promise<Prayer[]> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return [];
    }
    
    const { data: prayers, error } = await supabase
      .from('prayers')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (prayers || []).map((prayer: any) => ({
      ...prayer,
      author_name: prayer.author_name || 'Anonymous',
      author_avatar: prayer.author_avatar || '👤'
    }));
  } catch (error) {
    console.error('Error fetching prayers:', error);
    return [];
  }
};

// Get trending hashtags
export const getTrendingHashtags = async (limit: number = 20): Promise<Array<{tag: string, post_count: number}>> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return [];
    }
    
    const { data: hashtags, error } = await supabase
      .from('hashtags')
      .select('tag, post_count')
      .order('post_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return hashtags || [];
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
      callback
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
      callback
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
      callback
    )
    .subscribe();
};
