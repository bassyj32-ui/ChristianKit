import ReactGA from 'react-ga4';

// GA4 Configuration
export const GA4_CONFIG = {
  // Replace with your actual Measurement ID from GA4
  MEASUREMENT_ID: import.meta.env.VITE_GA4_MEASUREMENT_ID || 'G-XXXXXXXXXX',
  
  // Environment tracking
  ENVIRONMENT: import.meta.env.MODE || 'development',
  
  // Debug mode for development
  DEBUG: import.meta.env.MODE === 'development',
};

// Initialize GA4
export const initializeGA4 = () => {
  if (GA4_CONFIG.MEASUREMENT_ID && GA4_CONFIG.MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    ReactGA.initialize(GA4_CONFIG.MEASUREMENT_ID, {
      debug: GA4_CONFIG.DEBUG,
      gaOptions: {
        siteSpeedSampleRate: 100,
      },
    });
    
    // GA4 initialized successfully
    return true;
  } else {
    console.warn('⚠️ GA4 Measurement ID not configured. Analytics will not work.');
    return false;
  }
};

// Page view tracking
export const trackPageView = (path: string, title?: string) => {
  if (GA4_CONFIG.MEASUREMENT_ID && GA4_CONFIG.MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    ReactGA.send({
      hitType: 'pageview',
      page: path,
      title: title || document.title,
    });
  }
};

// Event tracking
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (GA4_CONFIG.MEASUREMENT_ID && GA4_CONFIG.MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    ReactGA.event({
      action,
      category,
      label,
      value,
    });
  }
};

// Custom event tracking for ChristianKit specific actions
export const trackSubscriptionEvent = (action: 'started' | 'completed' | 'cancelled', plan: string) => {
  trackEvent(action, 'subscription', plan);
};

export const trackFeatureUsage = (feature: string, action: 'viewed' | 'used' | 'completed') => {
  trackEvent(action, 'feature_usage', feature);
};

export const trackUserEngagement = (action: 'login' | 'logout' | 'signup') => {
  trackEvent(action, 'user_engagement');
};

export const trackPrayerSession = (duration: number, type: 'timer' | 'meditation' | 'bible') => {
  trackEvent('completed', 'prayer_session', type, Math.round(duration / 60)); // Convert to minutes
};

export const trackProFeatureAccess = (feature: string, hasAccess: boolean) => {
  trackEvent(hasAccess ? 'accessed' : 'blocked', 'pro_feature', feature);
};

// Conversion tracking
export const trackConversion = (plan: string, value: number) => {
  trackEvent('conversion', 'subscription', plan, value);
};

// User properties
export const setUserProperties = (properties: Record<string, string | number | boolean>) => {
  if (GA4_CONFIG.MEASUREMENT_ID && GA4_CONFIG.MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    ReactGA.set(properties);
  }
};

// User ID tracking (when user logs in)
export const setUserId = (userId: string) => {
  if (GA4_CONFIG.MEASUREMENT_ID && GA4_CONFIG.MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    ReactGA.set({ user_id: userId });
  }
};

// E-commerce tracking for subscriptions
export const trackSubscriptionPurchase = (plan: string, price: number, currency: string = 'USD') => {
  if (GA4_CONFIG.MEASUREMENT_ID && GA4_CONFIG.MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    ReactGA.event('purchase', {
      currency: currency,
      value: price,
      items: [
        {
          item_id: plan,
          item_name: `ChristianKit Pro ${plan}`,
          price: price,
          quantity: 1,
        },
      ],
    });
  }
};

// Error tracking
export const trackError = (error: string, errorCode?: string) => {
  trackEvent('error', 'app_error', errorCode || 'unknown', 1);
};

// Performance tracking
export const trackPerformance = (metric: string, value: number) => {
  trackEvent('measure', 'performance', metric, value);
};
