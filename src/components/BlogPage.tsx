import React, { useState, useEffect } from 'react'
import { contentMarketingService, BlogPost } from '../services/ContentMarketingService'
import { useSEO } from '../hooks/useSEO'

export const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  // SEO optimization
  useSEO({
    title: 'Christian Blog - Spiritual Growth Articles & Devotionals',
    description: 'Discover inspiring articles, practical guides, and daily devotionals to strengthen your faith journey. Expert insights on prayer, Bible study, and Christian living.',
    keywords: ['Christian blog', 'spiritual growth', 'prayer guides', 'Bible study', 'devotionals', 'Christian living'],
    canonicalUrl: `${window.location.origin}/blog`,
    ogImage: `${window.location.origin}/og-image-blog.jpg`,
    ogType: 'website',
    twitterCard: 'summary_large_image',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'ChristianKit Blog',
      description: 'Spiritual growth articles and devotionals for Christians',
      url: `${window.location.origin}/blog`,
      publisher: {
        '@type': 'Organization',
        name: 'ChristianKit'
      }
    }
  })

  useEffect(() => {
    const loadPosts = () => {
      try {
        const blogPosts = contentMarketingService.generateBlogPosts()
        setPosts(blogPosts)
      } catch (error) {
        console.error('Error loading blog posts:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPosts()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading blog posts...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-xl border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Christian{' '}
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Blog
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Discover inspiring articles, practical guides, and daily devotionals to strengthen your faith journey
            </p>
          </div>
        </div>
      </div>

      {/* Blog Posts */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                <div className="flex items-center justify-center">
                  <span className="text-4xl">📖</span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                <h2 className="text-xl font-bold text-white mb-3 group-hover:text-amber-400 transition-colors">
                  {post.title}
                </h2>
                
                <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </span>
                  <button className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors">
                    Read More →
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-xl border-t border-amber-500/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Stay Updated with Our Latest Content
          </h2>
          <p className="text-gray-300 mb-8">
            Get weekly devotionals, spiritual growth tips, and community updates delivered to your inbox
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
