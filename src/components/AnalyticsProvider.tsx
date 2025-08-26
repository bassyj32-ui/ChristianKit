import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  initializeGA4, 
  trackPageView, 
  setUserId, 
  setUserProperties,
  trackEvent,
  trackSubscriptionEvent,
  trackFeatureUsage,
  trackUserEngagement,
  trackPrayerSession,
  trackProFeatureAccess,
  trackConversion,
  trackSubscriptionPurchase,
  trackError,
  trackPerformance,
  GA4_CONFIG 
} from '../config/ga4';

interface AnalyticsContextType {
  trackEvent: (action: string, category: string, label?: string, value?: number) => void;
  trackSubscriptionEvent: (action: 'started' | 'completed' | 'cancelled', plan: string) => void;
  trackFeatureUsage: (feature: string, action: 'viewed' | 'used' | 'completed') => void;
  trackUserEngagement: (action: 'login' | 'logout' | 'signup') => void;
  trackPrayerSession: (duration: number, type: 'timer' | 'meditation' | 'bible') => void;
  trackProFeatureAccess: (feature: string, hasAccess: boolean) => void;
  trackConversion: (plan: string, value: number) => void;
  trackSubscriptionPurchase: (plan: string, price: number, currency?: string) => void;
  trackError: (error: string, errorCode?: string) => void;
  trackPerformance: (metric: string, value: number) => void;
  setUserProperties: (properties: Record<string, string | number | boolean>) => void;
  setUserId: (userId: string) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: ReactNode;
  userId?: string;
  userEmail?: string;
  userSubscription?: 'free' | 'pro';
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ 
  children, 
  userId, 
  userEmail, 
  userSubscription 
}) => {
  const location = useLocation();

  // Initialize GA4 on component mount
  useEffect(() => {
    const initialized = initializeGA4();
    
    if (initialized) {
      console.log('🎯 Analytics Provider initialized');
    }
  }, []);

  // Track page views when location changes
  useEffect(() => {
    if (GA4_CONFIG.MEASUREMENT_ID && GA4_CONFIG.MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
      trackPageView(location.pathname, document.title);
    }
  }, [location]);

  // Set user properties when user data changes
  useEffect(() => {
    if (userId && GA4_CONFIG.MEASUREMENT_ID && GA4_CONFIG.MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
      setUserId(userId);
      
      const properties: Record<string, string | number | boolean> = {
        user_type: userSubscription || 'free',
        has_subscription: userSubscription === 'pro',
      };
      
      if (userEmail) {
        properties.user_email_domain = userEmail.split('@')[1] || 'unknown';
      }
      
      setUserProperties(properties);
    }
  }, [userId, userEmail, userSubscription]);

  const value: AnalyticsContextType = {
    trackEvent,
    trackSubscriptionEvent,
    trackFeatureUsage,
    trackUserEngagement,
    trackPrayerSession,
    trackProFeatureAccess,
    trackConversion,
    trackSubscriptionPurchase,
    trackError,
    trackPerformance,
    setUserProperties,
    setUserId,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// Custom hook to use analytics
export const useAnalytics = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

// Higher-order component for easy analytics integration
export const withAnalytics = <P extends object>(
  Component: React.ComponentType<P>,
  trackingProps?: Partial<AnalyticsContextType>
) => {
  return (props: P) => {
    const analytics = useAnalytics();
    
    // Merge tracking props with analytics context
    const enhancedAnalytics = { ...analytics, ...trackingProps };
    
    return <Component {...props} analytics={enhancedAnalytics} />;
  };
};
