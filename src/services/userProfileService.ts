import { supabase } from '../utils/supabase';

export interface UserProfile {
  id: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  favorite_verse?: string;
  created_at: string;
  posts_count: number;
  amens_received: number;
  loves_received: number;
  prayers_received: number;
  followers_count: number;
  following_count: number;
}

export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

/**
 * Get current user profile with stats
 */
export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    return await getUserProfile(user.id);
  } catch (error) {
    console.error('Error fetching current user profile:', error);
    return null;
  }
};

/**
 * Get user profile with stats
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<Pick<UserProfile, 'display_name' | 'bio' | 'location' | 'favorite_verse' | 'avatar_url'>>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        ...updates,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
};

/**
 * Follow a user
 */
export const followUser = async (followerId: string, followingId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_follows')
      .insert({
        follower_id: followerId,
        following_id: followingId
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error following user:', error);
    return false;
  }
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (followerId: string, followingId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return false;
  }
};

/**
 * Check if user is following another user
 */
export const isFollowing = async (followerId: string, followingId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return !!data;
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
};

/**
 * Get user's followers
 */
export const getUserFollowers = async (userId: string): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        follower_id,
        profiles!user_follows_follower_id_fkey (
          id,
          display_name,
          avatar_url,
          bio
        )
      `)
      .eq('following_id', userId);

    if (error) throw error;
    
    return data?.map(follow => ({
      id: follow.profiles.id,
      display_name: follow.profiles.display_name,
      avatar_url: follow.profiles.avatar_url,
      bio: follow.profiles.bio,
      created_at: '',
      posts_count: 0,
      amens_received: 0,
      loves_received: 0,
      prayers_received: 0,
      followers_count: 0,
      following_count: 0
    })) || [];
  } catch (error) {
    console.error('Error fetching followers:', error);
    return [];
  }
};

/**
 * Get users that a user is following
 */
export const getUserFollowing = async (userId: string): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        following_id,
        profiles!user_follows_following_id_fkey (
          id,
          display_name,
          avatar_url,
          bio
        )
      `)
      .eq('follower_id', userId);

    if (error) throw error;
    
    return data?.map(follow => ({
      id: follow.profiles.id,
      display_name: follow.profiles.display_name,
      avatar_url: follow.profiles.avatar_url,
      bio: follow.profiles.bio,
      created_at: '',
      posts_count: 0,
      amens_received: 0,
      loves_received: 0,
      prayers_received: 0,
      followers_count: 0,
      following_count: 0
    })) || [];
  } catch (error) {
    console.error('Error fetching following:', error);
    return [];
  }
};

/**
 * Get user's posts
 */
export const getUserPosts = async (userId: string, limit: number = 10) => {
  try {
    const { data, error } = await supabase
      .from('community_posts')
      .select('*')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return [];
  }
};

/**
 * Search users by display name
 */
export const searchUsers = async (query: string, limit: number = 10): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .ilike('display_name', `%${query}%`)
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};