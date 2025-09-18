import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import EditProfileModal from './EditProfileModal';
import { UserProfile } from './UserProfile';

interface CommunityUserProfile {
  id: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  joined_date: string;
  posts_count: number;
  amens_received: number;
  loves_received: number;
  prayers_received: number;
  following_count: number;
  followers_count: number;
  favorite_verse?: string;
  is_following?: boolean;
  profileImage?: string;
  bannerImage?: string;
  customLinks?: Array<{title: string, url: string}>;
}

interface UserProfileModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  userId,
  isOpen,
  onClose,
  currentUserId
}) => {
  const [profile, setProfile] = useState<CommunityUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFullProfile, setShowFullProfile] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserProfile();
      fetchUserPosts();
    }
  }, [isOpen, userId]);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      // Fetch user profile data
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Fetch user stats
      const { data: postsData } = await supabase
        .from('community_posts')
        .select('id, amens_count, loves_count, prayers_count')
        .eq('author_id', userId);

      const postsCount = postsData?.length || 0;
      const amensReceived = postsData?.reduce((sum, post) => sum + (post.amens_count || 0), 0) || 0;
      const lovesReceived = postsData?.reduce((sum, post) => sum + (post.loves_count || 0), 0) || 0;
      const prayersReceived = postsData?.reduce((sum, post) => sum + (post.prayers_count || 0), 0) || 0;

      // Check if current user is following this user
      let isFollowingUser = false;
      if (currentUserId && currentUserId !== userId) {
        const { data: followData } = await supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', currentUserId)
          .eq('following_id', userId)
          .single();
        
        isFollowingUser = !!followData;
      }

      setProfile({
        id: userData.id,
        display_name: userData.display_name || userData.email?.split('@')[0] || 'Anonymous',
        avatar_url: userData.avatar_url,
        bio: userData.bio,
        location: userData.location,
        joined_date: userData.created_at,
        posts_count: postsCount,
        amens_received: amensReceived,
        loves_received: lovesReceived,
        prayers_received: prayersReceived,
        following_count: 0, // TODO: Implement
        followers_count: 0, // TODO: Implement
        favorite_verse: userData.favorite_verse,
        is_following: isFollowingUser,
        profileImage: userData.profileImage || '/assets/images/default-profile.jpg.png',
        bannerImage: userData.bannerImage || '/assets/images/default-banner.jpg.png',
        customLinks: userData.customLinks || []
      });

      setIsFollowing(isFollowingUser);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const { data: posts, error } = await supabase
        .from('community_posts')
        .select('*')
        .eq('author_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setUserPosts(posts || []);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  };

  const handleFollow = async () => {
    if (!currentUserId || currentUserId === userId) return;

    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', userId);
      } else {
        // Follow
        await supabase
          .from('user_follows')
          .insert({
            follower_id: currentUserId,
            following_id: userId
          });
      }

      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-white/10">
        {/* Header */}
        <div className="relative">
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500"></div>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors duration-200"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex items-end space-x-4 -mt-16">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 rounded-full flex items-center justify-center text-black text-2xl font-bold border-4 border-gray-900 overflow-hidden">
                  {profile?.profileImage ? (
                    <img 
                      src={profile.profileImage} 
                      alt={profile.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{profile?.display_name?.[0] || '👤'}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowFullProfile(true)}
                  className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:from-amber-500 hover:to-yellow-400 px-6 py-2 rounded-xl font-semibold transition-all duration-300"
                >
                  View Full Profile
                </button>
                {currentUserId === userId ? (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="bg-white/10 text-white border border-white/20 hover:bg-white/20 px-6 py-2 rounded-xl font-semibold transition-all duration-300"
                  >
                    Edit Profile
                  </button>
                ) : currentUserId ? (
                  <button
                    onClick={handleFollow}
                    className={`px-6 py-2 rounded-xl font-semibold transition-all duration-300 ${
                      isFollowing
                        ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                        : 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:from-amber-500 hover:to-yellow-400'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                ) : null}
              </div>
            </div>

            {/* User Info */}
            <div className="mt-4">
              <h2 className="text-2xl font-bold text-white mb-2">{profile?.display_name}</h2>
              {profile?.bio && (
                <p className="text-slate-300 mb-3">{profile.bio}</p>
              )}
              
              {/* Stats */}
              <div className="flex items-center space-x-6 mb-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-white">{profile?.posts_count || 0}</div>
                  <div className="text-xs text-slate-400">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-400">{profile?.amens_received || 0}</div>
                  <div className="text-xs text-slate-400">Amens</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-red-400">{profile?.loves_received || 0}</div>
                  <div className="text-xs text-slate-400">Loves</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-400">{profile?.prayers_received || 0}</div>
                  <div className="text-xs text-slate-400">Prayers</div>
                </div>
              </div>

              {/* Meta Info */}
              <div className="flex items-center space-x-4 text-sm text-slate-400">
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Joined {profile ? formatDate(profile.joined_date) : ''}</span>
                </div>
                {profile?.location && (
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{profile.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-white/10">
          <div className="flex">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-colors duration-200 ${
                activeTab === 'posts'
                  ? 'text-yellow-400 border-b-2 border-yellow-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-colors duration-200 ${
                activeTab === 'about'
                  ? 'text-yellow-400 border-b-2 border-yellow-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              About
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-300">Loading profile...</p>
            </div>
          ) : activeTab === 'posts' ? (
            <div className="space-y-4">
              {userPosts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📝</span>
                  </div>
                  <p className="text-slate-300">No posts yet</p>
                </div>
              ) : (
                userPosts.map((post) => (
                  <div key={post.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-slate-200 mb-3">{post.content}</p>
                    <div className="flex items-center space-x-4 text-sm text-slate-400">
                      <span>🙏 {post.amens_count || 0}</span>
                      <span>❤️ {post.loves_count || 0}</span>
                      <span>💬 {post.prayers_count || 0}</span>
                      <span>•</span>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {profile?.favorite_verse && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Favorite Bible Verse</h3>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-slate-200 italic">"{profile.favorite_verse}"</p>
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Faith Journey</h3>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-slate-300">
                    {profile?.bio || 'This believer hasn\'t shared their story yet.'}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Community Impact</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                    <div className="text-2xl font-bold text-blue-400">{profile?.amens_received || 0}</div>
                    <div className="text-sm text-blue-300">Amens Received</div>
                  </div>
                  <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                    <div className="text-2xl font-bold text-red-400">{profile?.loves_received || 0}</div>
                    <div className="text-sm text-red-300">Loves Received</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && currentUserId === userId && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          userId={userId}
          onProfileUpdated={() => {
            fetchUserProfile();
            setShowEditModal(false);
          }}
        />
      )}

      {/* Full Profile Modal */}
      {showFullProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-primary)] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-[var(--glass-border)]">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Full Profile</h2>
              <button
                onClick={() => setShowFullProfile(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <UserProfile />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileModal;
