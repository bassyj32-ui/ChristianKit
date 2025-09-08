import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { followUser, unfollowUser, isFollowing } from '../services/userProfileService';
import { useSupabaseAuth } from './SupabaseAuthProvider';
import ActivityFeed from './ActivityFeed';

interface RecommendedUser {
  id: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  posts_count: number;
  amens_received: number;
  followers_count: number;
  mutual_follows?: number;
  reason?: string;
}

interface UserDiscoverySidebarProps {
  onUserSelect?: (userId: string) => void;
  className?: string;
}

export const UserDiscoverySidebar: React.FC<UserDiscoverySidebarProps> = ({ 
  onUserSelect, 
  className = '' 
}) => {
  const { user } = useSupabaseAuth();
  const [recommendedUsers, setRecommendedUsers] = useState<RecommendedUser[]>([]);
  const [activeUsers, setActiveUsers] = useState<RecommendedUser[]>([]);
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadRecommendations();
    }
  }, [user?.id]);

  const loadRecommendations = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Get recommended users based on various criteria
      const [recommended, active] = await Promise.all([
        getRecommendedUsers(),
        getActiveUsers()
      ]);

      setRecommendedUsers(recommended);
      setActiveUsers(active);

      // Check following status for all users
      const allUsers = [...recommended, ...active];
      const statusPromises = allUsers.map(async (u) => {
        const following = await isFollowing(user.id, u.id);
        return { userId: u.id, following };
      });

      const statuses = await Promise.all(statusPromises);
      const statusMap = statuses.reduce((acc, { userId, following }) => {
        acc[userId] = following;
        return acc;
      }, {} as Record<string, boolean>);

      setFollowingStatus(statusMap);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendedUsers = async (): Promise<RecommendedUser[]> => {
    if (!user?.id) return [];

    try {
      // Get users with high engagement that current user isn't following
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .neq('id', user.id)
        .not('id', 'in', `(
          SELECT following_id FROM user_follows WHERE follower_id = '${user.id}'
        )`)
        .gte('posts_count', 3)
        .gte('amens_received', 10)
        .order('amens_received', { ascending: false })
        .limit(5);

      if (error) throw error;

      return (data || []).map(u => ({
        ...u,
        reason: u.amens_received > 50 ? 'Highly engaged believer' : 'Active in community'
      }));
    } catch (error) {
      console.error('Error getting recommended users:', error);
      return [];
    }
  };

  const getActiveUsers = async (): Promise<RecommendedUser[]> => {
    if (!user?.id) return [];

    try {
      // Get recently active users
      const { data: recentPosts, error } = await supabase
        .from('community_posts')
        .select('author_id, author_name, author_avatar')
        .neq('author_id', user.id)
        .not('author_id', 'in', `(
          SELECT following_id FROM user_follows WHERE follower_id = '${user.id}'
        )`)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Group by author and get unique users
      const uniqueAuthors = new Map();
      recentPosts?.forEach(post => {
        if (!uniqueAuthors.has(post.author_id)) {
          uniqueAuthors.set(post.author_id, {
            id: post.author_id,
            display_name: post.author_name || 'Anonymous',
            avatar_url: post.author_avatar,
            posts_count: 1,
            amens_received: 0,
            followers_count: 0,
            reason: 'Recently active'
          });
        } else {
          const existing = uniqueAuthors.get(post.author_id);
          existing.posts_count += 1;
        }
      });

      return Array.from(uniqueAuthors.values()).slice(0, 4);
    } catch (error) {
      console.error('Error getting active users:', error);
      return [];
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

      // Remove from recommendations if followed
      if (!currentlyFollowing) {
        setRecommendedUsers(prev => prev.filter(u => u.id !== userId));
        setActiveUsers(prev => prev.filter(u => u.id !== userId));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const UserCard: React.FC<{ user: RecommendedUser; compact?: boolean }> = ({ 
    user: recommendedUser, 
    compact = false 
  }) => (
    <div className={`bg-white/5 rounded-xl border border-white/10 hover:border-yellow-400/30 transition-all duration-300 group ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <button
          onClick={() => onUserSelect?.(recommendedUser.id)}
          className={`bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 rounded-full flex items-center justify-center text-black font-semibold flex-shrink-0 hover:scale-105 transition-transform duration-200 ${compact ? 'w-10 h-10 text-sm' : 'w-12 h-12 text-base'}`}
        >
          {recommendedUser.avatar_url ? (
            <img 
              src={recommendedUser.avatar_url} 
              alt={recommendedUser.display_name}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <span>{recommendedUser.display_name?.[0] || '👤'}</span>
          )}
        </button>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <button
            onClick={() => onUserSelect?.(recommendedUser.id)}
            className={`font-semibold text-white hover:text-yellow-300 transition-colors truncate block text-left ${compact ? 'text-sm' : 'text-base'}`}
          >
            {recommendedUser.display_name}
          </button>
          
          {recommendedUser.reason && (
            <p className={`text-yellow-400 font-medium ${compact ? 'text-xs' : 'text-sm'} mt-0.5`}>
              {recommendedUser.reason}
            </p>
          )}
          
          {recommendedUser.bio && !compact && (
            <p className="text-xs text-slate-400 truncate mt-1">{recommendedUser.bio}</p>
          )}
          
          <div className={`flex items-center space-x-2 mt-1 ${compact ? 'text-xs' : 'text-sm'} text-slate-500`}>
            <span>{recommendedUser.posts_count} posts</span>
            {recommendedUser.amens_received > 0 && (
              <>
                <span>•</span>
                <span>{recommendedUser.amens_received} amens</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Follow Button */}
      <div className="mt-3">
        <button
          onClick={() => handleFollowToggle(recommendedUser.id, followingStatus[recommendedUser.id] || false)}
          className={`w-full py-2 rounded-lg font-semibold transition-all duration-200 ${compact ? 'text-xs' : 'text-sm'} ${
            followingStatus[recommendedUser.id]
              ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
              : 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:from-amber-500 hover:to-yellow-400 hover:scale-105'
          }`}
        >
          {followingStatus[recommendedUser.id] ? 'Following' : 'Follow'}
        </button>
      </div>
    </div>
  );

  if (!user) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Activity Feed */}
      <ActivityFeed 
        onUserSelect={onUserSelect}
        onPostSelect={(postId) => {
          console.log('Navigate to post:', postId);
        }}
      />

      {/* Recommended Users */}
      {recommendedUsers.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Suggested for You</h3>
          </div>
          
          <div className="space-y-3">
            {recommendedUsers.map((recommendedUser) => (
              <UserCard key={recommendedUser.id} user={recommendedUser} />
            ))}
          </div>
        </div>
      )}

      {/* Recently Active Users */}
      {activeUsers.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Recently Active</h3>
          </div>
          
          <div className="space-y-3">
            {activeUsers.map((activeUser) => (
              <UserCard key={activeUser.id} user={activeUser} compact />
            ))}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={loadRecommendations}
          disabled={isLoading}
          className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-yellow-400/30 text-white px-4 py-2 rounded-xl transition-all duration-300 disabled:opacity-50 text-sm"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Loading...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default UserDiscoverySidebar;
