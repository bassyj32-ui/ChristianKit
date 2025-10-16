import { supabase } from '../utils/supabase'

export interface MediaFile {
  id: string
  user_id: string
  bucket_name: string
  file_path: string
  file_name: string
  file_size?: number
  mime_type?: string
  file_type: 'avatar' | 'banner' | 'post_image' | 'post_video' | 'document'
  alt_text?: string
  description?: string
  is_public: boolean
  created_at: string
  updated_at: string
  publicUrl?: string
}

export interface UploadResult {
  success: boolean
  data?: {
    filePath: string
    fileName: string
    fileSize: number
    mimeType: string
    publicUrl: string
    thumbnailUrl?: string
    mediaId?: string
    uploadedAt: string
  }
  error?: string
}

export interface MediaListResult {
  success: boolean
  data?: MediaFile[]
  pagination?: {
    limit: number
    offset: number
    hasMore: boolean
  }
  error?: string
}

export class MediaService {
  private supabase = supabase

  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(
    file: File,
    bucket: string,
    fileType: MediaFile['file_type'],
    options?: {
      altText?: string
      description?: string
      makePublic?: boolean
    }
  ): Promise<UploadResult> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', bucket)
      formData.append('fileType', fileType)

      if (options?.altText) {
        formData.append('altText', options.altText)
      }

      if (options?.description) {
        formData.append('description', options.description)
      }

      if (options?.makePublic !== undefined) {
        formData.append('makePublic', options.makePublic.toString())
      }

      const { data, error } = await this.supabase.functions.invoke('upload-media', {
        body: formData
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: data.data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Upload avatar image
   */
  async uploadAvatar(file: File, altText?: string): Promise<UploadResult> {
    return this.uploadFile(file, 'avatars', 'avatar', {
      altText: altText || 'Profile avatar',
      makePublic: true
    })
  }

  /**
   * Upload banner image
   */
  async uploadBanner(file: File, altText?: string): Promise<UploadResult> {
    return this.uploadFile(file, 'banners', 'banner', {
      altText: altText || 'Profile banner',
      makePublic: true
    })
  }

  /**
   * Upload post media (image or video)
   */
  async uploadPostMedia(file: File, fileType: 'post_image' | 'post_video', altText?: string): Promise<UploadResult> {
    return this.uploadFile(file, 'post-media', fileType, {
      altText,
      makePublic: true
    })
  }

  /**
   * Upload private document
   */
  async uploadDocument(file: File, description?: string): Promise<UploadResult> {
    return this.uploadFile(file, 'private-docs', 'document', {
      description,
      makePublic: false
    })
  }

  /**
   * Get user's media files
   */
  async getUserMedia(
    fileType?: MediaFile['file_type'],
    limit: number = 50,
    offset: number = 0
  ): Promise<MediaListResult> {
    try {
      const params = new URLSearchParams({
        action: 'list',
        limit: limit.toString(),
        offset: offset.toString()
      })

      if (fileType) {
        params.append('fileType', fileType)
      }

      const { data, error } = await this.supabase.functions.invoke('manage-media', {
        method: 'GET',
        body: params.toString()
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return {
        success: true,
        data: data.data,
        pagination: data.pagination
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Update media metadata
   */
  async updateMedia(
    mediaId: string,
    updates: {
      altText?: string
      description?: string
      isPublic?: boolean
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase.functions.invoke('manage-media', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update',
          mediaId,
          ...updates
        })
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Delete media file
   */
  async deleteMedia(
    mediaId: string,
    bucket: string,
    filePath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase.functions.invoke('manage-media', {
        method: 'POST',
        body: JSON.stringify({
          action: 'delete',
          mediaId,
          bucket,
          filePath
        })
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(bucket: string, filePath: string): string {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  /**
   * Generate signed upload URL (for direct uploads)
   */
  async generateUploadUrl(
    bucket: string,
    filePath: string,
    expiresIn: number = 3600
  ): Promise<{ signedUrl: string; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('media_files')
        .select('id')
        .limit(1)

      if (error) {
        return { signedUrl: '', error: 'Database not accessible' }
      }

      // In a real implementation, you would call a function to generate signed URLs
      // For now, return the public URL pattern
      return { signedUrl: this.getPublicUrl(bucket, filePath) }
    } catch (error) {
      return { signedUrl: '', error: error.message }
    }
  }
}

// Export singleton instance
export const mediaService = new MediaService()










