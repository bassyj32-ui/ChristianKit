// Performance optimization utilities for ChristianKit

export const performanceConfig = {
  // Preload critical resources
  preloadResources: () => {
    // Preload critical fonts
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap';
    fontLink.as = 'style';
    document.head.appendChild(fontLink);

    // Preload critical images
    const criticalImages = [
      '/icon-192x192.png',
      '/icon-512x512.png',
      '/christiankit-icon.svg'
    ];

    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = src;
      link.as = src.endsWith('.png') ? 'image' : 'image/svg+xml';
      document.head.appendChild(link);
    });
  },

  // Optimize image loading
  optimizeImages: () => {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src!;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  },

  // Debounce function for performance
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function for performance
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Cache management
  cacheManager: {
    set: (key: string, data: any, ttl: number = 3600000) => {
      const item = {
        data,
        timestamp: Date.now(),
        ttl
      };
      localStorage.setItem(`ck_${key}`, JSON.stringify(item));
    },

    get: (key: string) => {
      const item = localStorage.getItem(`ck_${key}`);
      if (!item) return null;

      const parsed = JSON.parse(item);
      if (Date.now() - parsed.timestamp > parsed.ttl) {
        localStorage.removeItem(`ck_${key}`);
        return null;
      }

      return parsed.data;
    },

    clear: (key?: string) => {
      if (key) {
        localStorage.removeItem(`ck_${key}`);
      } else {
        // Clear all ChristianKit cache
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith('ck_')) {
            localStorage.removeItem(k);
          }
        });
      }
    }
  },

  // Service worker utilities
  serviceWorker: {
    register: async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('✅ Service Worker registered:', registration.scope);

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version available
                  if (confirm('New version available! Refresh to update?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });

          return registration;
        } catch (error) {
          console.error('❌ Service Worker registration failed:', error);
          return null;
        }
      }
      return null;
    },

    unregister: async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
        console.log('✅ Service Worker unregistered');
      }
    }
  },

  // Network monitoring
  networkMonitor: {
    isOnline: () => navigator.onLine,

    onOnline: (callback: () => void) => {
      window.addEventListener('online', callback);
    },

    onOffline: (callback: () => void) => {
      window.addEventListener('offline', callback);
    },

    getConnectionType: () => {
      const connection = (navigator as any).connection;
      return connection?.effectiveType || 'unknown';
    }
  },

  // Memory management
  memoryManager: {
    getMemoryUsage: () => {
      const memInfo = (performance as any).memory;
      if (memInfo) {
        return {
          used: Math.round(memInfo.usedJSHeapSize / 1048576), // MB
          total: Math.round(memInfo.totalJSHeapSize / 1048576), // MB
          limit: Math.round(memInfo.jsHeapSizeLimit / 1048576) // MB
        };
      }
      return null;
    },

    forceGC: () => {
      if ((window as any).gc) {
        (window as any).gc();
        console.log('🧹 Forced garbage collection');
      }
    }
  }
};

// Performance monitoring
export const performanceMonitor = {
  mark: (name: string) => {
    if (performance.mark) {
      performance.mark(name);
    }
  },

  measure: (name: string, startMark: string, endMark: string) => {
    if (performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        console.log(`⏱️ ${name}: ${measure.duration.toFixed(2)}ms`);
        return measure.duration;
      } catch (error) {
        console.warn('Performance measure failed:', error);
      }
    }
    return null;
  },

  getMetrics: () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      return {
        dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcpConnect: navigation.connectEnd - navigation.connectStart,
        serverResponse: navigation.responseStart - navigation.requestStart,
        pageLoad: navigation.loadEventEnd - navigation.navigationStart,
        domInteractive: navigation.domInteractive - navigation.navigationStart,
        domComplete: navigation.domContentLoadedEventEnd - navigation.navigationStart
      };
    }
    return null;
  }
};

// Initialize performance optimizations on app start
export const initPerformanceOptimizations = () => {
  // Preload critical resources
  performanceConfig.preloadResources();

  // Register service worker
  performanceConfig.serviceWorker.register();

  // Monitor performance
  performanceMonitor.mark('app-start');

  // Clean up old cache on app load
  window.addEventListener('load', () => {
    performanceMonitor.mark('app-loaded');
    performanceMonitor.measure('app-load-time', 'app-start', 'app-loaded');

    // Clean up old cache entries after 24 hours
    setTimeout(() => {
      performanceConfig.cacheManager.clear();
    }, 24 * 60 * 60 * 1000);
  });

  // Memory monitoring (development only)
  if (import.meta.env.DEV) {
    setInterval(() => {
      const memory = performanceConfig.memoryManager.getMemoryUsage();
      if (memory && memory.used > 50) {
        console.warn('⚠️ High memory usage detected:', memory);
      }
    }, 30000);
  }
};
