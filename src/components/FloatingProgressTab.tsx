import React, { useState, useEffect } from 'react';
import { unifiedProgressService, UnifiedProgressStats } from '../services/UnifiedProgressService';
import { useSupabaseAuth } from './SupabaseAuthProvider';

interface FloatingProgressTabProps {
  onPrayerStart?: () => void;
}

export const FloatingProgressTab: React.FC<FloatingProgressTabProps> = ({ 
  onPrayerStart
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [progressStats, setProgressStats] = useState<UnifiedProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'offline' | 'syncing'>('syncing');
  const { user } = useSupabaseAuth();

  useEffect(() => {
    loadProgressData();
    // Show tab after a professional delay
    setTimeout(() => setIsVisible(true), 1500);
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadProgressData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const loadProgressData = async () => {
    try {
      setConnectionStatus('syncing');
      setLoading(true);
      
      const stats = await unifiedProgressService.getProgressStats(user?.id);
      setProgressStats(stats);
      setLastUpdated(new Date());
      
      // Set connection status based on data source
      if (stats.dataSource === 'supabase') {
        setConnectionStatus('connected');
      } else if (stats.dataSource === 'localStorage' || stats.dataSource === 'prayerSystem') {
        setConnectionStatus('offline');
      } else {
        setConnectionStatus('offline');
      }
      
    } catch (error) {
      console.error('Error loading progress data:', error);
      setConnectionStatus('offline');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadProgressData();
  };

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-400';
      case 'syncing': return 'bg-yellow-400 animate-pulse';
      case 'offline': return 'bg-orange-400';
      default: return 'bg-gray-400';
    }
  };

  const getDataSourceLabel = (source: string) => {
    switch (source) {
      case 'supabase': return 'Live Data';
      case 'localStorage': return 'Local Data';
      case 'prayerSystem': return 'System Data';
      default: return 'No Data';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'advanced':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        );
      case 'intermediate':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm0-4h-2V7h2v8z"/>
          </svg>
        );
    }
  };

  const getProgressPercentage = (current: number, target: number = 7): number => {
    return Math.min(100, Math.round((current / target) * 100));
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Floating Tab */}
      <div className={`fixed right-0 top-1/2 transform -translate-y-1/2 z-50 transition-all duration-500 ease-out ${isExpanded ? 'translate-x-0' : 'translate-x-0'}`}>
        
        {/* Expanded Panel */}
        {isExpanded && progressStats && (
          <div className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-gray-950/98 backdrop-blur-sm rounded-l-xl border-l-2 border-l-yellow-500/30 border-t border-b border-gray-800/60 shadow-2xl min-w-[320px] animate-slideIn">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800/60">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${getConnectionColor()}`}></div>
                <div className="text-sm font-medium text-gray-100">
                  Spiritual Progress Analytics
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-200 transition-colors duration-200 p-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Real Data Status */}
            <div className="px-4 py-3 bg-gray-900/50 border-b border-gray-800/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${getConnectionColor()}`}></div>
                  <span className="text-xs text-gray-300 font-medium">
                    {getDataSourceLabel(progressStats.dataSource)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {lastUpdated && (
                    <span className="text-xs text-gray-500">
                      {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="text-gray-400 hover:text-gray-200 transition-colors duration-200 p-1"
                  >
                    <svg className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Progress Analytics */}
            <div className="p-4 space-y-4">
              {/* Current Streak with Visual Progress */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Current Streak</span>
                  <span className="text-xl font-bold text-white">{progressStats.currentStreak}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all duration-700 relative overflow-hidden"
                    style={{ width: `${getProgressPercentage(progressStats.currentStreak)}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 text-right">
                  {getProgressPercentage(progressStats.currentStreak)}% weekly goal
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-900/50 rounded-lg border border-gray-800/40">
                  <div className="text-lg font-bold text-white">{progressStats.totalPrayers}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Total</div>
                </div>
                <div className="text-center p-3 bg-gray-900/50 rounded-lg border border-gray-800/40">
                  <div className="text-lg font-bold text-white">{progressStats.daysThisMonth}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Month</div>
                </div>
                <div className="text-center p-3 bg-gray-900/50 rounded-lg border border-gray-800/40">
                  <div className="text-lg font-bold text-white">{progressStats.weeklyGoal}%</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Weekly</div>
                </div>
              </div>

              {/* Level & Performance */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-800/60">
                <div className="flex items-center space-x-2">
                  <div className="text-gray-300">{getLevelIcon(progressStats.currentLevel)}</div>
                  <span className="text-sm font-medium text-gray-200 capitalize">
                    {progressStats.currentLevel} Level
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {progressStats.averageSessionDuration > 0 && `${progressStats.averageSessionDuration}min avg`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Handle */}
        <div 
          className="bg-gray-950/98 backdrop-blur-sm border-l-2 border-l-yellow-500/40 border-t border-b border-gray-800/60 rounded-l-xl shadow-2xl cursor-pointer transition-all duration-300 hover:bg-gray-900/98 hover:border-gray-700/60 hover:border-l-yellow-400/60"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="p-3 flex flex-col items-center space-y-3 min-h-[120px] justify-center">
            {/* Connection Status */}
            <div className={`w-2 h-2 rounded-full ${getConnectionColor()}`}></div>
            
            {/* Level Icon */}
            <div className="text-gray-300">
              {loading ? (
                <div className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                getLevelIcon(progressStats?.currentLevel || 'beginner')
              )}
            </div>
            
            {/* Streak Number */}
            {progressStats && progressStats.currentStreak > 0 && (
              <div className="bg-blue-600 text-white text-xs rounded-full min-w-[20px] h-[20px] flex items-center justify-center font-bold border border-gray-800">
                {progressStats.currentStreak}
              </div>
            )}
            
            {/* Data Source Indicator */}
            <div className="text-gray-500 text-xs">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h18v2H3V3zm0 4h18v2H3V7zm0 4h18v2H3v-2zm0 4h18v2H3v-2z"/>
              </svg>
            </div>
            
            {/* Expand/Collapse Indicator */}
            <div className="text-gray-600 text-xs">
              <svg className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes slideIn {
          from { 
            opacity: 0; 
            transform: translateY(-50%) translateX(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(-50%) translateX(0); 
          }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </>
  );
};
