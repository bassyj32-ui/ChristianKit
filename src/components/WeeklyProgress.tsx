import React, { useState, useEffect } from 'react';

interface ProgressData {
  day: string;
  prayer: number;
  bible: number;
  meditation: number;
  journal: number;
}

interface WeeklyProgressProps {
  showSummary?: boolean;
  embedded?: boolean;
}

export const WeeklyProgress: React.FC<WeeklyProgressProps> = ({ 
  showSummary = true, 
  embedded = false 
}) => {
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<ProgressData[]>([]);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      const mockData: ProgressData[] = [
        { day: 'Sun', prayer: 85, bible: 70, meditation: 60, journal: 45 },
        { day: 'Mon', prayer: 90, bible: 80, meditation: 75, journal: 60 },
        { day: 'Tue', prayer: 75, bible: 85, meditation: 80, journal: 70 },
        { day: 'Wed', prayer: 95, bible: 90, meditation: 85, journal: 80 },
        { day: 'Thu', prayer: 80, bible: 75, meditation: 70, journal: 65 },
        { day: 'Fri', prayer: 85, bible: 80, meditation: 75, journal: 70 },
        { day: 'Sat', prayer: 70, bible: 65, meditation: 60, journal: 55 }
      ];
      setProgressData(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  const calculateAverage = (data: ProgressData[], activity: keyof ProgressData): number => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, day) => acc + (day[activity] as number), 0);
    return Math.round(sum / data.length);
  };

  const getWeeklySummaryMessage = (data: ProgressData[]): string => {
    const avgPrayer = calculateAverage(data, 'prayer');
    if (avgPrayer >= 85) return "Outstanding prayer consistency this week! You're truly inspiring!";
    if (avgPrayer >= 70) return "Great job maintaining your prayer routine! Keep up the momentum!";
    return "Every prayer session counts! You're building a strong foundation.";
  };

  if (loading) {
    return (
      <div className={`${embedded ? 'py-4' : 'min-h-screen py-8 px-4'} ${embedded ? '' : 'bg-[var(--bg-primary)]'} text-[var(--text-primary)]`}>
        <div className="text-center">
          <div className={`${embedded ? 'text-2xl' : 'text-4xl'} mb-4`}>📊</div>
          <p className="text-[var(--text-secondary)]">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${embedded ? '' : 'min-h-screen bg-[var(--bg-primary)] py-8 px-4'} text-[var(--text-primary)]`}>
      {/* Header - only show when not embedded */}
      {!embedded && (
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Your Weekly{' '}
            <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent">
              Progress
            </span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Track your spiritual journey and celebrate your growth
          </p>
        </div>
      )}

      {/* Progress Overview Card */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="osmo-card">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">This Week's Highlights</h2>
            <p className="text-[var(--text-secondary)]">Keep up the great work!</p>
          </div>
          
          <div className={`grid grid-cols-7 ${embedded ? 'gap-1' : 'gap-2 sm:gap-4'} mb-6`}>
            {progressData.map((day, index) => {
              const todayIndex = new Date().getDay();
              const isToday = index === todayIndex;
              return (
                <div key={day.day} className={`text-center ${embedded ? 'p-1.5' : 'p-3'} rounded-xl bg-[var(--glass-light)]/5 backdrop-blur-xl border border-[var(--glass-border)]/10 relative overflow-hidden group hover:bg-[var(--glass-light)]/8 transition-all duration-300 ${isToday ? 'ring-2 ring-[var(--accent-primary)]/60 shadow-lg shadow-[var(--accent-primary)]/20' : ''}`}>
                  <div className="relative z-10">
                    <div className={`${embedded ? 'text-xs' : 'text-xs sm:text-sm'} font-medium ${embedded ? 'mb-1' : 'mb-2'} ${isToday ? 'text-[var(--accent-primary)] font-bold' : 'text-[var(--text-primary)]/90'}`}>
                      {day.day} {isToday ? '●' : ''}
                    </div>
                    <div className={`${embedded ? 'space-y-0.5' : 'space-y-1 sm:space-y-2'}`}>
                      {['prayer', 'bible', 'meditation', 'journal'].map((activity) => {
                        const value = day[activity as keyof ProgressData] as number;
                        return (
                          <div key={activity} className="relative">
                            <div className={`w-full bg-[var(--glass-dark)]/30 backdrop-blur-sm rounded-full ${embedded ? 'h-1' : 'h-1 sm:h-2'} border border-[var(--glass-border)]/10`}>
                              <div
                                className={`${embedded ? 'h-1' : 'h-1 sm:h-2'} rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] transition-all duration-500`}
                                style={{ width: `${value}%` }}
                              />
                            </div>
                            {!embedded && <div className="text-xs text-[var(--text-secondary)] mt-1">{value}%</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Activity Legend */}
          <div className={`grid ${embedded ? 'grid-cols-4' : 'grid-cols-2 md:grid-cols-4'} ${embedded ? 'gap-1' : 'gap-3 sm:gap-4'} ${embedded ? 'p-2' : 'p-4'} bg-[var(--glass-light)]/5 rounded-xl border border-[var(--glass-border)]/10`}>
            <div className={`flex items-center ${embedded ? 'space-x-1' : 'space-x-2'}`}>
              <div className={`${embedded ? 'w-3 h-3' : 'w-4 h-4'} bg-gradient-to-r from-[var(--spiritual-green)] to-[var(--spiritual-emerald)] rounded-lg shadow-lg`}></div>
              <span className={`${embedded ? 'text-xs' : 'text-xs sm:text-sm'} text-[var(--text-primary)] font-medium`}>{embedded ? '🙏' : '🙏 Prayer'}</span>
            </div>
            <div className={`flex items-center ${embedded ? 'space-x-1' : 'space-x-2'}`}>
              <div className={`${embedded ? 'w-3 h-3' : 'w-4 h-4'} bg-gradient-to-r from-[var(--spiritual-blue)] to-[var(--spiritual-cyan)] rounded-lg shadow-lg`}></div>
              <span className={`${embedded ? 'text-xs' : 'text-xs sm:text-sm'} text-[var(--text-primary)] font-medium`}>{embedded ? '📖' : '📖 Bible'}</span>
            </div>
            <div className={`flex items-center ${embedded ? 'space-x-1' : 'space-x-2'}`}>
              <div className={`${embedded ? 'w-3 h-3' : 'w-4 h-4'} bg-gradient-to-r from-[var(--spiritual-purple)] to-[var(--spiritual-violet)] rounded-lg shadow-lg`}></div>
              <span className={`${embedded ? 'text-xs' : 'text-xs sm:text-sm'} text-[var(--text-primary)] font-medium`}>{embedded ? '🧘' : '🧘 Meditation'}</span>
            </div>
            <div className={`flex items-center ${embedded ? 'space-x-1' : 'space-x-2'}`}>
              <div className={`${embedded ? 'w-3 h-3' : 'w-4 h-4'} bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-lg shadow-lg`}></div>
              <span className={`${embedded ? 'text-xs' : 'text-xs sm:text-sm'} text-[var(--text-primary)] font-medium`}>{embedded ? '📝' : '📝 Journal'}</span>
            </div>
          </div>
        </div>
      </div>
            
      {/* Weekly Stats */}
      <div className={`${embedded ? 'grid grid-cols-2 gap-2' : 'flex flex-row overflow-x-auto gap-4 w-full pb-2'} mb-8`}>
        <div className={`${embedded ? '' : 'flex-shrink-0 w-80 sm:w-auto sm:flex-1'} bg-[var(--glass-light)]/90 backdrop-blur-sm rounded-2xl ${embedded ? 'p-3' : 'p-4 sm:p-6'} border border-[var(--glass-border)] shadow-xl`}>
          <div className="text-center">
            <div className={`${embedded ? 'text-lg' : 'text-2xl sm:text-3xl'} font-bold text-[var(--spiritual-green)] ${embedded ? 'mb-1' : 'mb-2'}`}>
              {calculateAverage(progressData, 'prayer')}%
            </div>
            <div className={`${embedded ? 'text-xs' : 'text-sm'} text-[var(--text-secondary)]`}>{embedded ? 'Prayer' : 'Prayer Average'}</div>
          </div>
        </div>
        
        <div className={`${embedded ? '' : 'flex-shrink-0 w-80 sm:w-auto sm:flex-1'} bg-[var(--glass-light)]/90 backdrop-blur-sm rounded-2xl ${embedded ? 'p-3' : 'p-4 sm:p-6'} border border-[var(--glass-border)] shadow-xl`}>
          <div className="text-center">
            <div className={`${embedded ? 'text-lg' : 'text-2xl sm:text-3xl'} font-bold text-[var(--spiritual-blue)] ${embedded ? 'mb-1' : 'mb-2'}`}>
              {calculateAverage(progressData, 'bible')}%
            </div>
            <div className={`${embedded ? 'text-xs' : 'text-sm'} text-[var(--text-secondary)]`}>{embedded ? 'Bible' : 'Bible Study Average'}</div>
          </div>
        </div>

        <div className={`${embedded ? '' : 'flex-shrink-0 w-80 sm:w-auto sm:flex-1'} bg-[var(--glass-light)]/90 backdrop-blur-sm rounded-2xl ${embedded ? 'p-3' : 'p-4 sm:p-6'} border border-[var(--glass-border)] shadow-xl`}>
          <div className="text-center">
            <div className={`${embedded ? 'text-lg' : 'text-2xl sm:text-3xl'} font-bold text-[var(--spiritual-purple)] ${embedded ? 'mb-1' : 'mb-2'}`}>
              {calculateAverage(progressData, 'meditation')}%
            </div>
            <div className={`${embedded ? 'text-xs' : 'text-sm'} text-[var(--text-secondary)]`}>{embedded ? 'Meditation' : 'Meditation Average'}</div>
          </div>
        </div>

        <div className={`${embedded ? '' : 'flex-shrink-0 w-80 sm:w-auto sm:flex-1'} bg-[var(--glass-light)]/90 backdrop-blur-sm rounded-2xl ${embedded ? 'p-3' : 'p-4 sm:p-6'} border border-[var(--glass-border)] shadow-xl`}>
          <div className="text-center">
            <div className={`${embedded ? 'text-lg' : 'text-2xl sm:text-3xl'} font-bold text-[var(--accent-primary)] ${embedded ? 'mb-1' : 'mb-2'}`}>
              {calculateAverage(progressData, 'journal')}%
            </div>
            <div className={`${embedded ? 'text-xs' : 'text-sm'} text-[var(--text-secondary)]`}>{embedded ? 'Journal' : 'Journal Average'}</div>
          </div>
        </div>
      </div>

      {/* Weekly Summary */}
      {showSummary && (
        <div className="bg-gradient-to-r from-[var(--spiritual-green)]/50 to-[var(--spiritual-emerald)]/50 rounded-3xl p-6 sm:p-8 border border-[var(--glass-border)] shadow-2xl">
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-4">Weekly Summary</h3>
            <p className="text-[var(--text-secondary)] mb-6">
              {getWeeklySummaryMessage(progressData)}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button className="bg-[var(--glass-medium)] text-[var(--text-primary)] px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium hover:bg-[var(--glass-light)] transition-all duration-200 transform hover:scale-105">
                View Details
              </button>
              <button className="bg-gradient-to-r from-[var(--spiritual-green)] to-[var(--spiritual-emerald)] text-[var(--text-inverse)] px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium hover:from-[var(--spiritual-green)]/80 hover:to-[var(--spiritual-emerald)]/80 transition-all duration-200 transform hover:scale-105">
                Set Goals
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

