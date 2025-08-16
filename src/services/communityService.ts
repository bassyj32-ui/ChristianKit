import { useAuth } from '../components/AuthProvider'

export interface CommunityPost {
  id: string
  authorId: string
  authorName: string
  authorAvatar: string
  content: string
  timestamp: number
  likes: string[] // Array of user IDs who liked
  comments: Comment[]
  hashtags: string[]
  type: 'prayer' | 'bible' | 'meditation' | 'general'
  isPublic: boolean
}

export interface Comment {
  id: string
  authorId: string
  authorName: string
  authorAvatar: string
  content: string
  timestamp: number
  likes: string[]
}

export interface UserProfile {
  id: string
  name: string
  avatar: string
  followers: string[]
  following: string[]
  bio: string
  joinDate: number
}

class CommunityService {
  private readonly POSTS_KEY = 'communityPosts'
  private readonly PROFILES_KEY = 'userProfiles'
  private readonly LIKES_KEY = 'postLikes'
  private readonly COMMENTS_KEY = 'postComments'

  // Get all posts
  async getPosts(): Promise<CommunityPost[]> {
    try {
      const saved = localStorage.getItem(this.POSTS_KEY)
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error('Error loading community posts:', error)
      return []
    }
  }

  // Create a new post
  async createPost(post: Omit<CommunityPost, 'id' | 'timestamp' | 'likes' | 'comments'>): Promise<CommunityPost> {
    try {
      const posts = await this.getPosts()
      const newPost: CommunityPost = {
        ...post,
        id: Date.now().toString(),
        timestamp: Date.now(),
        likes: [],
        comments: []
      }
      
      posts.unshift(newPost)
      localStorage.setItem(this.POSTS_KEY, JSON.stringify(posts))
      
      return newPost
    } catch (error) {
      console.error('Error creating post:', error)
      throw error
    }
  }

  // Like/unlike a post
  async toggleLike(postId: string, userId: string): Promise<void> {
    try {
      const posts = await this.getPosts()
      const postIndex = posts.findIndex(p => p.id === postId)
      
      if (postIndex === -1) return
      
      const post = posts[postIndex]
      const likeIndex = post.likes.indexOf(userId)
      
      if (likeIndex === -1) {
        // Add like
        post.likes.push(userId)
      } else {
        // Remove like
        post.likes.splice(likeIndex, 1)
      }
      
      localStorage.setItem(this.POSTS_KEY, JSON.stringify(posts))
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  // Add comment to a post
  async addComment(postId: string, comment: Omit<Comment, 'id' | 'timestamp' | 'likes'>): Promise<void> {
    try {
      const posts = await this.getPosts()
      const postIndex = posts.findIndex(p => p.id === postId)
      
      if (postIndex === -1) return
      
      const newComment: Comment = {
        ...comment,
        id: Date.now().toString(),
        timestamp: Date.now(),
        likes: []
      }
      
      posts[postIndex].comments.push(newComment)
      localStorage.setItem(this.POSTS_KEY, JSON.stringify(posts))
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  // Delete a post
  async deletePost(postId: string, userId: string): Promise<void> {
    try {
      const posts = await this.getPosts()
      const filteredPosts = posts.filter(p => !(p.id === postId && p.authorId === userId))
      localStorage.setItem(this.POSTS_KEY, JSON.stringify(filteredPosts))
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  // Get trending hashtags
  async getTrendingHashtags(): Promise<{ tag: string; count: number; trending: boolean }[]> {
    try {
      const posts = await this.getPosts()
      const hashtagCounts: Record<string, number> = {}
      
      posts.forEach(post => {
        post.hashtags.forEach(tag => {
          hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1
        })
      })
      
      const sortedTags = Object.entries(hashtagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([tag, count]) => ({
          tag: `#${tag}`,
          count: `${count} posts`,
          trending: count > 5
        }))
      
      return sortedTags
    } catch (error) {
      console.error('Error getting trending hashtags:', error)
      return []
    }
  }

  // Get user profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const saved = localStorage.getItem(this.PROFILES_KEY)
      const profiles: UserProfile[] = saved ? JSON.parse(saved) : []
      return profiles.find(p => p.id === userId) || null
    } catch (error) {
      console.error('Error loading user profile:', error)
      return null
    }
  }

  // Create or update user profile
  async updateUserProfile(profile: UserProfile): Promise<void> {
    try {
      const saved = localStorage.getItem(this.PROFILES_KEY)
      const profiles: UserProfile[] = saved ? JSON.parse(saved) : []
      const existingIndex = profiles.findIndex(p => p.id === profile.id)
      
      if (existingIndex !== -1) {
        profiles[existingIndex] = profile
      } else {
        profiles.push(profile)
      }
      
      localStorage.setItem(this.PROFILES_KEY, JSON.stringify(profiles))
    } catch (error) {
      console.error('Error updating user profile:', error)
    }
  }

  // Follow/unfollow user
  async toggleFollow(followerId: string, followingId: string): Promise<void> {
    try {
      const saved = localStorage.getItem(this.PROFILES_KEY)
      const profiles: UserProfile[] = saved ? JSON.parse(saved) : []
      
      const followerIndex = profiles.findIndex(p => p.id === followerId)
      const followingIndex = profiles.findIndex(p => p.id === followingId)
      
      if (followerIndex !== -1 && followingIndex !== -1) {
        const follower = profiles[followerIndex]
        const following = profiles[followingIndex]
        
        const isFollowing = follower.following.includes(followingId)
        
        if (isFollowing) {
          // Unfollow
          follower.following = follower.following.filter(id => id !== followingId)
          following.followers = following.followers.filter(id => id !== followerId)
        } else {
          // Follow
          follower.following.push(followingId)
          following.followers.push(followerId)
        }
        
        localStorage.setItem(this.PROFILES_KEY, JSON.stringify(profiles))
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
    }
  }

  // Extract hashtags from content
  extractHashtags(content: string): string[] {
    const hashtagRegex = /#(\w+)/g
    const matches = content.match(hashtagRegex)
    return matches ? matches.map(tag => tag.slice(1)) : []
  }

  // Format timestamp
  formatTimestamp(timestamp: number): string {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    
    return new Date(timestamp).toLocaleDateString()
  }
}

export const communityService = new CommunityService()
