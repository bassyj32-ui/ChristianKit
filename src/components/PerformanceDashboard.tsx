import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { rateLimitService } from '../services/rateLimitService';
import { contentModerationService } from '../services/contentModerationService';
import { enhancedCacheService } from '../services/enhancedCacheService';

interface DashboardStats {
  rateLimits: {
    totalKeys: number;
    activeKeys: number;
    expiredKeys: number;
  };
  moderation: {
    totalPosts: number;
    approvedPosts: number;
    flaggedPosts: number;
    blockedPosts: number;
    reviewRequired: number;
  };
  cache: {
    totalKeys: number;
    hitRate: number;
    memoryUsage: number;
  };
}

interface RateLimitEntry {
  key: string;
  count: number;
  resetTime: number;
}

interface ModerationLog {
  id: string;
  author_id: string;
  content_preview: string;
  is_approved: boolean;
  moderation_reason?: string;
  confidence_score: number;
  flags: string[];
  requires_review: boolean;
  created_at: string;
}

const PerformanceDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'rate-limits' | 'moderation' | 'cache'>('overview');
  const [rateLimitEntries, setRateLimitEntries] = useState<RateLimitEntry[]>([]);
  const [moderationLogs, setModerationLogs] = useState<ModerationLog[]>([]);
  const [cacheStats, setCacheStats] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load rate limit stats
      const rateLimitStats = await getRateLimitStats();
      
      // Load moderation stats
      const moderationStats = await getModerationStats();
      
      // Load cache stats
      const cacheStats = enhancedCacheService.getStats();
      
      // Load active rate limits
      const activeLimits = rateLimitService.getActiveLimits();
      const rateLimitEntries = Array.from(activeLimits.entries()).map(([key, value]) => ({
        key,
        count: value.count,
        resetTime: value.resetTime
      }));

      setStats({
        rateLimits: rateLimitStats,
        moderation: moderationStats,
        cache: cacheStats
      });
      
      setRateLimitEntries(rateLimitEntries);
      setCacheStats(cacheStats);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRateLimitStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_rate_limit_stats');
      if (error) throw error;
      
      const result = data?.[0] || { total_keys: 0, active_keys: 0, expired_keys: 0 };
      return {
        totalKeys: result.total_keys || 0,
        activeKeys: result.active_keys || 0,
        expiredKeys: result.expired_keys || 0
      };
    } catch (error) {
      console.error('Error fetching rate limit stats:', error);
      return { totalKeys: 0, activeKeys: 0, expiredKeys: 0 };
    }
  };

  const getModerationStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_moderation_stats');
      if (error) throw error;
      
      const result = data?.[0] || { 
        total_posts: 0, 
        approved_posts: 0, 
        flagged_posts: 0, 
        blocked_posts: 0, 
        review_required: 0 
      };
      
      return {
        totalPosts: result.total_posts || 0,
        approvedPosts: result.approved_posts || 0,
        flaggedPosts: result.flagged_posts || 0,
        blockedPosts: result.blocked_posts || 0,
        reviewRequired: result.review_required || 0
      };
    } catch (error) {
      console.error('Error fetching moderation stats:', error);
      return { 
        totalPosts: 0, 
        approvedPosts: 0, 
        flaggedPosts: 0, 
        blockedPosts: 0, 
        reviewRequired: 0 
      };
    }
  };

  const loadModerationLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('moderation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setModerationLogs(data || []);
    } catch (error) {
      console.error('Error loading moderation logs:', error);
    }
  };

  const resetRateLimit = async (userId: string, actionType: string) => {
    try {
      await rateLimitService.resetRateLimit(userId, actionType as any);
      await loadDashboardData();
    } catch (error) {
      console.error('Error resetting rate limit:', error);
    }
  };

  const clearCache = async () => {
    try {
      await enhancedCacheService.clear();
      await loadDashboardData();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatTimeRemaining = (resetTime: number) => {
    const remaining = resetTime - Date.now();
    if (remaining <= 0) return 'Expired';
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Performance & Security Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Monitor rate limits, content moderation, and cache performance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Rate Limits */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Rate Limits</h3>
              <span className="text-sm text-gray-500">Active</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Keys:</span>
                <span className="font-medium">{stats?.rateLimits.totalKeys || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active:</span>
                <span className="font-medium text-green-600">{stats?.rateLimits.activeKeys || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expired:</span>
                <span className="font-medium text-red-600">{stats?.rateLimits.expiredKeys || 0}</span>
              </div>
            </div>
          </div>

          {/* Content Moderation */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Content Moderation</h3>
              <span className="text-sm text-gray-500">Today</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Posts:</span>
                <span className="font-medium">{stats?.moderation.totalPosts || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Approved:</span>
                <span className="font-medium text-green-600">{stats?.moderation.approvedPosts || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Review Required:</span>
                <span className="font-medium text-yellow-600">{stats?.moderation.reviewRequired || 0}</span>
              </div>
            </div>
          </div>

          {/* Cache Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Cache Performance</h3>
              <span className="text-sm text-gray-500">Real-time</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Keys:</span>
                <span className="font-medium">{stats?.cache.totalKeys || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hit Rate:</span>
                <span className="font-medium text-blue-600">
                  {((stats?.cache.hitRate || 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Memory:</span>
                <span className="font-medium">
                  {Math.round((stats?.cache.memoryUsage || 0) / 1024)} KB
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'rate-limits', label: 'Rate Limits' },
                { id: 'moderation', label: 'Moderation' },
                { id: 'cache', label: 'Cache' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">System Health</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                        <span className="text-green-800 font-medium">Rate Limiting Active</span>
                      </div>
                      <p className="text-green-700 text-sm mt-1">
                        {stats?.rateLimits.activeKeys || 0} active rate limits
                      </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-400 rounded-full mr-3"></div>
                        <span className="text-blue-800 font-medium">Content Moderation</span>
                      </div>
                      <p className="text-blue-700 text-sm mt-1">
                        {stats?.moderation.reviewRequired || 0} posts require review
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                  <div className="flex space-x-4">
                    <button
                      onClick={clearCache}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Clear All Cache
                    </button>
                    <button
                      onClick={loadDashboardData}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Refresh Data
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Rate Limits Tab */}
            {activeTab === 'rate-limits' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Active Rate Limits</h3>
                  <button
                    onClick={loadDashboardData}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Refresh
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Key
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Count
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reset Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time Remaining
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rateLimitEntries.map((entry, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {entry.key}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {entry.count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatTime(entry.resetTime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatTimeRemaining(entry.resetTime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => {
                                const [actionType, userId] = entry.key.split(':');
                                resetRateLimit(userId, actionType);
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reset
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Moderation Tab */}
            {activeTab === 'moderation' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Recent Moderation Logs</h3>
                  <button
                    onClick={loadModerationLogs}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Load Logs
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Content Preview
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Confidence
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Flags
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {moderationLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                            {log.content_preview}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                log.is_approved
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {log.is_approved ? 'Approved' : 'Rejected'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(log.confidence_score * 100).toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {log.flags.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {log.flags.slice(0, 3).map((flag, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded"
                                  >
                                    {flag}
                                  </span>
                                ))}
                                {log.flags.length > 3 && (
                                  <span className="text-xs text-gray-500">
                                    +{log.flags.length - 3} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">None</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(log.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Cache Tab */}
            {activeTab === 'cache' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Cache Performance</h3>
                  <button
                    onClick={clearCache}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Clear Cache
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Memory Usage</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Keys:</span>
                        <span className="font-medium">{cacheStats?.totalKeys || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Memory Used:</span>
                        <span className="font-medium">
                          {Math.round((cacheStats?.memoryUsage || 0) / 1024)} KB
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Hit Rate:</span>
                        <span className="font-medium text-blue-600">
                          {((cacheStats?.hitRate || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Cache Categories</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Posts:</span>
                        <span className="font-medium">Active</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">User Profiles:</span>
                        <span className="font-medium">Active</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Trending:</span>
                        <span className="font-medium">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
