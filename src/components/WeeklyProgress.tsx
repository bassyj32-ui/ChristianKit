import React, { useState, useEffect } from 'react';
import { ProgressService, WeeklyProgress as WeeklyProgressData, UserSession } from '../services/ProgressService';
import { useSupabaseAuth } from './SupabaseAuthProvider';

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
  const [realProgressData, setRealProgressData] = useState<WeeklyProgressData | null>(null);
  const { user } = useSupabaseAuth();

  useEffect(() => {
    const loadRealProgress = async () => {
      if (!user) {
        // Fallback to mock data if no user
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
        return;
      }

      try {
        // Get current week start (Sunday)
        const today = new Date();
        const dayOfWeek = today.getDay();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - dayOfWeek);
        const weekStartStr = weekStart.toISOString().split('T')[0];

        // Load real progress data
        const realData = await ProgressService.getWeeklyProgress(user.id, weekStartStr);
        setRealProgressData(realData);

        // Convert real data to display format
        const displayData: ProgressData[] = [];
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        for (let i = 0; i < 7; i++) {
          const currentDate = new Date(weekStart);
          currentDate.setDate(weekStart.getDate() + i);
          const dateStr = currentDate.toISOString().split('T')[0];
          
          const daySessions = realData.sessions.filter(s => s.session_date === dateStr);
          
          displayData.push({
            day: days[i],
            prayer: this.getDayProgress(daySessions, 'prayer'),
            bible: this.getDayProgress(daySessions, 'bible'),
            meditation: this.getDayProgress(daySessions, 'meditation'),
            journal: this.getDayProgress(daySessions, 'journal')
          });
        }
        
        setProgressData(displayData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading progress:', error);
        // Fallback to mock data on error
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
      }
    };

    loadRealProgress();
  }, [user]);

  const calculateAverage = (data: ProgressData[], activity: keyof ProgressData): number => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, day) => acc + (day[activity] as number), 0);
    return Math.round(sum / data.length);
  };

  // Get real calculated stats when available
  const getRealStats = () => {
    if (realProgressData) {
      return realProgressData.calculatedStats;
    }
    return {
      prayer: calculateAverage(progressData, 'prayer'),
      bible: calculateAverage(progressData, 'bible'),
      meditation: calculateAverage(progressData, 'meditation'),
      journal: calculateAverage(progressData, 'journal')
    };
  };

  // Helper method to calculate day progress from real sessions
  const getDayProgress = (sessions: UserSession[], activityType: 'prayer' | 'bible' | 'meditation' | 'journal'): number => {
    const activitySessions = sessions.filter(s => s.activity_type === activityType && s.completed);
    if (activitySessions.length === 0) return 0;
    
    // Calculate percentage based on completed duration vs planned duration
    const totalCompleted = activitySessions.reduce((sum, session) => 
      sum + (session.completed_duration || session.duration_minutes), 0
    );
    const totalPlanned = activitySessions.reduce((sum, session) => 
      sum + session.duration_minutes, 0
    );
    
    return Math.min(100, Math.round((totalCompleted / totalPlanned) * 100));
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
                    <div className={`${embedded ? 'text-sm' : 'text-sm sm:text-base'} font-bold ${embedded ? 'mb-1' : 'mb-2'} ${isToday ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
                      {day.day} {isToday ? '●' : ''}
                    </div>
                    <div className={`${embedded ? 'space-y-0.5' : 'space-y-1 sm:space-y-2'}`}>
                      {['prayer', 'bible', 'meditation', 'journal'].map((activity) => {
                        const value = day[activity as keyof ProgressData] as number;
                        return (
                          <div key={activity} className="relative">
                                                         <div className={`w-full bg-[var(--glass-dark)]/40 backdrop-blur-sm rounded-full ${embedded ? 'h-2' : 'h-2 sm:h-3'} border border-[var(--glass-border)]/20 shadow-inner`}>
                               <div
                                 className={`${embedded ? 'h-2' : 'h-2 sm:h-3'} rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] transition-all duration-500 shadow-lg`}
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
       <div className="max-w-4xl mx-auto mb-8">
         <div className="osmo-card">
           <div className="text-center mb-6">
             <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Weekly Averages</h2>
             <p className="text-[var(--text-secondary)]">Your spiritual journey progress</p>
           </div>
           
           <div className="space-y-4">
             {/* Prayer */}
             <div className="flex items-center justify-between p-4 bg-[var(--glass-light)]/5 rounded-xl border border-[var(--glass-border)]/10">
               <div className="flex items-center space-x-3">
                 <div className="w-4 h-4 bg-gradient-to-r from-[var(--spiritual-green)] to-[var(--spiritual-emerald)] rounded-lg shadow-lg"></div>
                 <span className="text-[var(--text-primary)] font-medium">Prayer</span>
               </div>
               <div className="flex items-center space-x-3">
                 <div className="w-32 bg-[var(--glass-dark)]/30 rounded-full h-3 border border-[var(--glass-border)]/20">
                   <div 
                     className="h-3 rounded-full bg-gradient-to-r from-[var(--spiritual-green)] to-[var(--spiritual-emerald)] shadow-lg transition-all duration-500"
                     style={{ width: `${getRealStats().prayer}%` }}
                   />
                 </div>
                 <span className="text-[var(--spiritual-green)] font-bold text-lg">{getRealStats().prayer}%</span>
               </div>
             </div>

             {/* Bible */}
             <div className="flex items-center justify-between p-4 bg-[var(--glass-light)]/5 rounded-xl border border-[var(--glass-border)]/10">
               <div className="flex items-center space-x-3">
                 <div className="w-4 h-4 bg-gradient-to-r from-[var(--spiritual-blue)] to-[var(--spiritual-cyan)] rounded-lg shadow-lg"></div>
                 <span className="text-[var(--text-primary)] font-medium">Bible</span>
               </div>
               <div className="flex items-center space-x-3">
                 <div className="w-32 bg-[var(--glass-dark)]/30 rounded-full h-3 border border-[var(--glass-border)]/20">
                   <div 
                     className="h-3 rounded-full bg-gradient-to-r from-[var(--spiritual-blue)] to-[var(--spiritual-cyan)] shadow-lg transition-all duration-500"
                     style={{ width: `${getRealStats().bible}%` }}
                   />
                 </div>
                 <span className="text-[var(--spiritual-blue)] font-bold text-lg">{getRealStats().bible}%</span>
               </div>
             </div>

             {/* Meditation */}
             <div className="flex items-center justify-between p-4 bg-[var(--glass-light)]/5 rounded-xl border border-[var(--glass-border)]/10">
               <div className="flex items-center space-x-3">
                 <div className="w-4 h-4 bg-gradient-to-r from-[var(--spiritual-purple)] to-[var(--spiritual-violet)] rounded-lg shadow-lg"></div>
                 <span className="text-[var(--text-primary)] font-medium">Meditation</span>
               </div>
               <div className="flex items-center space-x-3">
                 <div className="w-32 bg-[var(--glass-dark)]/30 rounded-full h-3 border border-[var(--glass-border)]/20">
                   <div 
                     className="h-3 rounded-full bg-gradient-to-r from-[var(--spiritual-purple)] to-[var(--spiritual-violet)] shadow-lg transition-all duration-500"
                     style={{ width: `${getRealStats().meditation}%` }}
                   />
                 </div>
                 <span className="text-[var(--spiritual-purple)] font-bold text-lg">{getRealStats().meditation}%</span>
               </div>
             </div>

             {/* Journal */}
             <div className="flex items-center justify-between p-4 bg-[var(--glass-light)]/5 rounded-xl border border-[var(--glass-border)]/10">
               <div className="flex items-center space-x-3">
                 <div className="w-4 h-4 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-lg shadow-lg"></div>
                 <span className="text-[var(--text-primary)] font-medium">Journal</span>
               </div>
               <div className="flex items-center space-x-3">
                 <div className="w-32 bg-[var(--glass-dark)]/30 rounded-full h-3 border border-[var(--glass-border)]/20">
                   <div 
                     className="h-3 rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] shadow-lg transition-all duration-500"
                     style={{ width: `${getRealStats().journal}%` }}
                   />
                 </div>
                 <span className="text-[var(--accent-primary)] font-bold text-lg">{getRealStats().journal}%</span>
               </div>
             </div>
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

