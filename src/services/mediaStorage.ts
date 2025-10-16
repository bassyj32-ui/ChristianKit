// Media Storage Service for ChristianKit
import { supabase } from './supabase';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class MediaStorageService {
  private bucket = 'user-media';

  // Upload profile picture
  async uploadProfilePicture(file: File, userId: string): Promise<UploadResult> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `profile.${fileExt}`;
      const filePath = `avatars/${userId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(this.bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Replace existing file
        });

      if (error) {
        console.error('Upload error:', error);
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.bucket)
        .getPublicUrl(filePath);

      return { success: true, url: publicUrl };
    } catch (error) {
      console.error('Upload error:', error);
      return { success: false, error: 'Upload failed' };
    }
  }

  // Upload wallpaper
  async uploadWallpaper(file: File, userId: string): Promise<UploadResult> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `wallpaper.${fileExt}`;
      const filePath = `wallpapers/${userId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(this.bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Upload error:', error);
        return { success: false, error: error.message };
      }

      const { data: { publicUrl } } = supabase.storage
        .from(this.bucket)
        .getPublicUrl(filePath);

      return { success: true, url: publicUrl };
    } catch (error) {
      console.error('Upload error:', error);
      return { success: false, error: 'Upload failed' };
    }
  }

  // Upload post images
  async uploadPostImage(file: File, userId: string, postId: string): Promise<UploadResult> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `posts/${userId}/${postId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(this.bucket)
        .upload(filePath, file, {
          cacheControl: '3600'
        });

      if (error) {
        console.error('Upload error:', error);
        return { success: false, error: error.message };
      }

      const { data: { publicUrl } } = supabase.storage
        .from(this.bucket)
        .getPublicUrl(filePath);

      return { success: true, url: publicUrl };
    } catch (error) {
      console.error('Upload error:', error);
      return { success: false, error: 'Upload failed' };
    }
  }

  // Delete media file
  async deleteMedia(filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(this.bucket)
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }

  // Get optimized image URL with resize parameters
  getOptimizedImageUrl(originalUrl: string, width?: number, height?: number): string {
    if (!width && !height) return originalUrl;
    
    const url = new URL(originalUrl);
    const params = new URLSearchParams();
    
    if (width) params.append('width', width.toString());
    if (height) params.append('height', height.toString());
    params.append('quality', '80');
    params.append('format', 'webp');
    
    return `${url.origin}${url.pathname}?${params.toString()}`;
  }
}

export const mediaStorage = new MediaStorageService();


