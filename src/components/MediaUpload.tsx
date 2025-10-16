import React, { useState, useRef } from 'react'
import { mediaService, UploadResult } from '../services/mediaService'

interface MediaUploadProps {
  onUpload?: (result: UploadResult) => void
  onError?: (error: string) => void
  fileType: 'avatar' | 'banner' | 'post_image' | 'post_video' | 'document'
  bucket?: string
  accept?: string
  maxSize?: number // in bytes
  className?: string
  children?: React.ReactNode
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  onUpload,
  onError,
  fileType,
  bucket,
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB default
  className = '',
  children
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Determine bucket based on file type if not provided
  const getBucket = () => {
    if (bucket) return bucket

    switch (fileType) {
      case 'avatar':
        return 'avatars'
      case 'banner':
        return 'banners'
      case 'post_image':
      case 'post_video':
        return 'post-media'
      case 'document':
        return 'private-docs'
      default:
        return 'post-media'
    }
  }

  // Determine accept attribute based on file type
  const getAccept = () => {
    if (accept) return accept

    switch (fileType) {
      case 'avatar':
      case 'banner':
        return 'image/*'
      case 'post_image':
        return 'image/*'
      case 'post_video':
        return 'video/*'
      case 'document':
        return 'application/pdf,.doc,.docx,.txt'
      default:
        return '*/*'
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > maxSize) {
      onError?.(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`)
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Simulate progress (in real implementation, you could track actual upload progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 100)

      const result = await mediaService.uploadFile(file, getBucket(), fileType)

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (result.success && result.data) {
        onUpload?.(result)
      } else {
        onError?.(result.error || 'Upload failed')
      }
    } catch (error) {
      onError?.(error.message || 'Upload failed')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={getAccept()}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={isUploading}
      />

      {children ? (
        <div onClick={handleClick} style={{ cursor: isUploading ? 'not-allowed' : 'pointer' }}>
          {children}
        </div>
      ) : (
        <button
          onClick={handleClick}
          disabled={isUploading}
          className={`px-4 py-2 rounded-md transition-colors ${
            isUploading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isUploading ? 'Uploading...' : 'Upload File'}
        </button>
      )}

      {isUploading && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1">{uploadProgress}% uploaded</p>
        </div>
      )}
    </div>
  )
}

// Specific upload components for common use cases
export const AvatarUpload: React.FC<{
  onUpload?: (result: UploadResult) => void
  onError?: (error: string) => void
  className?: string
}> = ({ onUpload, onError, className }) => (
  <MediaUpload
    fileType="avatar"
    maxSize={5 * 1024 * 1024} // 5MB for avatars
    onUpload={onUpload}
    onError={onError}
    className={className}
  >
    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors">
      <span className="text-gray-600 text-sm">Upload Avatar</span>
    </div>
  </MediaUpload>
)

export const BannerUpload: React.FC<{
  onUpload?: (result: UploadResult) => void
  onError?: (error: string) => void
  className?: string
}> = ({ onUpload, onError, className }) => (
  <MediaUpload
    fileType="banner"
    maxSize={5 * 1024 * 1024} // 5MB for banners
    onUpload={onUpload}
    onError={onError}
    className={className}
  >
    <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors">
      <span className="text-gray-600 text-sm">Upload Banner</span>
    </div>
  </MediaUpload>
)

export const PostMediaUpload: React.FC<{
  onUpload?: (result: UploadResult) => void
  onError?: (error: string) => void
  className?: string
}> = ({ onUpload, onError, className }) => (
  <MediaUpload
    fileType="post_image"
    maxSize={10 * 1024 * 1024} // 10MB for post media
    onUpload={onUpload}
    onError={onError}
    className={className}
  >
    <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors border-2 border-dashed border-gray-300">
      <div className="text-center">
        <div className="text-2xl mb-2">📷</div>
        <span className="text-gray-600 text-sm">Upload Post Media</span>
      </div>
    </div>
  </MediaUpload>
)










