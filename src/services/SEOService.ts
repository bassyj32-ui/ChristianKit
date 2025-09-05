export interface SEOData {
  title: string
  description: string
  keywords: string[]
  canonicalUrl: string
  ogImage: string
  ogType: string
  twitterCard: string
  structuredData: any
}

export class SEOService {
  private static instance: SEOService
  private baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://christiankit.app' 
    : 'http://localhost:5173'

  static getInstance(): SEOService {
    if (!SEOService.instance) {
      SEOService.instance = new SEOService()
    }
    return SEOService.instance
  }

  // Update page metadata
  updatePageMetadata(data: SEOData) {
    // Update title
    document.title = `${data.title} | ChristianKit - Your Spiritual Companion`

    // Update meta description
    this.updateMetaTag('description', data.description)
    this.updateMetaTag('keywords', data.keywords.join(', '))

    // Update canonical URL
    this.updateCanonicalUrl(data.canonicalUrl)

    // Update Open Graph tags
    this.updateOpenGraphTags(data)

    // Update Twitter Card tags
    this.updateTwitterCardTags(data)

    // Add structured data
    this.addStructuredData(data.structuredData)
  }

  private updateMetaTag(name: string, content: string) {
    let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = name
      document.head.appendChild(meta)
    }
    meta.content = content
  }

  private updateCanonicalUrl(url: string) {
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = url
  }

  private updateOpenGraphTags(data: SEOData) {
    const ogTags = [
      { property: 'og:title', content: data.title },
      { property: 'og:description', content: data.description },
      { property: 'og:image', content: data.ogImage },
      { property: 'og:url', content: data.canonicalUrl },
      { property: 'og:type', content: data.ogType },
      { property: 'og:site_name', content: 'ChristianKit' }
    ]

    ogTags.forEach(tag => {
      this.updateMetaTag(tag.property, tag.content)
    })
  }

  private updateTwitterCardTags(data: SEOData) {
    const twitterTags = [
      { name: 'twitter:card', content: data.twitterCard },
      { name: 'twitter:title', content: data.title },
      { name: 'twitter:description', content: data.description },
      { name: 'twitter:image', content: data.ogImage }
    ]

    twitterTags.forEach(tag => {
      this.updateMetaTag(tag.name, tag.content)
    })
  }

  private addStructuredData(data: any) {
    // Remove existing structured data
    const existingScript = document.querySelector('script[type="application/ld+json"]')
    if (existingScript) {
      existingScript.remove()
    }

    // Add new structured data
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(data)
    document.head.appendChild(script)
  }

  // Generate SEO data for different pages
  generateHomePageSEO(): SEOData {
    return {
      title: 'ChristianKit - Daily Prayer & Spiritual Growth App',
      description: 'Build consistent spiritual habits with ChristianKit. Daily prayer timers, Bible study, community support, and faith-based games. Join thousands growing closer to God.',
      keywords: [
        'daily prayer app',
        'Bible study app',
        'Christian app',
        'spiritual growth',
        'prayer timer',
        'Bible reading',
        'Christian community',
        'faith app',
        'prayer journal',
        'spiritual habits'
      ],
      canonicalUrl: `${this.baseUrl}/`,
      ogImage: `${this.baseUrl}/og-image-home.jpg`,
      ogType: 'website',
      twitterCard: 'summary_large_image',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'ChristianKit',
        description: 'Daily prayer and spiritual growth app for Christians',
        url: this.baseUrl,
        applicationCategory: 'LifestyleApplication',
        operatingSystem: 'Web Browser',
        offers: {
          '@type': 'Offer',
          price: '2.50',
          priceCurrency: 'USD',
          priceValidUntil: '2025-12-31'
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          ratingCount: '2847'
        }
      }
    }
  }

  generatePrayerPageSEO(): SEOData {
    return {
      title: 'Daily Prayer Timer - ChristianKit',
      description: 'Start your day with focused prayer. Set custom prayer timers, track your spiritual journey, and build consistent prayer habits with ChristianKit.',
      keywords: [
        'prayer timer',
        'daily prayer',
        'prayer app',
        'Christian prayer',
        'prayer journal',
        'spiritual discipline',
        'prayer habits',
        'morning prayer',
        'evening prayer',
        'prayer tracker'
      ],
      canonicalUrl: `${this.baseUrl}/prayer`,
      ogImage: `${this.baseUrl}/og-image-prayer.jpg`,
      ogType: 'website',
      twitterCard: 'summary_large_image',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Daily Prayer Timer',
        description: 'Focused prayer timer for building consistent spiritual habits',
        url: `${this.baseUrl}/prayer`,
        mainEntity: {
          '@type': 'SoftwareApplication',
          name: 'ChristianKit Prayer Timer',
          applicationCategory: 'LifestyleApplication'
        }
      }
    }
  }

  generateCommunityPageSEO(): SEOData {
    return {
      title: 'Christian Community - Share Your Faith Journey',
      description: 'Connect with fellow believers, share prayer requests, and grow together in faith. Join our supportive Christian community on ChristianKit.',
      keywords: [
        'Christian community',
        'prayer requests',
        'faith sharing',
        'Christian fellowship',
        'spiritual community',
        'prayer support',
        'Christian social app',
        'faith journey',
        'Christian friends',
        'prayer group'
      ],
      canonicalUrl: `${this.baseUrl}/community`,
      ogImage: `${this.baseUrl}/og-image-community.jpg`,
      ogType: 'website',
      twitterCard: 'summary_large_image',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Christian Community',
        description: 'Connect with fellow believers and share your faith journey',
        url: `${this.baseUrl}/community`,
        mainEntity: {
          '@type': 'Organization',
          name: 'ChristianKit Community',
          description: 'Supportive Christian community for spiritual growth'
        }
      }
    }
  }

  generateGamePageSEO(): SEOData {
    return {
      title: 'Faith Runner Game - ChristianKit',
      description: 'Play Faith Runner, the Christian-themed endless runner game. Jump over obstacles, collect crosses, and build your faith while having fun!',
      keywords: [
        'Christian game',
        'faith runner',
        'Bible game',
        'Christian mobile game',
        'endless runner',
        'spiritual game',
        'Christian entertainment',
        'Bible study game',
        'faith building game',
        'Christian fun'
      ],
      canonicalUrl: `${this.baseUrl}/game`,
      ogImage: `${this.baseUrl}/og-image-game.jpg`,
      ogType: 'website',
      twitterCard: 'summary_large_image',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'VideoGame',
        name: 'Faith Runner',
        description: 'Christian-themed endless runner game',
        url: `${this.baseUrl}/game`,
        genre: 'Action',
        gamePlatform: 'Web Browser',
        applicationCategory: 'Game'
      }
    }
  }

  // Generate sitemap
  generateSitemap(): string {
    const pages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/prayer', priority: '0.9', changefreq: 'daily' },
      { url: '/community', priority: '0.8', changefreq: 'daily' },
      { url: '/game', priority: '0.7', changefreq: 'weekly' },
      { url: '/bible', priority: '0.8', changefreq: 'daily' },
      { url: '/meditation', priority: '0.7', changefreq: 'daily' }
    ]

    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n'
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    pages.forEach(page => {
      sitemap += '  <url>\n'
      sitemap += `    <loc>${this.baseUrl}${page.url}</loc>\n`
      sitemap += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`
      sitemap += `    <changefreq>${page.changefreq}</changefreq>\n`
      sitemap += `    <priority>${page.priority}</priority>\n`
      sitemap += '  </url>\n'
    })
    
    sitemap += '</urlset>'
    return sitemap
  }

  // Generate robots.txt
  generateRobotsTxt(): string {
    return `User-agent: *
Allow: /

Sitemap: ${this.baseUrl}/sitemap.xml

# Disallow admin and private areas
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /private/`
  }
}

export const seoService = SEOService.getInstance()