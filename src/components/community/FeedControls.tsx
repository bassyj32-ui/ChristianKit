import React from 'react'
import { useCommunityStore } from '../../store/communityStore'

export const FeedControls: React.FC = () => {
  const { contentFilter, setContentFilter } = useCommunityStore()

  return (
    <div className="bg-black border-b border-gray-800 p-3 sm:p-4">
      {/* Content Filter - Mobile Optimized */}
      <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide pb-1">
        <button
          onClick={() => setContentFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 touch-manipulation ${
            contentFilter === 'all'
              ? 'bg-yellow-500 text-black shadow-lg scale-105'
              : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 active:scale-95'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setContentFilter('following')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 touch-manipulation ${
            contentFilter === 'following'
              ? 'bg-yellow-500 text-black shadow-lg scale-105'
              : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 active:scale-95'
          }`}
        >
          Following
        </button>
      </div>
    </div>
  )
}
