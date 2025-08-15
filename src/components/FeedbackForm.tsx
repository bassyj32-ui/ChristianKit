import React, { useState } from 'react'

interface FeedbackFormProps {
  onClose: () => void
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ onClose }) => {
  const [feedbackType, setFeedbackType] = useState('')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [rating, setRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const feedbackTypes = [
    { value: 'bug', label: '🐛 Bug Report', desc: 'Something is not working' },
    { value: 'feature', label: '✨ Feature Request', desc: 'I want this feature' },
    { value: 'improvement', label: '🚀 Improvement', desc: 'This could be better' },
    { value: 'praise', label: '💝 Praise', desc: 'I love this feature' },
    { value: 'general', label: '💭 General', desc: 'Other feedback' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedbackType || !message.trim()) return

    setIsSubmitting(true)
    
    // Simulate API call - in production, this would send to your backend
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Save to localStorage for now (in production, send to your server)
    const feedback = {
      id: Date.now(),
      type: feedbackType,
      message: message.trim(),
      email: email.trim(),
      rating,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    }
    
    const existingFeedback = JSON.parse(localStorage.getItem('userFeedback') || '[]')
    localStorage.setItem('userFeedback', JSON.stringify([...existingFeedback, feedback]))
    
    setIsSubmitting(false)
    setIsSubmitted(true)
    
    // Auto-close after 3 seconds
    setTimeout(() => {
      onClose()
    }, 3000)
  }

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-neutral-900/95 backdrop-blur-sm rounded-3xl p-8 border border-green-500/30 shadow-2xl max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-green-400 mb-4">Thank You!</h2>
          <p className="text-gray-300 mb-6">
            Your feedback has been submitted successfully. We'll review it and use it to make ChristianKit even better!
          </p>
          <div className="text-sm text-gray-400">
            Closing automatically...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900/95 backdrop-blur-sm rounded-3xl p-8 border border-neutral-800 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-100 mb-2">💬 Help Us Improve</h2>
          <p className="text-gray-400">
            Your feedback helps make ChristianKit better for everyone. What's on your mind?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Feedback Type */}
          <div>
            <label className="block text-lg font-semibold text-gray-100 mb-4">
              What type of feedback is this? *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {feedbackTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFeedbackType(type.value)}
                  className={`p-4 rounded-2xl text-left transition-all duration-300 border-2 ${
                    feedbackType === type.value
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-300 shadow-lg'
                      : 'bg-neutral-800 text-gray-300 border-neutral-700 hover:bg-neutral-700'
                  }`}
                >
                  <div className="text-xl font-bold mb-1">{type.label}</div>
                  <div className="text-sm opacity-80">{type.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-lg font-semibold text-gray-100 mb-4">
              How would you rate your experience? (Optional)
            </label>
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-3xl transition-all duration-300 hover:scale-110 ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-600'
                  }`}
                >
                  {star <= rating ? '⭐' : '☆'}
                </button>
              ))}
            </div>
            <div className="text-center mt-2 text-sm text-gray-400">
              {rating === 0 && 'Click to rate'}
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent!'}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-lg font-semibold text-gray-100 mb-3">
              Tell us more about your feedback *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please describe your feedback in detail. What happened? What did you expect? How can we improve?"
              className="w-full h-32 bg-neutral-800 border border-neutral-700 rounded-2xl p-4 text-gray-100 placeholder-gray-500 focus:border-green-500 focus:outline-none transition-all duration-300 resize-none"
              required
            />
            <div className="text-right mt-2 text-sm text-gray-400">
              {message.length}/1000 characters
            </div>
          </div>

          {/* Email (Optional) */}
          <div>
            <label className="block text-lg font-semibold text-gray-100 mb-3">
              Email Address (Optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl p-4 text-gray-100 placeholder-gray-500 focus:border-green-500 focus:outline-none transition-all duration-300"
            />
            <div className="text-sm text-gray-400 mt-2">
              We'll only use this to follow up on your feedback if needed.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 bg-neutral-800 text-gray-300 rounded-2xl font-bold hover:bg-neutral-700 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!feedbackType || !message.trim() || isSubmitting}
              className={`px-8 py-3 rounded-2xl font-bold transition-all duration-300 ${
                !feedbackType || !message.trim() || isSubmitting
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transform hover:scale-105'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-100 transition-colors duration-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
