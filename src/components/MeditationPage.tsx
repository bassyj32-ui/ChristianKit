import React, { useState, useEffect, useRef } from 'react'
import { useSupabaseAuth } from './SupabaseAuthProvider'
import { DailyProgressReminder } from './DailyProgressReminder'

interface MeditationSession {
  id: string
  date: string
  duration: number
  focus: string
  mood: string
  message: string
  completed: boolean
}

interface MeditationPageProps {
  onNavigate?: (page: string) => void;
  onStartQuestionnaire?: () => void;
  onTimerComplete?: () => void;
  userPlan?: {
    meditationTime: number;
    meditationFocus: string[];
  } | null;
  selectedMinutes?: number;
  isFirstTimeUser?: boolean;
}

export const MeditationPage: React.FC<MeditationPageProps> = ({ 
  onNavigate, 
  onStartQuestionnaire, 
  onTimerComplete, 
  userPlan, 
  selectedMinutes: propSelectedMinutes,
  isFirstTimeUser = false 
}) => {
  const { user, signInWithGoogle } = useSupabaseAuth();
  console.log('MeditationPage rendered with propSelectedMinutes:', propSelectedMinutes);
  
  const [selectedMinutes, setSelectedMinutes] = useState(10) // Default to 10 minutes
  const [timeRemaining, setTimeRemaining] = useState(10 * 60) // Default to 10 minutes
  const [isMeditating, setIsMeditating] = useState(true) // Start with timer running automatically
  const [meditationCompleted, setMeditationCompleted] = useState(false)
  const [meditationMessage, setMeditationMessage] = useState("Lord Jesus, I'm here with You now to find peace...")
  const [meditationFocus, setMeditationFocus] = useState("")
  const [meditationMood, setMeditationMood] = useState("")
  const [currentReminderIndex, setCurrentReminderIndex] = useState(0)
  const [showReminder, setShowReminder] = useState(false)
  const [meditationSessions, setMeditationSessions] = useState<MeditationSession[]>([])
  const [focusReminders, setFocusReminders] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0)
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reminderIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Encouraging titles and subtitles for slideshow
  const encouragingTitles = [
    "Find Peace",
    "Trust in Him",
    "Be Still",
    "Meditate on Him",
    "Cast Your Cares",
    "Walk by Faith",
    "Rejoice Always",
    "Give Thanks"
  ]

  const encouragingSubtitles = [
    "In His presence",
    "He is faithful",
    "Know He is God",
    "In every moment",
    "He cares for you",
    "Not by sight",
    "In all circumstances",
    "In everything"
  ]

  // Scripture verses and references
  const scriptureVerses = [
    "Be still, and know that I am God",
    "Cast your cares on the Lord",
    "Meditate on His word day and night",
    "Trust in the Lord with all your heart",
    "Rejoice always, pray continually",
    "Walk by faith, not by sight",
    "Give thanks in all circumstances",
    "The Lord is my shepherd"
  ]

  const scriptureReferences = [
    "Psalm 46:10",
    "1 Peter 5:7",
    "Psalm 1:2",
    "Proverbs 3:5",
    "1 Thessalonians 5:16-17",
    "2 Corinthians 5:7",
    "1 Thessalonians 5:18",
    "Psalm 23:1"
  ]

  // Load meditation sessions from localStorage (simplified)
  useEffect(() => {
    const saved = localStorage.getItem('meditationSessions')
    if (saved) {
      setMeditationSessions(JSON.parse(saved))
    }
  }, [])

  // Update timer when prop changes
  useEffect(() => {
    if (propSelectedMinutes && propSelectedMinutes > 0) {
      console.log('Prop changed, updating timer to:', propSelectedMinutes, 'minutes');
      setSelectedMinutes(propSelectedMinutes);
      setTimeRemaining(propSelectedMinutes * 60);
    }
  }, [propSelectedMinutes]);

  // Define completeMeditation function before using it in useEffect
  const completeMeditation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (reminderIntervalRef.current) {
      clearInterval(reminderIntervalRef.current);
    }
    
    // Save meditation session (simplified)
    const newSession: MeditationSession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      duration: selectedMinutes,
      focus: meditationFocus,
      mood: meditationMood,
      message: meditationMessage,
      completed: true
    };
    setMeditationSessions(prev => [newSession, ...prev]);
    localStorage.setItem('meditationSessions', JSON.stringify([newSession, ...meditationSessions]));
    
    setIsMeditating(false);
    setMeditationCompleted(true);
    setShowReminder(false);
    
    // Call timer completion handler
    onTimerComplete?.();
  };

  useEffect(() => {
    // Start timer immediately when component mounts
    console.log('Component mounted, starting timer with:', selectedMinutes, 'minutes');
    
    if (isMeditating && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            completeMeditation();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isMeditating, selectedMinutes]);

  // Start reminder interval
  useEffect(() => {
    if (isMeditating && timeRemaining > 0) {
      reminderIntervalRef.current = setInterval(() => {
        setShowReminder(true);
        setTimeout(() => setShowReminder(false), 3000);
        setCurrentReminderIndex(prev => (prev + 1) % focusReminders.length);
      }, 30000); // Show reminder every 30 seconds
    }

    return () => {
      if (reminderIntervalRef.current) {
        clearInterval(reminderIntervalRef.current);
      }
    };
  }, [isMeditating, timeRemaining, focusReminders.length]);

  // Set focus reminders based on user plan
  useEffect(() => {
    if (userPlan?.meditationFocus) {
      setFocusReminders(userPlan.meditationFocus);
    } else {
      setFocusReminders([
        "Thank God for His peace and presence",
        "Ask for stillness in your heart",
        "Pray for inner calm and clarity",
        "Seek God's peace that passes understanding",
        "Express gratitude for His rest"
      ]);
    }
  }, [userPlan]);

  // Slideshow for encouraging titles
  useEffect(() => {
    const titleInterval = setInterval(() => {
      setCurrentTitleIndex(prev => (prev + 1) % encouragingTitles.length);
    }, 4000);

    return () => clearInterval(titleInterval);
  }, []);

  // Slideshow for scripture verses
  useEffect(() => {
    const verseInterval = setInterval(() => {
      setCurrentVerseIndex(prev => (prev + 1) % scriptureVerses.length);
    }, 5000);

    return () => clearInterval(verseInterval);
  }, []);

  const resetMeditation = () => {
    setTimeRemaining(selectedMinutes * 60);
    setIsMeditating(true);
    setMeditationCompleted(false);
    setMeditationMessage("Lord Jesus, I'm here with You now to find peace...");
    setMeditationFocus("");
    setMeditationMood("");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isFirstTimeUser) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="text-6xl mb-6">🧘‍♀️</div>
          <h1 className="text-3xl font-bold mb-4">Welcome to Meditation!</h1>
          <p className="text-gray-300 mb-6">Let's start your spiritual journey with a personalized experience.</p>
          <button
            onClick={onStartQuestionnaire}
            className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black px-8 py-3 rounded-xl font-semibold hover:from-amber-300 hover:to-yellow-400 transition-all duration-300"
          >
            Start Your Journey
          </button>
        </div>
      </div>
    );
  }

  if (meditationCompleted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-3xl font-bold mb-4">Meditation Complete!</h1>
          <p className="text-gray-300 mb-6">Great job! You've spent {selectedMinutes} minutes in peaceful meditation.</p>
          <button
            onClick={resetMeditation}
            className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black px-8 py-3 rounded-xl font-semibold hover:from-amber-300 hover:to-yellow-400 transition-all duration-300 mr-4"
          >
            Meditate Again
          </button>
          <button
            onClick={() => onNavigate?.('dashboard')}
            className="bg-white/10 text-white px-8 py-3 rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition-all duration-300"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* Osmosis-inspired Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] pointer-events-none">
        {/* Subtle Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-yellow-500/5"></div>
        
        {/* Minimal Glow Effects */}
        <div className="absolute top-1/6 left-1/6 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/6 right-1/6 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-6xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
            Meditation Time
          </h1>
          <p className="text-lg sm:text-xl text-white/80">Find peace and stillness in your spiritual practice</p>
        </div>

        {/* Timer Container */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 sm:p-12 border border-white/20 shadow-2xl max-w-md w-full relative">
          {/* Progress Ring */}
          <div className="relative w-48 h-48 mx-auto mb-8">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background Circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
              />
              {/* Progress Circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - ((selectedMinutes * 60 - timeRemaining) / (selectedMinutes * 60)))}`}
                className="transition-all duration-1000 ease-out"
              />
              {/* Gradient Definition */}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#eab308" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Timer Display */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-sm text-white/70">
                  {isMeditating ? 'Meditating...' : 'Ready'}
                </div>
              </div>
            </div>

            {/* Progress Percentage */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="bg-white/10 backdrop-blur-xl rounded-full px-3 py-1 text-sm font-medium text-white">
                {Math.round(((selectedMinutes * 60 - timeRemaining) / (selectedMinutes * 60)) * 100)}%
              </div>
            </div>
          </div>

          {/* Left Side - Meditation Message (Hidden on Mobile) */}
          <div className="absolute left-[-140px] sm:left-[-160px] lg:left-[-180px] top-1/2 transform -translate-y-1/2 hidden sm:block">
            <div className="bg-white/10 backdrop-blur-xl border-2 border-white/30 rounded-2xl p-4 text-center max-w-[120px] sm:max-w-[140px] shadow-lg">
              <p className="text-sm sm:text-base font-black text-white leading-tight">
                <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 bg-clip-text text-transparent font-black">Dear Jesus</span>, <span className="font-black text-white drop-shadow-lg">help me find peace</span>
              </p>
            </div>
          </div>

          {/* Right Side - Meditation Time Title (Hidden on Mobile) */}
          <div className="absolute right-[-140px] sm:right-[-160px] lg:right-[-180px] top-1/2 transform -translate-y-1/2 hidden sm:block">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center max-w-[120px] sm:max-w-[140px]">
              <div className="text-2xl sm:text-3xl font-black text-white mb-2">
                Meditation Time
              </div>
              <div className="text-lg sm:text-xl font-bold text-amber-400">
                {selectedMinutes} min
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-First Meditation Time Below Timer */}
        <div className="text-center mt-3 sm:hidden">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2 mx-4">
            <div className="text-base font-black text-white mb-1">
              Meditation Time
            </div>
            <div className="text-sm font-bold text-amber-400">
              {selectedMinutes} min
            </div>
          </div>
        </div>

        {/* Reminder - Osmo Style */}
        {showReminder && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-xl border border-white/20 text-white px-6 py-4 rounded-2xl shadow-xl z-50 max-w-sm text-center">
            <p className="text-sm font-medium">{focusReminders[currentReminderIndex]}</p>
          </div>
        )}
      </div>

      {/* Simple Bottom Navigation Tabs - Clean Osmo Style */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2">
          <div className="flex items-center space-x-2 sm:space-x-1">
            {/* Home Tab */}
            <button
              onClick={() => {
                console.log('Home tab clicked!')
                console.log('isFirstTimeUser:', isFirstTimeUser)
                console.log('onStartQuestionnaire function:', onStartQuestionnaire)
                console.log('onNavigate function:', onNavigate)
                
                if (isFirstTimeUser) {
                  console.log('Starting questionnaire...')
                  onStartQuestionnaire?.();
                } else {
                  console.log('Navigating to dashboard...')
                  onNavigate?.('dashboard');
                }
              }}
              className="flex flex-col items-center space-y-1 px-4 py-3 sm:px-3 sm:px-3 sm:py-2 rounded-xl text-white hover:bg-white/10 transition-all duration-300 group min-w-[80px] sm:min-w-0 justify-center"
            >
              <span className="text-xl sm:text-lg group-hover:scale-110 transition-transform duration-300">🏠</span>
              <span className="text-sm font-medium">Home</span>
            </button>
            
            {/* Restart Tab */}
            <button
              onClick={resetMeditation}
              className="flex flex-col items-center space-y-1 px-4 py-3 sm:px-3 sm:py-2 rounded-xl text-white hover:bg-white/10 transition-all duration-300 group min-w-[80px] sm:min-w-0 justify-center"
            >
              <span className="text-xl sm:text-lg group-hover:scale-110 transition-transform duration-300">🔄</span>
              <span className="text-sm font-medium">Restart</span>
            </button>
            
            {/* Share Tab */}
            <button
              onClick={() => onNavigate?.('community')}
              className="flex flex-col items-center space-y-1 px-4 py-3 sm:px-3 sm:py-2 rounded-xl text-white hover:bg-white/10 transition-all duration-300 group min-w-[80px] sm:min-w-0 justify-center"
            >
              <span className="text-xl sm:text-lg group-hover:scale-110 transition-transform duration-300">🌟</span>
              <span className="text-sm font-medium">Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
