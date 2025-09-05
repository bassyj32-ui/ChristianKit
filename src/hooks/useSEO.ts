import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { seoService, SEOData } from '../services/SEOService'

export const useSEO = (customSEO?: SEOData) => {
  const location = useLocation()

  useEffect(() => {
    let seoData: SEOData

    if (customSEO) {
      seoData = customSEO
    } else {
      // Generate SEO data based on current route
      switch (location.pathname) {
        case '/':
          seoData = seoService.generateHomePageSEO()
          break
        case '/prayer':
          seoData = seoService.generatePrayerPageSEO()
          break
        case '/community':
          seoData = seoService.generateCommunityPageSEO()
          break
        case '/game':
        case '/runner':
          seoData = seoService.generateGamePageSEO()
          break
        default:
          seoData = seoService.generateHomePageSEO()
      }
    }

    seoService.updatePageMetadata(seoData)
  }, [location.pathname, customSEO])
}

// Hook for dynamic SEO updates
export const useDynamicSEO = (title: string, description: string, keywords: string[] = []) => {
  const location = useLocation()

  useEffect(() => {
    const seoData: SEOData = {
      title,
      description,
      keywords,
      canonicalUrl: `${window.location.origin}${location.pathname}`,
      ogImage: `${window.location.origin}/og-image-default.jpg`,
      ogType: 'website',
      twitterCard: 'summary_large_image',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: title,
        description: description,
        url: `${window.location.origin}${location.pathname}`
      }
    }

    seoService.updatePageMetadata(seoData)
  }, [title, description, keywords, location.pathname])
}
