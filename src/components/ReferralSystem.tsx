import React, { useState, useEffect } from 'react'
import { useSupabaseAuth } from './SupabaseAuthProvider'

interface ReferralData {
  referralCode: string
  totalReferrals: number
  successfulReferrals: number
  rewardsEarned: number
}

export const ReferralSystem: React.FC = () => {
  const { user } = useSupabaseAuth()
  const [referralData, setReferralData] = useState<ReferralData>({
    referralCode: '',
    totalReferrals: 0,
    successfulReferrals: 0,
    rewardsEarned: 0
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      generateReferralCode()
      loadReferralData()
    }
  }, [user])

  const generateReferralCode = () => {
    if (user) {
      const code = `CHRISTIAN${user.id.slice(-6).toUpperCase()}`
      setReferralData(prev => ({ ...prev, referralCode: code }))
    }
  }

  const loadReferralData = async () => {
    // This would load from your database
    // For now, using mock data
    setReferralData(prev => ({
      ...prev,
      totalReferrals: 5,
      successfulReferrals: 3,
      rewardsEarned: 3
    }))
  }

  const copyReferralLink = async () => {
    const referralLink = `${window.location.origin}?ref=${referralData.referralCode}`
    try {
      await navigator.clipboard.writeText(referralLink)
      alert('Referral link copied!')
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const shareReferral = async (platform: string) => {
    const referralLink = `${window.location.origin}?ref=${referralData.referralCode}`
    const message = `Join me on ChristianKit for daily prayer and spiritual growth! Use my referral code: ${referralData.referralCode} - Get 1 month free! ${referralLink}`

    try {
      switch (platform) {
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
          break
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`, '_blank')
          break
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${encodeURIComponent(message)}`, '_blank')
          break
        case 'email':
          window.open(`mailto:?subject=Join me on ChristianKit&body=${encodeURIComponent(message)}`, '_blank')
          break
      }
    } catch (error) {
      console.error('Share error:', error)
    }
  }

  if (!user) return null

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-amber-500 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H16c-.8 0-1.54.37-2.01.99L12 11l-1.99-2.01A2.5 2.5 0 0 0 8 8H5.46c-.8 0-1.54.37-2.01.99L1 15.5V22h2v-6h2.5l2.5 7.5h2L10 16h4l1.5 7.5h2L18 16h2v6h2zM12 7.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5z"/>
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Refer Friends</h3>
          <p className="text-gray-400">Earn 1 month free for each friend who joins!</p>
        </div>
      </div>

      {/* Referral Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-400">{referralData.totalReferrals}</div>
          <div className="text-sm text-gray-400">Total Referrals</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{referralData.successfulReferrals}</div>
          <div className="text-sm text-gray-400">Successful</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{referralData.rewardsEarned}</div>
          <div className="text-sm text-gray-400">Months Earned</div>
        </div>
      </div>

      {/* Referral Code */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Your Referral Code:</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={referralData.referralCode}
            readOnly
            className="flex-1 p-3 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-center"
          />
          <button
            onClick={copyReferralLink}
            className="px-4 py-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-amber-300 transition-all"
          >
            Copy Link
          </button>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">Share with friends:</h4>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => shareReferral('whatsapp')}
            className="flex items-center justify-center gap-2 p-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-300 transition-all"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
            </svg>
            WhatsApp
          </button>

          <button
            onClick={() => shareReferral('twitter')}
            className="flex items-center justify-center gap-2 p-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-300 transition-all"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
            Twitter
          </button>

          <button
            onClick={() => shareReferral('facebook')}
            className="flex items-center justify-center gap-2 p-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 rounded-lg text-blue-300 transition-all"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </button>

          <button
            onClick={() => shareReferral('email')}
            className="flex items-center justify-center gap-2 p-3 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/30 rounded-lg text-gray-300 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            Email
          </button>
        </div>
      </div>

      {/* Rewards Info */}
      <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <h4 className="text-sm font-medium text-amber-300 mb-2">🎁 Referral Rewards</h4>
        <ul className="text-xs text-gray-300 space-y-1">
          <li>• 1 month free for each successful referral</li>
          <li>• Friend gets 1 month free when they sign up</li>
          <li>• Unlimited referrals, unlimited rewards</li>
          <li>• Rewards applied automatically</li>
        </ul>
      </div>
    </div>
  )
}
