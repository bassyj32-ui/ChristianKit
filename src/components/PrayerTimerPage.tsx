import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthProvider'
import { DailyProgressReminder } from './DailyProgressReminder'

interface PrayerSession {
  id: string
  date: string
  duration: number
  focus: string
  mood: string
  message: string
  completed: boolean
}

interface PrayerTimerPageProps {
  onNavigate?: (page: string) => void;
  onStartQuestionnaire?: () => void;
  onTimerComplete?: () => void;
  userPlan?: {
    prayerTime: number;
    prayerFocus: string[];
  } | null;
  selectedMinutes?: number;
  isFirstTimeUser?: boolean;
}

export const PrayerTimerPage: React.FC<PrayerTimerPageProps> = ({ onNavigate, onStartQuestionnaire, onTimerComplete, userPlan, selectedMinutes: propSelectedMinutes }) => {
  const { user, signInWithGoogle } = useAuth();
  console.log('PrayerTimerPage rendered with propSelectedMinutes:', propSelectedMinutes);
  
  const [selectedMinutes, setSelectedMinutes] = useState(10) // Always start with 10
  const [timeRemaining, setTimeRemaining] = useState(10 * 60) // Always start with 10 minutes
  const [isPraying, setIsPraying] = useState(true) // Start in full-screen timer mode
  const [prayerCompleted, setPrayerCompleted] = useState(false)
  const [prayerMessage, setPrayerMessage] = useState("Lord Jesus, I'm here with You now to talk about...")
  const [prayerFocus, setPrayerFocus] = useState("")
  const [prayerMood, setPrayerMood] = useState("")
  const [currentReminderIndex, setCurrentReminderIndex] = useState(0)
  const [showReminder, setShowReminder] = useState(false)
  const [prayerSessions, setPrayerSessions] = useState<PrayerSession[]>([])
  const [focusReminders, setFocusReminders] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reminderIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load prayer sessions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('prayerSessions')
    if (saved) {
      setPrayerSessions(JSON.parse(saved))
    }
  }, [])

  // Save prayer sessions to localStorage
  useEffect(() => {
    localStorage.setItem('prayerSessions', JSON.stringify(prayerSessions))
  }, [prayerSessions])

  // Update timer when prop changes
  useEffect(() => {
    if (propSelectedMinutes && propSelectedMinutes > 0) {
      console.log('Prop changed, updating timer to:', propSelectedMinutes, 'minutes');
      setSelectedMinutes(propSelectedMinutes);
      setTimeRemaining(propSelectedMinutes * 60);
    }
  }, [propSelectedMinutes]);

  // Define completePrayer function before using it in useEffect
  const completePrayer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (reminderIntervalRef.current) {
      clearInterval(reminderIntervalRef.current);
    }
    
    // Save prayer session
    const newSession: PrayerSession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      duration: selectedMinutes,
      focus: prayerFocus,
      mood: prayerMood,
      message: prayerMessage,
      completed: true
    };
    setPrayerSessions(prev => [newSession, ...prev]);
    
    setIsPraying(false);
    setPrayerCompleted(true);
    setShowReminder(false);
    
    // Call timer completion handler
    onTimerComplete?.();
  };

  useEffect(() => {
    // Start timer immediately when component mounts
    console.log('Component mounted, starting timer with:', selectedMinutes, 'minutes');
    setTimeRemaining(selectedMinutes * 60);
    
    // Ensure timer starts after a brief delay
    const timer = setTimeout(() => {
      console.log('Ensuring timer is started');
      setIsPraying(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []); // Empty dependency array - runs only once

  // Timer effect
  useEffect(() => {
    console.log('Timer effect triggered - isPraying:', isPraying);
    
    if (isPraying) {
      console.log('Starting timer interval');
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          console.log('Timer tick - prev:', prev);
          if (prev <= 1) {
            console.log('Timer complete');
            setIsPraying(false);
            completePrayer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        console.log('Clearing timer interval');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPraying]);

  const startPrayer = () => {
    setIsPraying(true);
    setPrayerCompleted(false);
    setTimeRemaining(selectedMinutes * 60);
    setCurrentReminderIndex(0);
    setShowReminder(false);
    
    // Start focus reminders every 30 seconds
    reminderIntervalRef.current = setInterval(() => {
      setShowReminder(true);
      setTimeout(() => setShowReminder(false), 3000);
      setCurrentReminderIndex(prev => (prev + 1) % focusReminders.length);
    }, 30000);
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleMinuteChange = (minutes: number) => {
    setSelectedMinutes(minutes)
    setTimeRemaining(minutes * 60)
  }

  const addFocusReminder = (reminder: string) => {
    if (reminder.trim() && !focusReminders.includes(reminder.trim())) {
      setFocusReminders(prev => [...prev, reminder.trim()])
    }
  }

  const removeFocusReminder = (index: number) => {
    setFocusReminders(prev => prev.filter((_, i) => i !== index))
  }

  const restartPrayer = () => {
    setPrayerCompleted(false)
    setTimeRemaining(selectedMinutes * 60)
    setIsPraying(true) // Ensure we go back to full-screen timer mode
  }

  const progressPercentage = ((selectedMinutes * 60 - timeRemaining) / (selectedMinutes * 60)) * 100

  // Prayer History View
  if (showHistory) {
    return (
      <div className="min-h-screen bg-black pt-20">
        <div className="max-w-6xl mx-auto px-6 py-8">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-100 mb-4">Prayer History</h1>
            <p className="text-xl text-gray-400">Your spiritual journey with God</p>
          </div>

          {/* Login Prompt for Unauthenticated Users */}
          {!user && (
            <div className="max-w-md mx-auto mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 shadow-2xl border-2 border-blue-400/30 text-center">
                <div className="text-3xl mb-3">🔐</div>
                <h3 className="text-xl font-bold text-white mb-2">Save Your Prayer History</h3>
                <p className="text-blue-100 mb-4 text-sm">Sign in to save your prayer sessions and track your spiritual growth over time</p>
                <button
                  onClick={signInWithGoogle}
                  className="bg-white text-gray-800 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all duration-200 flex items-center justify-center gap-3 w-full mx-auto"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </button>
              </div>
            </div>
          )}

          {/* Back Button */}
          <div className="mb-8">
            <button
              onClick={() => setShowHistory(false)}
              className="bg-neutral-900/80 backdrop-blur-sm border-2 border-neutral-700 text-gray-100 px-6 py-3 rounded-2xl font-bold hover:bg-neutral-800 transition-all duration-300"
            >
              ← Back to Prayer
            </button>
          </div>

          {/* Daily Progress Reminder */}
          <div className="mb-8">
            <DailyProgressReminder 
              variant="detailed" 
              showActions={true}
              className="mx-auto max-w-lg"
            />
          </div>

          {/* Prayer Sessions */}
          <div className="space-y-6">
            {prayerSessions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-2xl font-bold text-gray-200 mb-2">No prayer sessions yet</h3>
                <p className="text-gray-400">Start your first prayer to begin your journey</p>
              </div>
            ) : (
              prayerSessions.map((session) => (
                <div key={session.id} className="bg-neutral-900/90 backdrop-blur-sm rounded-3xl p-6 border border-neutral-800 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xl">🙏</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-100">
                          {new Date(session.date).toLocaleDateString()}
                        </h3>
                        <p className="text-gray-400">
                          {session.duration} minutes • {session.mood}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-400">{session.duration}m</div>
                      <div className="text-sm text-gray-500">Duration</div>
                    </div>
                  </div>
                  
                  {session.focus && (
                    <div className="mb-3">
                      <span className="inline-block bg-green-900/50 text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                        Focus: {session.focus}
                      </span>
                    </div>
                  )}
                  
                  {session.message && (
                    <div className="bg-neutral-800 rounded-2xl p-4 mb-4">
                      <p className="text-gray-300 italic">"{session.message}"</p>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {new Date(session.date).toLocaleTimeString()}
                    </span>
                    <span className="text-green-400 font-semibold">✓ Completed</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  // Advanced Prayer Features View
  if (showAdvanced) {
    return (
      <div className="min-h-screen bg-black pt-20">
        <div className="max-w-6xl mx-auto px-6 py-8">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-100 mb-4">Advanced Prayer</h1>
            <p className="text-xl text-gray-400">Deepen your spiritual practice</p>
          </div>

          {/* Login Prompt for Unauthenticated Users */}
          {!user && (
            <div className="max-w-md mx-auto mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 shadow-2xl border-2 border-blue-400/30 text-center">
                <div className="text-3xl mb-3">🔐</div>
                <h3 className="text-xl font-bold text-white mb-2">Unlock Advanced Features</h3>
                <p className="text-blue-100 mb-4 text-sm">Sign in to access advanced prayer tools and save your custom settings</p>
                <button
                  onClick={signInWithGoogle}
                  className="bg-white text-gray-800 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all duration-200 flex items-center justify-center gap-3 w-full mx-auto"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </button>
              </div>
            </div>
          )}

          {/* Back Button */}
          <div className="mb-8">
            <button
              onClick={() => setShowAdvanced(false)}
              className="bg-neutral-900/80 backdrop-blur-sm border-2 border-neutral-700 text-gray-100 px-6 py-3 rounded-2xl font-bold hover:bg-neutral-800 transition-all duration-300"
            >
              ← Back to Prayer
            </button>
          </div>

          {/* Daily Progress Reminder */}
          <div className="mb-8">
            <DailyProgressReminder 
              variant="detailed" 
              showActions={true}
              className="mx-auto max-w-lg"
            />
          </div>

          {/* Advanced Features Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Focus Reminders */}
            <div className="bg-neutral-900/90 backdrop-blur-sm rounded-3xl p-8 border border-neutral-800 shadow-2xl">
              <h3 className="text-2xl font-bold text-gray-100 mb-6">🎯 Focus Reminders</h3>
              
              <div className="mb-6">
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Add a focus reminder..."
                    className="flex-1 p-3 border-2 border-neutral-700 bg-neutral-800 text-gray-100 rounded-xl focus:border-green-500 focus:outline-none"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addFocusReminder(e.currentTarget.value)
                        e.currentTarget.value = ''
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Add a focus reminder..."]') as HTMLInputElement
                      if (input) {
                        addFocusReminder(input.value)
                        input.value = ''
                      }
                    }}
                    className="bg-green-500 text-white px-4 py-3 rounded-xl font-bold hover:bg-green-600 transition-all duration-300"
                  >
                    Add
                  </button>
                </div>
                
                <div className="space-y-2">
                  {focusReminders.map((reminder, index) => (
                    <div key={index} className="flex items-center justify-between bg-neutral-800 rounded-xl p-3">
                      <span className="text-gray-300">{reminder}</span>
                      <button
                        onClick={() => removeFocusReminder(index)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Prayer Statistics */}
            <div className="bg-neutral-900/90 backdrop-blur-sm rounded-3xl p-8 border border-neutral-800 shadow-2xl">
              <h3 className="text-2xl font-bold text-gray-100 mb-6">📊 Prayer Statistics</h3>
              
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-400 mb-2">
                    {prayerSessions.length}
                  </div>
                  <div className="text-gray-400">Total Sessions</div>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-400 mb-2">
                    {prayerSessions.reduce((total, session) => total + session.duration, 0)}
                  </div>
                  <div className="text-gray-400">Total Minutes</div>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl font-bold text-teal-400 mb-2">
                    {prayerSessions.length > 0 ? Math.round(prayerSessions.reduce((total, session) => total + session.duration, 0) / prayerSessions.length) : 0}
                  </div>
                  <div className="text-gray-400">Avg. Duration</div>
                </div>
              </div>
            </div>

            {/* Prayer Techniques */}
            <div className="bg-neutral-900/90 backdrop-blur-sm rounded-3xl p-8 border border-neutral-800 shadow-2xl">
              <h3 className="text-2xl font-bold text-gray-100 mb-6">🧘 Prayer Techniques</h3>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 rounded-2xl p-4">
                  <h4 className="font-bold text-gray-100 mb-2">Centering Prayer</h4>
                  <p className="text-gray-300 text-sm">Focus on a sacred word to quiet your mind and open your heart to God's presence.</p>
                </div>
                
                <div className="bg-gradient-to-r from-blue-900/50 to-indigo-900/50 rounded-2xl p-4">
                  <h4 className="font-bold text-gray-100 mb-2">Lectio Divina</h4>
                  <p className="text-gray-300 text-sm">Read, meditate, pray, and contemplate scripture to hear God's voice.</p>
                </div>
                
                <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-2xl p-4">
                  <h4 className="font-bold text-gray-100 mb-2">Examen Prayer</h4>
                  <p className="text-gray-300 text-sm">Review your day to recognize God's presence and guidance in your life.</p>
                </div>
              </div>
            </div>

            {/* Prayer Prompts */}
            <div className="bg-neutral-900/90 backdrop-blur-sm rounded-3xl p-8 border border-neutral-800 shadow-2xl">
              <h3 className="text-2xl font-bold text-gray-100 mb-6">💭 Prayer Prompts</h3>
              
              <div className="space-y-3">
                {[
                  "What am I grateful for today?",
                  "Who needs my prayers right now?",
                  "What is God teaching me?",
                  "How can I serve others today?",
                  "What worries can I surrender to God?",
                  "Where do I need God's guidance?"
                ].map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setPrayerMessage(prompt)}
                    className="w-full text-left bg-neutral-800 hover:bg-neutral-700 rounded-xl p-4 transition-all duration-300 border-2 border-transparent hover:border-green-500"
                  >
                    <p className="text-gray-300 font-medium">{prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Prayer Setup Interface
  if (!isPraying && !prayerCompleted) {
    return (
      <div className="min-h-screen bg-black pt-20">
        <div className="max-w-6xl mx-auto px-6 py-8">
          
          {/* Prayer Setup Header */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-2xl">
              <span className="text-white text-4xl">🙏</span>
            </div>
            <h1 className="text-5xl font-bold text-gray-100 mb-4">Prayer Time</h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Create a sacred space for your conversation with God
            </p>
          </div>

          {/* Login Prompt for Unauthenticated Users */}
          {!user && (
            <div className="max-w-md mx-auto mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 shadow-2xl border-2 border-blue-400/30 text-center">
                <div className="text-3xl mb-3">🔐</div>
                <h3 className="text-xl font-bold text-white mb-2">Save Your Prayer Journey</h3>
                <p className="text-blue-100 mb-4 text-sm">Sign in to save your prayer sessions and track your spiritual growth</p>
                <button
                  onClick={signInWithGoogle}
                  className="bg-white text-gray-800 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all duration-200 flex items-center justify-center gap-3 w-full mx-auto"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </button>
              </div>
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="flex justify-center gap-4 mb-12">
            <button
              onClick={() => setShowHistory(true)}
              className="bg-neutral-900/80 backdrop-blur-sm border-2 border-neutral-700 text-gray-100 px-6 py-3 rounded-2xl font-bold hover:bg-neutral-800 transition-all duration-300"
            >
              📝 History
            </button>
            <button
              onClick={() => setShowAdvanced(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-2xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
            >
              ⚡ Advanced
            </button>
          </div>

          {/* Prayer Setup Form */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-neutral-900/90 backdrop-blur-sm rounded-3xl p-8 border border-neutral-800 shadow-2xl mb-8">
              
              {/* Prayer Message Input */}
              <div className="mb-8">
                <label className="block text-lg font-semibold text-gray-200 mb-3">
                  What's on your heart today?
                </label>
                <textarea
                  value={prayerMessage}
                  onChange={(e) => setPrayerMessage(e.target.value)}
                  placeholder="Lord Jesus, I'm here with You now to talk about..."
                  className="w-full p-4 text-lg border-2 border-neutral-700 bg-neutral-800 text-gray-100 rounded-2xl backdrop-blur-sm focus:border-green-500 focus:outline-none transition-all duration-300 resize-none"
                  rows={3}
                />
              </div>

              {/* Prayer Focus */}
              <div className="mb-8">
                <label className="block text-lg font-semibold text-gray-200 mb-3">
                  Prayer Focus
                </label>
                <input
                  type="text"
                  value={prayerFocus}
                  onChange={(e) => setPrayerFocus(e.target.value)}
                  placeholder="e.g., Gratitude, Healing, Guidance, Strength..."
                  className="w-full p-4 text-lg border-2 border-neutral-700 bg-neutral-800 text-gray-100 rounded-2xl backdrop-blur-sm focus:border-green-500 focus:outline-none transition-all duration-300"
                />
              </div>

              {/* Prayer Mood */}
              <div className="mb-8">
                <label className="block text-lg font-semibold text-gray-200 mb-3">
                  How are you feeling today?
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'peaceful', label: '😌 Peaceful', color: 'from-green-400 to-emerald-500' },
                    { value: 'grateful', label: '🙏 Grateful', color: 'from-blue-400 to-indigo-500' },
                    { value: 'worried', label: '😟 Worried', color: 'from-yellow-400 to-orange-500' },
                    { value: 'joyful', label: '😊 Joyful', color: 'from-pink-400 to-rose-500' }
                  ].map((mood) => (
                    <button
                      key={mood.value}
                      onClick={() => setPrayerMood(mood.value)}
                      className={`p-3 rounded-xl font-medium transition-all duration-300 border-2 ${
                        prayerMood === mood.value
                          ? `bg-gradient-to-r ${mood.color} text-white border-transparent shadow-lg`
                          : 'bg-neutral-800 text-gray-300 border-neutral-700 hover:bg-neutral-700'
                      }`}
                    >
                      {mood.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timer Options */}
              <div className="flex justify-center space-x-4 mb-8">
                {[10, 20, 30].map((minutes) => (
                  <button
                    key={minutes}
                    onClick={() => setSelectedMinutes(minutes)}
                    className={`px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
                      selectedMinutes === minutes
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                        : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700 hover:text-white'
                    }`}
                  >
                    {minutes} min
                  </button>
                ))}
              </div>

              {/* Start Prayer Button */}
              <div className="text-center">
                <button
                  onClick={() => {
                    console.log('Starting prayer with', selectedMinutes, 'minutes');
                    setTimeRemaining(selectedMinutes * 60);
                    setIsPraying(true);
                  }}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-16 py-5 rounded-3xl text-2xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-2xl"
                >
                  🙏 Start Prayer
                </button>
              </div>
            </div>

            {/* Prayer Tips */}
            <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 rounded-3xl p-6 border border-neutral-800">
              <h3 className="text-xl font-semibold text-gray-100 mb-3">💡 Prayer Tips</h3>
              <ul className="text-gray-300 space-y-2">
                <li>• Find a quiet, comfortable space</li>
                <li>• Take a few deep breaths to center yourself</li>
                <li>• Remember, God is always listening</li>
                <li>• There's no right or wrong way to pray</li>
              </ul>
            </div>

            {/* Daily Progress Reminder */}
            <div className="mt-6">
              <DailyProgressReminder 
                variant="compact" 
                showActions={false}
                className="mx-auto max-w-md"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Prayer Completed Screen - Advanced Options
  if (prayerCompleted) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center text-gray-100 max-w-4xl px-4 sm:px-8">
          
          {/* Status Header */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-gray-100 px-4">
            Prayer Complete
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl mb-8 sm:mb-12 text-gray-400 leading-relaxed px-4">
            What would you like to do next?
          </p>

          {/* Login Prompt for Unauthenticated Users */}
          {!user && (
            <div className="max-w-md mx-auto mb-6 sm:mb-8 px-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl border-2 border-blue-400/30 text-center">
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">🔐</div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Save Your Progress</h3>
                <p className="text-blue-100 mb-3 sm:mb-4 text-xs sm:text-sm">Sign in to save this prayer session and track your spiritual journey</p>
                <button
                  onClick={signInWithGoogle}
                  className="bg-white text-gray-800 px-6 sm:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm hover:bg-gray-100 transition-all duration-200 flex items-center justify-center gap-2 sm:gap-3 w-full mx-auto"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </button>
              </div>
            </div>
          )}

          {/* Simple Options */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6 max-w-3xl mx-auto mb-6 sm:mb-8 px-4">
            
            {/* Start Another Prayer */}
            <button 
              onClick={() => {
                setPrayerCompleted(false)
                setTimeRemaining(selectedMinutes * 60)
                setIsPraying(true) // Go back to full-screen timer mode
              }}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl font-bold text-base sm:text-lg md:text-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-2xl"
            >
              ⏰ Another Prayer
            </button>
            
            {/* Create Personalized Plan */}
            <button 
              onClick={() => onStartQuestionnaire?.()}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl font-bold text-base sm:text-lg md:text-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-2xl"
            >
              ✨ Create Plan
            </button>
            
            {/* View History */}
            <button 
              onClick={() => setShowHistory(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl font-bold text-base sm:text-lg md:text-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105 shadow-2xl"
            >
              📊 History
            </button>
          </div>

          {/* Back to Prayer */}
          <button 
            onClick={() => {
              setPrayerCompleted(false)
              setTimeRemaining(selectedMinutes * 60)
              setIsPraying(true) // Go back to full-screen timer mode
            }}
            className="bg-neutral-900/80 backdrop-blur-sm border-2 sm:border-4 border-neutral-700 text-gray-100 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-xl hover:bg-neutral-800 transition-all duration-300 mx-4 sm:mx-auto"
          >
            🙏 Back to Prayer
          </button>

          {/* Daily Progress Reminder */}
          <div className="mt-8">
            <DailyProgressReminder 
              variant="compact" 
              showActions={false}
              className="mx-auto max-w-md"
            />
          </div>
        </div>
      </div>
    )
  }

  // Full-Screen Prayer Experience with Focus Reminders
  if (isPraying) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        
        {/* Focus Reminder Overlay */}
        {showReminder && focusReminders.length > 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-900/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-8 max-w-2xl mx-2 sm:mx-4 text-center shadow-2xl border-2 sm:border-4 border-neutral-800">
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🎯</div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-100 mb-3 sm:mb-4">Focus Reminder</h3>
              <p className="text-base sm:text-xl text-gray-300 mb-4 sm:mb-6">{focusReminders[currentReminderIndex]}</p>
              <button
                onClick={() => setShowReminder(false)}
                className="bg-green-500 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base hover:bg-green-600 transition-all duration-300"
              >
                Continue Prayer
              </button>
            </div>
          </div>
        )}
        
        {/* Login Prompt for Unauthenticated Users */}
        {!user && (
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-40">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl border-2 border-blue-400/30">
              <div className="text-center mb-2 sm:mb-3">
                <div className="text-xl sm:text-2xl mb-1 sm:mb-2">🔐</div>
                <p className="text-white text-xs sm:text-sm font-medium">Save your progress</p>
              </div>
              <button
                onClick={signInWithGoogle}
                className="bg-white text-gray-800 px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm hover:bg-gray-100 transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 w-full"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>
            </div>
          </div>
        )}
        
        {/* Massive Rectangle Timer */}
        <div className="flex-1 flex items-center justify-center px-2 sm:px-4 pb-2">
          <div className="relative w-full max-w-5xl">
            {/* Timer Container */}
            <div className="w-full h-[60vh] sm:h-[70vh] md:h-[75vh] bg-neutral-900/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-neutral-800 shadow-2xl overflow-hidden relative">
              {/* Fulfillment Animation */}
              <div 
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-400 to-emerald-500 transition-all duration-1000 ease-out"
                style={{ 
                  height: `${progressPercentage}%`,
                  boxShadow: progressPercentage === 100 ? '0 0 50px rgba(16, 185, 129, 0.6)' : 'none'
                }}
              ></div>
              
              {/* Timer Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
                <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[10vw] font-black text-gray-100 drop-shadow-2xl leading-none text-center">
                  {formatTime(timeRemaining)}
                </div>
              </div>
              
              {/* Prayer Message */}
              <div className="absolute bottom-4 sm:bottom-8 left-0 right-0 text-center px-2">
                <div className="text-base sm:text-lg md:text-xl font-medium text-gray-400 max-w-4xl mx-auto px-2 sm:px-4">
                  {prayerMessage}
                </div>
              </div>
            </div>
            
            {/* Animated Border Glow */}
            <div 
              className="absolute inset-0 rounded-3xl border-4 border-green-400 transition-all duration-1000 ease-out"
              style={{
                opacity: progressPercentage > 0 ? 0.6 : 0,
                transform: progressPercentage > 0 ? 'scale(1.02)' : 'scale(1)',
                filter: progressPercentage === 100 ? 'drop-shadow(0 0 30px rgba(16, 185, 129, 0.8))' : 'none'
              }}
            ></div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="p-2 sm:p-4 bg-black/60 backdrop-blur-sm border-t border-neutral-800">
          <div className="max-w-4xl mx-auto">
            
            {/* Minute Adjustment */}
            <div className="flex justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              {[10, 20, 30].map((minutes) => (
                <button
                  key={minutes}
                  onClick={() => handleMinuteChange(minutes)}
                  className={`px-3 sm:px-6 py-2 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 hover:scale-105 border-2 ${
                    selectedMinutes === minutes
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-300 shadow-lg'
                      : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700 border-neutral-700'
                  }`}
                >
                  {minutes} min
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
              <button
                onClick={() => {
                  // Check if user has already completed questionnaire
                  const hasPlan = localStorage.getItem('userPlan')
                  const hasCompletedQuestionnaire = localStorage.getItem('hasCompletedQuestionnaire')
                  const needsQuestionnaire = !hasPlan || !hasCompletedQuestionnaire
                  
                  if (needsQuestionnaire) {
                    // User needs to complete questionnaire first
                    if (onStartQuestionnaire) {
                      onStartQuestionnaire()
                    }
                  } else {
                    // User has completed setup, go to dashboard
                    if (onNavigate) {
                      onNavigate('dashboard')
                    }
                  }
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold text-sm sm:text-base hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                🏠 Homepage
              </button>
              
              <button 
                onClick={() => {
                  // Restart the timer
                  setTimeRemaining(selectedMinutes * 60)
                  setIsPraying(true)
                }}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                🔄 Restart
              </button>

              <button 
                onClick={() => onNavigate?.('community')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                🌟 Share
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
