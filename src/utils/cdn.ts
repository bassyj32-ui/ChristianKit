/**
 * CDN and static asset optimization utilities
 * Handles asset loading, caching, and global performance
 */

export interface CDNConfig {
  enabled: boolean
  provider?: 'cloudflare' | 'aws' | 'custom'
  domain?: string
  assetsPath?: string
  cacheHeaders?: Record<string, string>
}

class CDNManager {
  private config: CDNConfig = {
    enabled: false,
    provider: 'cloudflare',
  }

  constructor(config?: Partial<CDNConfig>) {
    this.config = { ...this.config, ...config }

    // Auto-detect CDN in production
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      this.config.enabled = true
    }
  }

  /**
   * Get optimized asset URL
   */
  getAssetUrl(path: string): string {
    if (!this.config.enabled || !this.config.domain) {
      return path // Use relative path for development
    }

    const baseUrl = this.config.domain
    const assetsPath = this.config.assetsPath || '/assets'

    return `${baseUrl}${assetsPath}${path}`
  }

  /**
   * Get image URL with optimization parameters
   */
  getImageUrl(src: string, options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'avif' | 'auto'
  } = {}): string {
    if (!this.config.enabled) {
      return src
    }

    const { width, height, quality = 80, format = 'auto' } = options

    // For Cloudflare Images, add optimization parameters
    if (this.config.provider === 'cloudflare') {
      let url = src

      const params = new URLSearchParams()
      if (width) params.set('w', width.toString())
      if (height) params.set('h', height.toString())
      if (quality) params.set('q', quality.toString())
      if (format !== 'auto') params.set('f', format)

      const paramString = params.toString()
      if (paramString) {
        url += (src.includes('?') ? '&' : '?') + paramString
      }

      return url
    }

    // For other CDNs, return original URL
    return src
  }

  /**
   * Preload critical assets
   */
  preloadAssets(assets: string[]): void {
    if (typeof document === 'undefined') return

    assets.forEach(asset => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = this.getAssetUrl(asset)
      link.as = asset.endsWith('.js') ? 'script' : 'style'
      document.head.appendChild(link)
    })
  }

  /**
   * Add cache headers for static assets
   */
  getCacheHeaders(): Record<string, string> {
    const defaultHeaders = {
      'Cache-Control': 'public, max-age=31536000, immutable', // 1 year
      'CDN-Cache-Control': 'public, max-age=31536000',
    }

    return {
      ...defaultHeaders,
      ...this.config.cacheHeaders,
    }
  }

  /**
   * Optimize images for different screen sizes
   */
  getResponsiveImageSrcSet(src: string, sizes: number[]): string {
    if (!this.config.enabled) {
      return src
    }

    return sizes.map(size => {
      const url = this.getImageUrl(src, { width: size })
      return `${url} ${size}w`
    }).join(', ')
  }

  /**
   * Generate lazy loading image attributes
   */
  getLazyImageAttributes(src: string): Record<string, string> {
    return {
      'loading': 'lazy',
      'src': this.getImageUrl(src),
      'crossorigin': 'anonymous',
    }
  }

  /**
   * Check if CDN is available and responding
   */
  async checkCDNHealth(): Promise<boolean> {
    if (!this.config.enabled || !this.config.domain) {
      return false
    }

    try {
      // Simple health check by trying to fetch a small asset
      const response = await fetch(`${this.config.domain}/favicon.ico`, {
        method: 'HEAD',
        mode: 'no-cors',
      })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get CDN statistics
   */
  getStats(): CDNConfig & { isHealthy: boolean } {
    return {
      ...this.config,
      isHealthy: this.config.enabled ? true : false, // Simplified for now
    }
  }
}

// Export singleton instance
export const cdnManager = new CDNManager()

// Convenience functions
export const getAssetUrl = (path: string) => cdnManager.getAssetUrl(path)
export const getImageUrl = (src: string, options?: Parameters<CDNManager['getImageUrl']>[1]) =>
  cdnManager.getImageUrl(src, options)
export const getResponsiveImageSrcSet = (src: string, sizes: number[]) =>
  cdnManager.getResponsiveImageSrcSet(src, sizes)
export const getLazyImageAttributes = (src: string) =>
  cdnManager.getLazyImageAttributes(src)

// Preload critical assets on app startup
export const preloadCriticalAssets = () => {
  const criticalAssets = [
    '/icon-192x192.png',
    '/icon-512x512.png',
    '/manifest.json',
  ]

  cdnManager.preloadAssets(criticalAssets)
}

// Initialize CDN optimization
export const initializeCDN = async () => {
  const isHealthy = await cdnManager.checkCDNHealth()

  if (isHealthy) {
    console.log('✅ CDN is healthy and optimized')
    preloadCriticalAssets()
  } else {
    console.warn('⚠️ CDN health check failed - using local assets')
  }
}
