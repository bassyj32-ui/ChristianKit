import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useSupabaseAuth } from './SupabaseAuthProvider';

interface ActivityItem {
  id: string;
  type: 'post' | 'follow' | 'interaction';
  actor_id: string;
  actor_name: string;
  actor_avatar?: string;
  target_id?: string;
  target_name?: string;
  content?: string;
  interaction_type?: 'amen' | 'love' | 'prayer';
  created_at: string;
}

interface ActivityFeedProps {
  onUserSelect?: (userId: string) => void;
  onPostSelect?: (postId: string) => void;
  className?: string;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  onUserSelect,
  onPostSelect,
  className = ''
}) => {
  const { user } = useSupabaseAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadActivityFeed();
    }
  }, [user?.id]);

  const loadActivityFeed = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Get activities from users that the current user follows
      const activities = await getFollowedUsersActivity();
      setActivities(activities);
    } catch (error) {
      console.error('Error loading activity feed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFollowedUsersActivity = async (): Promise<ActivityItem[]> => {
    if (!user?.id) return [];

    try {
      // Get list of users the current user follows
      const { data: followedUsers, error: followError } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followError) throw followError;

      if (!followedUsers || followedUsers.length === 0) {
        return [];
      }

      const followedUserIds = followedUsers.map(f => f.following_id);

      // Get recent posts from followed users
      const { data: recentPosts, error: postsError } = await supabase
        .from('community_posts')
        .select('id, author_id, author_name, author_avatar, content, created_at')
        .in('author_id', followedUserIds)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order('created_at', { ascending: false })
        .limit(10);

      if (postsError) throw postsError;

      // Get recent interactions from followed users
      const { data: recentInteractions, error: interactionsError } = await supabase
        .from('post_interactions')
        .select(`
          id,
          user_id,
          post_id,
          interaction_type,
          created_at,
          profiles!post_interactions_user_id_fkey (
            display_name,
            avatar_url
          ),
          community_posts!post_interactions_post_id_fkey (
            author_id,
            author_name,
            content
          )
        `)
        .in('user_id', followedUserIds)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (interactionsError) throw interactionsError;

      // Get recent follows between followed users
      const { data: recentFollows, error: followsError } = await supabase
        .from('user_follows')
        .select(`
          id,
          follower_id,
          following_id,
          created_at,
          follower:profiles!user_follows_follower_id_fkey (
            display_name,
            avatar_url
          ),
          following:profiles!user_follows_following_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .in('follower_id', followedUserIds)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      if (followsError) throw followsError;

      // Combine and format all activities
      const allActivities: ActivityItem[] = [];

      // Add post activities
      recentPosts?.forEach(post => {
        allActivities.push({
          id: `post-${post.id}`,
          type: 'post',
          actor_id: post.author_id,
          actor_name: post.author_name || 'Anonymous',
          actor_avatar: post.author_avatar,
          content: post.content,
          created_at: post.created_at
        });
      });

      // Add interaction activities
      recentInteractions?.forEach(interaction => {
        allActivities.push({
          id: `interaction-${interaction.id}`,
          type: 'interaction',
          actor_id: interaction.user_id,
          actor_name: interaction.profiles?.display_name || 'Anonymous',
          actor_avatar: interaction.profiles?.avatar_url,
          target_id: interaction.post_id,
          target_name: interaction.community_posts?.author_name,
          content: interaction.community_posts?.content,
          interaction_type: interaction.interaction_type as 'amen' | 'love' | 'prayer',
          created_at: interaction.created_at
        });
      });

      // Add follow activities
      recentFollows?.forEach(follow => {
        allActivities.push({
          id: `follow-${follow.id}`,
          type: 'follow',
          actor_id: follow.follower_id,
          actor_name: follow.follower?.display_name || 'Anonymous',
          actor_avatar: follow.follower?.avatar_url,
          target_id: follow.following_id,
          target_name: follow.following?.display_name,
          created_at: follow.created_at
        });
      });

      // Sort by creation date and return
      return allActivities
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 15);

    } catch (error) {
      console.error('Error getting followed users activity:', error);
      return [];
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    
    return date.toLocaleDateString();
  };

  const getActivityIcon = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'post':
        return (
          <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        );
      case 'follow':
        return (
          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        );
      case 'interaction':
        if (activity.interaction_type === 'amen') {
          return (
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
              <span className="text-sm">🙏</span>
            </div>
          );
        } else if (activity.interaction_type === 'love') {
          return (
            <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
              <span className="text-sm">❤️</span>
            </div>
          );
        } else {
          return (
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
              <span className="text-sm">💬</span>
            </div>
          );
        }
      default:
        return (
          <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <span className="text-sm">✨</span>
          </div>
        );
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'post':
        return `shared a new post`;
      case 'follow':
        return `started following ${activity.target_name}`;
      case 'interaction':
        if (activity.interaction_type === 'amen') {
          return `said Amen to ${activity.target_name}'s post`;
        } else if (activity.interaction_type === 'love') {
          return `loved ${activity.target_name}'s post`;
        } else {
          return `prayed for ${activity.target_name}'s post`;
        }
      default:
        return 'had some activity';
    }
  };

  if (!user) return null;

  return (
    <div className={className}>
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-white">Activity Feed</h3>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-slate-400 text-sm">Loading activities...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-slate-300 font-medium">No recent activity</p>
          <p className="text-slate-400 text-sm mt-1">Follow more believers to see their activity</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white/5 rounded-xl p-3 border border-white/10 hover:border-yellow-400/30 transition-all duration-300"
            >
              <div className="flex items-start space-x-3">
                {/* Activity Icon */}
                {getActivityIcon(activity)}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <button
                      onClick={() => onUserSelect?.(activity.actor_id)}
                      className="font-semibold text-white hover:text-yellow-300 transition-colors text-sm"
                    >
                      {activity.actor_name}
                    </button>
                    <span className="text-xs text-slate-400">
                      {formatTimestamp(activity.created_at)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-slate-300 mb-2">
                    {getActivityText(activity)}
                  </p>

                  {/* Content Preview */}
                  {activity.content && (
                    <div 
                      className="bg-white/5 rounded-lg p-2 cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => activity.target_id && onPostSelect?.(activity.target_id)}
                    >
                      <p className="text-xs text-slate-400 italic line-clamp-2">
                        "{activity.content.substring(0, 100)}..."
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Refresh Button */}
      <div className="text-center mt-4">
        <button
          onClick={loadActivityFeed}
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

export default ActivityFeed;

