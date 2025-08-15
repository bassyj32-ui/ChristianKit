import React, { useState, useEffect } from 'react';
import { PrayerSession, PrayerStats } from '../types/prayer';
import { prayerService } from '../services/prayerService';

interface PrayerHistoryProps {
  onNavigate?: (page: string) => void;
  onRestartSession?: (session: PrayerSession) => void;
}

export const PrayerHistory: React.FC<PrayerHistoryProps> = ({ onNavigate, onRestartSession }) => {
  const [sessions, setSessions] = useState<PrayerSession[]>([]);
  const [stats, setStats] = useState<PrayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<PrayerSession | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessionsData, statsData] = await Promise.all([
        prayerService.getPrayerSessions(),
        prayerService.getPrayerStats()
      ]);
      setSessions(sessionsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading prayer history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await prayerService.deletePrayerSession(sessionId);
      await loadData(); // Reload data
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMoodEmoji = (mood: string) => {
    const emojis: Record<string, string> = {
      peaceful: '😌',
      grateful: '🙏',
      worried: '😟',
      joyful: '😊',
      sad: '😔',
      anxious: '😰',
      hopeful: '🤗',
      thankful: '🙌'
    };
    return emojis[mood] || '🙏';
  };

  const getFocusColor = (focus: string) => {
    const colors: Record<string, string> = {
      gratitude: 'from-green-400 to-emerald-500',
      healing: 'from-blue-400 to-indigo-500',
      guidance: 'from-purple-400 to-pink-500',
      strength: 'from-orange-400 to-red-500',
      forgiveness: 'from-yellow-400 to-orange-500',
      worship: 'from-pink-400 to-rose-500'
    };
    return colors[focus.toLowerCase()] || 'from-gray-400 to-gray-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 pt-20">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your prayer journey...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 pt-20">
      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">Prayer History</h1>
          <p className="text-xl text-gray-600">Your spiritual journey with God</p>
        </div>

        {/* Back Button */}
        <div className="mb-8">
          <button
            onClick={() => onNavigate?.('prayer')}
            className="bg-white/80 backdrop-blur-sm border-2 border-green-300 text-green-700 px-6 py-3 rounded-2xl font-bold hover:bg-green-50 transition-all duration-300"
          >
            ← Back to Prayer
          </button>
        </div>

        {/* Statistics Cards */}
        {stats && stats.totalSessions > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-green-200 shadow-xl text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{stats.totalSessions}</div>
              <div className="text-gray-600 text-sm">Total Sessions</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-green-200 shadow-xl text-center">
              <div className="text-3xl font-bold text-emerald-600 mb-2">{stats.totalMinutes}</div>
              <div className="text-gray-600 text-sm">Total Minutes</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-green-200 shadow-xl text-center">
              <div className="text-3xl font-bold text-teal-600 mb-2">{stats.currentStreak}</div>
              <div className="text-gray-600 text-sm">Day Streak</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-green-200 shadow-xl text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{stats.averageDuration}</div>
              <div className="text-gray-600 text-sm">Avg. Minutes</div>
            </div>
          </div>
        )}

        {/* Prayer Sessions */}
        <div className="space-y-6">
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">No prayer sessions yet</h3>
              <p className="text-gray-600 mb-6">Start your first prayer to begin your journey</p>
              <button
                onClick={() => onNavigate?.('prayer')}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-2xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all duration-300"
              >
                Start Your First Prayer
              </button>
            </div>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-green-200 shadow-xl hover:shadow-2xl transition-all duration-300">
                
                {/* Session Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xl">🙏</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {formatDate(session.date)}
                      </h3>
                      <p className="text-gray-600">
                        {session.duration} minutes • {getMoodEmoji(session.mood)} {session.mood}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{session.duration}m</div>
                    <div className="text-sm text-gray-500">{formatTime(session.date)}</div>
                  </div>
                </div>
                
                {/* Focus Badge */}
                {session.focus && (
                  <div className="mb-4">
                    <span className={`inline-block bg-gradient-to-r ${getFocusColor(session.focus)} text-white px-4 py-2 rounded-full text-sm font-medium`}>
                      Focus: {session.focus}
                    </span>
                  </div>
                )}
                
                {/* Prayer Message */}
                {session.message && (
                  <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                    <p className="text-gray-700 italic">"{session.message}"</p>
                  </div>
                )}

                {/* Reflection */}
                {session.reflection && (
                  <div className="bg-blue-50 rounded-2xl p-4 mb-4 border-l-4 border-blue-400">
                    <h4 className="font-semibold text-blue-800 mb-2">Reflection:</h4>
                    <p className="text-blue-700">{session.reflection}</p>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onRestartSession?.(session)}
                      className="bg-green-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-600 transition-all duration-300"
                    >
                      🔄 Restart
                    </button>
                    <button
                      onClick={() => setSelectedSession(session)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-600 transition-all duration-300"
                    >
                      📖 View Details
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-green-600 font-semibold">✓ Completed</span>
                    <button
                      onClick={() => setShowDeleteConfirm(session.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Delete Confirmation */}
                {showDeleteConfirm === session.id && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-2xl p-4">
                    <p className="text-red-700 mb-3">Are you sure you want to delete this prayer session?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="bg-red-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-600 transition-all duration-300"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="bg-gray-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-gray-600 transition-all duration-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Session Details Modal */}
        {selectedSession && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Prayer Session Details</h2>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700">Date & Time</h3>
                  <p className="text-gray-600">
                    {new Date(selectedSession.date).toLocaleDateString()} at {formatTime(selectedSession.date)}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700">Duration</h3>
                  <p className="text-gray-600">{selectedSession.duration} minutes</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700">Mood</h3>
                  <p className="text-gray-600">{getMoodEmoji(selectedSession.mood)} {selectedSession.mood}</p>
                </div>
                
                {selectedSession.focus && (
                  <div>
                    <h3 className="font-semibold text-gray-700">Focus</h3>
                    <p className="text-gray-600">{selectedSession.focus}</p>
                  </div>
                )}
                
                {selectedSession.message && (
                  <div>
                    <h3 className="font-semibold text-gray-700">Prayer Message</h3>
                    <p className="text-gray-600 italic">"{selectedSession.message}"</p>
                  </div>
                )}
                
                {selectedSession.reflection && (
                  <div>
                    <h3 className="font-semibold text-gray-700">Reflection</h3>
                    <p className="text-gray-600">{selectedSession.reflection}</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => {
                    onRestartSession?.(selectedSession);
                    setSelectedSession(null);
                  }}
                  className="flex-1 bg-green-500 text-white py-3 rounded-2xl font-bold hover:bg-green-600 transition-all duration-300"
                >
                  🔄 Restart This Prayer
                </button>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-2xl font-bold hover:bg-gray-600 transition-all duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
