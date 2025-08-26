import React, { useState, useEffect } from 'react';
import { useAnalytics } from './AnalyticsProvider';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  pageViews: number;
  conversionRate: number;
  subscriptionRevenue: number;
  topFeatures: Array<{ name: string; usage: number }>;
}

export const AnalyticsDashboard: React.FC = () => {
  const analytics = useAnalytics();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalUsers: 0,
    activeUsers: 0,
    pageViews: 0,
    conversionRate: 0,
    subscriptionRevenue: 0,
    topFeatures: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // Track dashboard view
  useEffect(() => {
    analytics.trackFeatureUsage('analytics_dashboard', 'viewed');
  }, [analytics]);

  // Simulate loading analytics data
  useEffect(() => {
    const loadAnalyticsData = async () => {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - in real implementation, this would come from GA4 API
      setAnalyticsData({
        totalUsers: 1250,
        activeUsers: 342,
        pageViews: 5670,
        conversionRate: 8.5,
        subscriptionRevenue: 3750,
        topFeatures: [
          { name: 'Prayer Timer', usage: 89 },
          { name: 'Bible Reading', usage: 76 },
          { name: 'Weekly Progress', usage: 65 },
          { name: 'Community', usage: 52 },
          { name: 'Monthly Habits', usage: 48 },
        ],
      });
      
      setIsLoading(false);
    };

    loadAnalyticsData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)] mx-auto mb-4"></div>
            <p className="text-[var(--text-secondary)]">Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4 font-mono tracking-wider">
            📊 Analytics Dashboard
          </h1>
          <p className="text-slate-300 text-xl max-w-2xl mx-auto">
            Track your app's performance and user engagement
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Total Users */}
          <div className="osmo-card p-6 text-center">
            <div className="text-3xl font-bold text-[var(--accent-primary)] mb-2">
              {analyticsData.totalUsers.toLocaleString()}
            </div>
            <div className="text-[var(--text-secondary)] text-sm">Total Users</div>
          </div>

          {/* Active Users */}
          <div className="osmo-card p-6 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {analyticsData.activeUsers.toLocaleString()}
            </div>
            <div className="text-[var(--text-secondary)] text-sm">Active Users</div>
          </div>

          {/* Page Views */}
          <div className="osmo-card p-6 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {analyticsData.pageViews.toLocaleString()}
            </div>
            <div className="text-[var(--text-secondary)] text-sm">Page Views</div>
          </div>

          {/* Conversion Rate */}
          <div className="osmo-card p-6 text-center">
            <div className="text-3xl font-bold text-amber-400 mb-2">
              {formatPercentage(analyticsData.conversionRate)}
            </div>
            <div className="text-[var(--text-secondary)] text-sm">Conversion Rate</div>
          </div>
        </div>

        {/* Revenue & Features Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Revenue Card */}
          <div className="osmo-card p-8">
            <h2 className="text-2xl font-bold text-white mb-6">💰 Revenue Overview</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)]">Monthly Revenue</span>
                <span className="text-2xl font-bold text-green-400">
                  {formatCurrency(analyticsData.subscriptionRevenue)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)]">Pro Subscribers</span>
                <span className="text-xl font-semibold text-white">
                  {Math.round(analyticsData.subscriptionRevenue / 30)} users
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)]">Avg. Revenue per User</span>
                <span className="text-xl font-semibold text-white">
                  {formatCurrency(analyticsData.subscriptionRevenue / Math.round(analyticsData.subscriptionRevenue / 30))}
                </span>
              </div>
            </div>
          </div>

          {/* Top Features Card */}
          <div className="osmo-card p-8">
            <h2 className="text-2xl font-bold text-white mb-6">⭐ Top Features</h2>
            <div className="space-y-4">
              {analyticsData.topFeatures.map((feature, index) => (
                <div key={feature.name} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📊'}</span>
                    <span className="text-[var(--text-secondary)]">{feature.name}</span>
                  </div>
                  <span className="text-white font-semibold">{feature.usage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <button
            onClick={() => analytics.trackEvent('export', 'analytics', 'dashboard_data')}
            className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white py-3 px-8 rounded-2xl font-semibold hover:from-[var(--accent-primary)]/90 hover:to-[var(--accent-secondary)]/90 transition-all duration-300"
          >
            📊 Export Data
          </button>
          
          <div className="text-sm text-[var(--text-tertiary)]">
            Data refreshes every 24 hours from Google Analytics 4
          </div>
        </div>

        {/* GA4 Setup Reminder */}
        <div className="mt-12 p-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
          <h3 className="text-lg font-semibold text-amber-100 mb-2">🔧 Setup Reminder</h3>
          <p className="text-amber-200 text-sm mb-3">
            To see real data, make sure you've:
          </p>
          <ul className="text-amber-200 text-sm space-y-1 ml-4">
            <li>• Set your GA4 Measurement ID in environment variables</li>
            <li>• Configured conversion goals in GA4 dashboard</li>
            <li>• Set up e-commerce tracking for subscriptions</li>
            <li>• Enabled enhanced measurement features</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
