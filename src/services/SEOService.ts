export interface SEOMetaData {
  title: string;
  description: string;
  keywords: string[];
  image: string;
  url: string;
  type: 'website' | 'article' | 'profile';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

export interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

class SEOService {
  private readonly DEFAULT_META = {
    title: 'ChristianKit - Grow Your Faith Daily | Spiritual Habit Tracking App',
    description: 'ChristianKit helps you build spiritual habits like Bible reading, prayer, and meditation. Track your progress, join a faith community, and grow closer to God daily.',
    keywords: ['Christian app', 'spiritual habits', 'Bible reading', 'prayer timer', 'meditation', 'faith community', 'Christian lifestyle', 'spiritual growth', 'daily devotionals'],
    image: 'https://christiankit.app/og-image.jpg',
    url: 'https://christiankit.app/',
    type: 'website' as const,
    author: 'ChristianKit'
  };

  /**
   * Update page meta tags dynamically
   */
  updateMetaTags(meta: Partial<SEOMetaData>): void {
    try {
      const finalMeta = { ...this.DEFAULT_META, ...meta };

      // Update title
      document.title = finalMeta.title;

      // Update meta description
      this.updateMetaTag('name', 'description', finalMeta.description);

      // Update keywords
      this.updateMetaTag('name', 'keywords', finalMeta.keywords.join(', '));

      // Update author
      this.updateMetaTag('name', 'author', finalMeta.author);

      // Update Open Graph tags
      this.updateMetaTag('property', 'og:title', finalMeta.title);
      this.updateMetaTag('property', 'og:description', finalMeta.description);
      this.updateMetaTag('property', 'og:image', finalMeta.image);
      this.updateMetaTag('property', 'og:url', finalMeta.url);
      this.updateMetaTag('property', 'og:type', finalMeta.type);

      // Update Twitter Card tags
      this.updateMetaTag('property', 'twitter:title', finalMeta.title);
      this.updateMetaTag('property', 'twitter:description', finalMeta.description);
      this.updateMetaTag('property', 'twitter:image', finalMeta.image);
      this.updateMetaTag('property', 'twitter:url', finalMeta.url);

      // Update canonical URL
      this.updateCanonicalUrl(finalMeta.url);

      console.log('✅ SEO meta tags updated successfully', finalMeta);

    } catch (error) {
      console.error('❌ Error updating SEO meta tags:', error);
    }
  }

  /**
   * Update specific meta tag
   */
  private updateMetaTag(attribute: 'name' | 'property', value: string, content: string): void {
    try {
      let meta = document.querySelector(`meta[${attribute}="${value}"]`) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, value);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    } catch (error) {
      console.error(`❌ Error updating meta tag ${attribute}="${value}":`, error);
    }
  }

  /**
   * Update canonical URL
   */
  private updateCanonicalUrl(url: string): void {
    try {
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      
      canonical.setAttribute('href', url);
    } catch (error) {
      console.error('❌ Error updating canonical URL:', error);
    }
  }

  /**
   * Add structured data to page
   */
  addStructuredData(data: StructuredData): void {
    try {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(data);
      document.head.appendChild(script);

      console.log('✅ Structured data added successfully', data);
    } catch (error) {
      console.error('❌ Error adding structured data:', error);
    }
  }

  /**
   * Generate structured data for different page types
   */
  generateStructuredData(type: 'home' | 'prayer' | 'dashboard' | 'community', additionalData?: any): StructuredData {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'ChristianKit',
      description: this.DEFAULT_META.description,
      url: this.DEFAULT_META.url,
      publisher: {
        '@type': 'Organization',
        name: 'ChristianKit',
        url: 'https://christiankit.app/'
      },
      mainEntity: {
        '@type': 'SoftwareApplication',
        name: 'ChristianKit',
        applicationCategory: 'LifestyleApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        }
      }
    };

    switch (type) {
      case 'home':
        return {
          ...baseData,
          '@type': 'WebSite',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://christiankit.app/search?q={search_term_string}',
            'query-input': 'required name=search_term_string'
          }
        };

      case 'prayer':
        return {
          ...baseData,
          '@type': 'WebPage',
          name: 'Prayer Timer - ChristianKit',
          description: 'Start your daily prayer session with our spiritual timer. Track your prayer habits and grow closer to God.',
          mainEntity: {
            '@type': 'SoftwareApplication',
            name: 'ChristianKit Prayer Timer',
            applicationCategory: 'LifestyleApplication',
            featureList: [
              'Prayer timer with customizable duration',
              'Focus reminders and mood tracking',
              'Prayer session history',
              'Spiritual habit tracking'
            ]
          }
        };

      case 'dashboard':
        return {
          ...baseData,
          '@type': 'WebPage',
          name: 'Spiritual Dashboard - ChristianKit',
          description: 'Track your spiritual growth, view progress, and manage your daily spiritual habits.',
          mainEntity: {
            '@type': 'Dashboard',
            name: 'ChristianKit Spiritual Dashboard',
            description: 'Personal spiritual habit tracking dashboard'
          }
        };

      case 'community':
        return {
          ...baseData,
          '@type': 'WebPage',
          name: 'Faith Community - ChristianKit',
          description: 'Connect with other believers, share your spiritual journey, and find encouragement in your faith community.',
          mainEntity: {
            '@type': 'DiscussionForumPosting',
            name: 'ChristianKit Faith Community',
            description: 'Online faith community for Christians'
          }
        };

      default:
        return baseData;
    }
  }

  /**
   * Optimize images for SEO
   */
  optimizeImages(): void {
    try {
      const images = document.querySelectorAll('img');
      
      images.forEach((img, index) => {
        const imgElement = img as HTMLImageElement;
        
        // Add loading="lazy" for better performance
        if (!imgElement.hasAttribute('loading')) {
          imgElement.setAttribute('loading', 'lazy');
        }
        
        // Add alt text if missing
        if (!imgElement.alt) {
          imgElement.alt = `ChristianKit image ${index + 1}`;
        }
        
        // Add decoding="async" for better performance
        if (!imgElement.hasAttribute('decoding')) {
          imgElement.setAttribute('decoding', 'async');
        }
      });

      console.log('✅ Images optimized for SEO');
    } catch (error) {
      console.error('❌ Error optimizing images:', error);
    }
  }

  /**
   * Add breadcrumb navigation for better SEO
   */
  addBreadcrumbs(breadcrumbs: Array<{ name: string; url: string }>): void {
    try {
      const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: crumb.url
        }))
      };

      this.addStructuredData(structuredData);
      console.log('✅ Breadcrumbs added successfully', breadcrumbs);
    } catch (error) {
      console.error('❌ Error adding breadcrumbs:', error);
    }
  }

  /**
   * Track page views for analytics
   */
  trackPageView(page: string, title?: string): void {
    try {
      // Send to Google Analytics if available
      if (typeof gtag !== 'undefined') {
        gtag('config', 'GA_MEASUREMENT_ID', {
          page_title: title || document.title,
          page_location: window.location.href,
          page_path: page
        });
      }

      // Send to custom analytics
      this.sendCustomAnalytics('page_view', {
        page,
        title: title || document.title,
        url: window.location.href,
        timestamp: Date.now()
      });

      console.log('✅ Page view tracked', { page, title });
    } catch (error) {
      console.error('❌ Error tracking page view:', error);
    }
  }

  /**
   * Track user interactions for analytics
   */
  trackUserInteraction(action: string, category: string, label?: string, value?: number): void {
    try {
      // Send to Google Analytics if available
      if (typeof gtag !== 'undefined') {
        gtag('event', action, {
          event_category: category,
          event_label: label,
          value: value
        });
      }

      // Send to custom analytics
      this.sendCustomAnalytics('user_interaction', {
        action,
        category,
        label,
        value,
        timestamp: Date.now()
      });

      console.log('✅ User interaction tracked', { action, category, label, value });
    } catch (error) {
      console.error('❌ Error tracking user interaction:', error);
    }
  }

  /**
   * Send custom analytics data
   */
  private sendCustomAnalytics(event: string, data: any): void {
    try {
      // You can implement your own analytics service here
      // For now, we'll just log to console
      console.log('📊 Analytics Event:', event, data);
      
      // Example: Send to your analytics endpoint
      // fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ event, data })
      // });
    } catch (error) {
      console.error('❌ Error sending analytics:', error);
    }
  }

  /**
   * Optimize page performance for SEO
   */
  optimizePerformance(): void {
    try {
      // Preload critical resources
      this.preloadCriticalResources();
      
      // Add performance monitoring
      this.addPerformanceMonitoring();
      
      console.log('✅ Performance optimization completed');
    } catch (error) {
      console.error('❌ Error optimizing performance:', error);
    }
  }

  /**
   * Preload critical resources
   */
  private preloadCriticalResources(): void {
    try {
      // Preload critical CSS
      const criticalCSS = document.createElement('link');
      criticalCSS.rel = 'preload';
      criticalCSS.href = '/src/index.css';
      criticalCSS.as = 'style';
      document.head.appendChild(criticalCSS);

      // Preload critical fonts
      const fontPreload = document.createElement('link');
      fontPreload.rel = 'preload';
      fontPreload.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
      fontPreload.as = 'style';
      document.head.appendChild(fontPreload);

    } catch (error) {
      console.error('❌ Error preloading resources:', error);
    }
  }

  /**
   * Add performance monitoring
   */
  private addPerformanceMonitoring(): void {
    try {
      // Monitor Core Web Vitals
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
              this.trackUserInteraction('lcp', 'performance', 'largest_contentful_paint', Math.round(entry.startTime));
            }
            if (entry.entryType === 'first-input') {
              this.trackUserInteraction('fid', 'performance', 'first_input_delay', Math.round(entry.processingStart - entry.startTime));
            }
          }
        });

        observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
      }

    } catch (error) {
      console.error('❌ Error adding performance monitoring:', error);
    }
  }
}

// Export singleton instance
export const seoService = new SEOService();
export default seoService;
