import React from 'react'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  postContent: string
  postAuthor: string
  postId: string
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  postContent,
  postAuthor,
  postId
}) => {
  if (!isOpen) return null

  const shareUrl = `${window.location.origin}/community/post/${postId}`
  const shareText = `Check out this inspiring post from ${postAuthor} on ChristianKit: "${postContent.length > 100 ? `${postContent.substring(0, 100)}...` : postContent}"`

  const socialPlatforms = [
    {
      name: 'Twitter/X',
      icon: '𝕏',
      color: 'bg-black hover:bg-gray-800',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}&hashtags=ChristianKit,Faith,Community`
    },
    {
      name: 'Facebook',
      icon: '📘',
      color: 'bg-blue-600 hover:bg-blue-700',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`
    },
    {
      name: 'WhatsApp',
      icon: '💬',
      color: 'bg-green-500 hover:bg-green-600',
      url: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`
    },
    {
      name: 'LinkedIn',
      icon: '💼',
      color: 'bg-blue-700 hover:bg-blue-800',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent('Inspiring Faith Content on ChristianKit')}&summary=${encodeURIComponent(shareText)}`
    },
    {
      name: 'Telegram',
      icon: '✈️',
      color: 'bg-blue-500 hover:bg-blue-600',
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
    }
  ]

  const handleShare = (url: string) => {
    window.open(url, '_blank', 'width=600,height=400')
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
      // You could show a toast notification here
      console.log('Link copied to clipboard')
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-gray-800 rounded-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="text-lg font-bold text-white">Share this post</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        {/* Content Preview */}
        <div className="p-4 border-b border-gray-800/50">
          <div className="bg-gray-900/50 rounded-lg p-3">
            <p className="text-sm text-gray-300 italic">
              "{postContent.length > 120 ? `${postContent.substring(0, 120)}...` : postContent}"
            </p>
            <p className="text-xs text-gray-500 mt-2">- {postAuthor}</p>
          </div>
        </div>

        {/* Social Media Platforms */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {socialPlatforms.map((platform) => (
              <button
                key={platform.name}
                onClick={() => handleShare(platform.url)}
                className={`${platform.color} text-white p-3 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-105 active:scale-95`}
              >
                <span className="text-lg">{platform.icon}</span>
                <span className="font-medium text-sm">{platform.name}</span>
              </button>
            ))}
          </div>

          {/* Copy Link Button */}
          <button
            onClick={copyToClipboard}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-xl flex items-center justify-center space-x-2 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
            <span className="font-medium">Copy Link</span>
          </button>
        </div>
      </div>
    </div>
  )
}

