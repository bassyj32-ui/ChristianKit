import React, { useState, useEffect, useRef } from 'react'
import { useSupabaseAuth } from './SupabaseAuthProvider'
import { DailyProgressReminder } from './DailyProgressReminder'
import { bibleService, BibleVerse } from '../services/BibleService'
import { BibleSearch } from './BibleSearch'
import { BibleReader } from './BibleReader'
import ProgressService from '../services/ProgressService'

interface BibleSession {
  id: string
  date: string
  duration: number
  focus: string
  mood: string
  message: string
  completed: boolean
}

interface BibleReadingPageProps {
  onNavigate?: (page: string) => void;
  onStartQuestionnaire?: () => void;
  onTimerComplete?: () => void;
  userPlan?: {
    bibleTime: number;
    bibleTopics: string[];
  } | null;
  selectedMinutes?: number;
  isFirstTimeUser?: boolean;
}

export const BibleReadingPage: React.FC<BibleReadingPageProps> = ({ 
  onNavigate, 
  onStartQuestionnaire, 
  onTimerComplete, 
  userPlan, 
  selectedMinutes: propSelectedMinutes,
  isFirstTimeUser = false 
}) => {
  const { user, signInWithGoogle } = useSupabaseAuth();
  console.log('BibleReadingPage rendered with propSelectedMinutes:', propSelectedMinutes);
  
  const [selectedMinutes, setSelectedMinutes] = useState(10) // Default to 10 minutes
  const [timeRemaining, setTimeRemaining] = useState(10 * 60) // Default to 10 minutes
  const [isReading, setIsReading] = useState(false) // Start with timer paused
  const [readingCompleted, setReadingCompleted] = useState(false)
  const [readingMessage, setReadingMessage] = useState("Lord Jesus, I'm here with You now to read Your Word...")
  const [readingFocus, setReadingFocus] = useState("")
  const [readingMood, setReadingMood] = useState("")
  const [currentReminderIndex, setCurrentReminderIndex] = useState(0)
  const [showReminder, setShowReminder] = useState(false)
  const [readingSessions, setReadingSessions] = useState<BibleSession[]>([])
  const [focusReminders, setFocusReminders] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0)
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0)
  
  // New Bible-related state
  const [verseOfTheDay, setVerseOfTheDay] = useState<BibleVerse | null>(null)
  const [dailyReading, setDailyReading] = useState<{ reference: string; description: string } | null>(null)
  const [currentBibleContent, setCurrentBibleContent] = useState<BibleVerse | null>(null)
  const [showBibleContent, setShowBibleContent] = useState(false)
  const [selectedTranslation, setSelectedTranslation] = useState('niv')
  const [showSearch, setShowSearch] = useState(false)
  const [showBibleReader, setShowBibleReader] = useState(false)
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reminderIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Encouraging titles and subtitles for slideshow
  const encouragingTitles = [
    "Find Peace",
    "Trust in Him",
    "Be Still",
    "Read His Word",
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
    "Your word is a lamp to my feet",
    "Trust in the Lord with all your heart",
    "Rejoice always, pray continually",
    "Walk by faith, not by sight",
    "Give thanks in all circumstances",
    "The Lord is my shepherd"
  ]

  const scriptureReferences = [
    "Psalm 46:10",
    "1 Peter 5:7",
    "Psalm 119:105",
    "Proverbs 3:5",
    "1 Thessalonians 5:16-17",
    "2 Corinthians 5:7",
    "1 Thessalonians 5:18",
    "Psalm 23:1"
  ]

  // Load reading sessions from localStorage (simplified)
  useEffect(() => {
    const saved = localStorage.getItem('bibleSessions')
    if (saved) {
      setReadingSessions(JSON.parse(saved))
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

  // Update timer when selectedMinutes changes
  useEffect(() => {
    if (isReading) {
      // If timer is running, stop it and reset
      setIsReading(false);
    }
    setTimeRemaining(selectedMinutes * 60);
  }, [selectedMinutes]);

  // Define completeReading function before using it in useEffect
  const completeReading = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (reminderIntervalRef.current) {
      clearInterval(reminderIntervalRef.current);
    }
    
    // Save reading session locally
    const newSession: BibleSession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      duration: selectedMinutes,
      focus: readingFocus,
      mood: readingMood,
      message: readingMessage,
      completed: true
    };
    setReadingSessions(prev => [newSession, ...prev]);
    localStorage.setItem('bibleSessions', JSON.stringify([newSession, ...readingSessions]));
    
    // Record session in database for progress tracking
    if (user) {
      try {
        await ProgressService.recordSession({
          user_id: user.id,
          activity_type: 'bible',
          duration_minutes: selectedMinutes,
          completed: true,
          completed_duration: selectedMinutes, // Full duration completed
          session_date: new Date().toISOString().split('T')[0],
          notes: readingFocus ? `Focus: ${readingFocus}` : undefined
        });
        console.log('✅ Bible reading session recorded successfully');
      } catch (error) {
        console.error('❌ Error recording bible reading session:', error);
        // Continue even if database recording fails
      }
    }
    
    setIsReading(false);
    setReadingCompleted(true);
    setShowReminder(false);
    
    // Call timer completion handler
    onTimerComplete?.();
  };

  useEffect(() => {
    // Start timer when isReading becomes true
    console.log('Timer state changed, isReading:', isReading, 'timeRemaining:', timeRemaining);
    
    if (isReading && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            completeReading();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isReading && intervalRef.current) {
      // Clear interval when paused
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isReading, timeRemaining]);

  // Start reminder interval
  useEffect(() => {
    if (isReading && timeRemaining > 0) {
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
  }, [isReading, timeRemaining, focusReminders.length]);

  // Set focus reminders based on user plan
  useEffect(() => {
    if (userPlan?.bibleTopics) {
      setFocusReminders(userPlan.bibleTopics);
    } else {
      setFocusReminders([
        "Thank God for His Word and guidance",
        "Ask for understanding as you read",
        "Pray for wisdom and insight",
        "Seek God's message for you today",
        "Express gratitude for His teachings"
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

  // Load Bible content
  useEffect(() => {
    const loadBibleContent = async () => {
      // Get verse of the day
      const dailyVerse = bibleService.getVerseOfTheDay();
      const verse = await bibleService.getVerse(dailyVerse.reference, selectedTranslation);
      setVerseOfTheDay(verse);
      
      // Get daily reading suggestion
      const reading = bibleService.getDailyReading();
      setDailyReading(reading);
      
      // Load the daily reading content
      const readingContent = await bibleService.getVerse(reading.reference, selectedTranslation);
      setCurrentBibleContent(readingContent);
    };
    
    loadBibleContent();
  }, [selectedTranslation]);

  const resetReading = () => {
    setTimeRemaining(selectedMinutes * 60);
    setIsReading(true);
    setReadingCompleted(false);
    setReadingMessage("Lord Jesus, I'm here with You now to read Your Word...");
    setReadingFocus("");
    setReadingMood("");
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
          <div className="text-6xl mb-6">📖</div>
          <h1 className="text-3xl font-bold mb-4">Welcome to Bible Reading!</h1>
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

  if (readingCompleted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-3xl font-bold mb-4">Bible Reading Complete!</h1>
          <p className="text-gray-300 mb-6">Great job! You've spent {selectedMinutes} minutes in God's Word.</p>
          <button
            onClick={resetReading}
            className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black px-8 py-3 rounded-xl font-semibold hover:from-amber-300 hover:to-yellow-400 transition-all duration-300 mr-4"
          >
            Read Again
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
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative overflow-hidden font-sans">
      {/* Osmo-inspired Minimal Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)] pointer-events-none">
        {/* Subtle Gradient Overlays - Osmo Style */}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)]/3 via-transparent to-[var(--accent-primary)]/3"></div>
        
        {/* Minimal Glow Effects */}
        <div className="absolute top-1/6 left-1/6 w-96 h-96 bg-[var(--accent-primary)]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--color-primary-500)]/3 rounded-full blur-3xl"></div>
      </div>

      {/* Subtle Grid Pattern - Very Minimal */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      {/* Floating Interactive Particles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/6 left-1/4 w-2 h-2 bg-[var(--color-primary-500)] rounded-full animate-bounce" style={{animationDuration: '3s'}}></div>
        <div className="absolute top-1/4 right-1/3 w-1.5 h-1.5 bg-[var(--color-info-500)] rounded-full animate-bounce" style={{animationDuration: '4s', animationDelay: '1s'}}></div>
        <div className="absolute top-1/3 left-1/6 w-1 h-1 bg-[var(--color-success-500)] rounded-full animate-bounce" style={{animationDuration: '2.5s', animationDelay: '0.5s'}}></div>
        <div className="absolute top-2/5 right-1/5 w-1.5 h-1.5 bg-[var(--color-primary-500)]/80 rounded-full animate-bounce" style={{animationDuration: '3.5s', animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-1 h-1 bg-[var(--color-info-500)]/80 rounded-full animate-bounce" style={{animationDuration: '2s', animationDelay: '1.5s'}}></div>
        <div className="absolute top-3/5 right-1/4 w-1 h-1 bg-[var(--color-success-500)]/80 rounded-full animate-bounce" style={{animationDuration: '4s', animationDelay: '0.5s'}}></div>
      </div>

      {/* App Bar - Osmo Style */}
      <div className="relative z-50 bg-[var(--color-neutral-800)] backdrop-blur-xl border-b border-[var(--color-neutral-700)] shadow-lg sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Osmo-style Logo */}
            <div className="flex items-center space-x-2 sm:space-x-3 group">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-[var(--color-warning-500)] to-[var(--color-warning-600)] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-[var(--color-warning-500)]/25">
                <span className="text-[var(--color-neutral-50)] font-bold text-xs sm:text-sm">✝</span>
              </div>
              <div className="text-base sm:text-lg font-bold text-[var(--color-neutral-50)] group-hover:text-[var(--color-warning-500)] transition-colors duration-300">
                <span className="bg-gradient-to-r from-[var(--color-warning-500)] to-[var(--color-warning-600)] bg-clip-text text-transparent">Christian</span>
                <span className="text-[var(--color-neutral-50)]">Kit</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-3">
              <button
                onClick={() => onNavigate?.('dashboard')}
                className="px-4 py-2 rounded-lg font-medium text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-50)] hover:bg-[var(--color-neutral-800)] border border-[var(--color-neutral-700)]/50 hover:border-[var(--color-neutral-600)] transition-all duration-300 flex items-center space-x-2"
              >
                <span>🏠</span>
                <span>Home</span>
              </button>
              <button
                onClick={() => onNavigate?.('prayer')}
                className="px-4 py-2 rounded-lg font-medium text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-50)] hover:bg-[var(--color-neutral-800)] border border-[var(--color-neutral-700)]/50 hover:border-[var(--color-neutral-600)] transition-all duration-300 flex items-center space-x-2"
              >
                <span>✨</span>
                <span>Prayer</span>
              </button>
              <button
                onClick={() => onNavigate?.('community')}
                className="px-4 py-2 rounded-lg font-medium text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-50)] hover:bg-[var(--color-neutral-800)] border border-[var(--color-neutral-700)]/50 hover:border-[var(--color-neutral-600)] transition-all duration-300 flex items-center space-x-2"
              >
                <span>👥</span>
                <span>Community</span>
              </button>
              <button
                onClick={() => onNavigate?.('bible')}
                className="px-4 py-2 rounded-lg font-medium text-[var(--color-neutral-50)] bg-[var(--color-neutral-800)] hover:bg-[var(--color-neutral-700)] border border-[var(--color-neutral-700)] hover:border-[var(--color-neutral-600)] transition-all duration-300 flex items-center space-x-2"
              >
                <span>📖</span>
                <span>Bible</span>
              </button>
              <button
                onClick={() => onNavigate?.('meditation')}
                className="px-4 py-2 rounded-lg font-medium text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-50)] hover:bg-[var(--color-neutral-800)] border border-[var(--color-neutral-700)]/50 hover:border-[var(--color-neutral-600)] transition-all duration-300 flex items-center space-x-2"
              >
                <span>🧘</span>
                <span>Meditation</span>
              </button>
              <button
                onClick={() => onNavigate?.('subscription')}
                className="px-4 py-2 rounded-lg font-semibold text-[var(--color-neutral-50)] bg-gradient-to-r from-[var(--color-warning-500)] to-[var(--color-warning-600)] hover:from-[var(--color-warning-600)] hover:to-[var(--color-warning-500)] transition-all duration-300 flex items-center space-x-2 shadow-lg shadow-[var(--color-warning-500)]/25"
              >
                <span>⭐</span>
                <span>Pro</span>
              </button>
            </div>

            {/* Mobile Right Side - Pro Button + Menu */}
            <div className="lg:hidden flex items-center space-x-2">
              <button
                onClick={() => onNavigate?.('subscription')}
                className="px-3 py-2 rounded-lg font-semibold text-[var(--color-neutral-50)] bg-gradient-to-r from-[var(--color-warning-500)] to-[var(--color-warning-600)] hover:from-[var(--color-warning-600)] hover:to-[var(--color-warning-500)] transition-all duration-300 flex items-center space-x-1 shadow-lg shadow-[var(--color-warning-500)]/25 text-sm"
              >
                <span>⭐</span>
                <span className="hidden sm:inline">Pro</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center p-4 pt-24">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-6xl font-bold text-[var(--text-primary)] mb-4">
            Bible Reading
          </h1>
          <p className="text-lg sm:text-xl text-[var(--text-secondary)] mb-6">
            Focused time in God's Word
          </p>
        </div>

      {/* Timer Container - Now First and More Prominent */}
      <div className="bg-white/10 rounded-3xl p-8 sm:p-12 border border-white/20 max-w-md w-full mb-8">
        {/* Timer Controls */}
        <div className="flex justify-center space-x-4 mb-6">
          <button
            onClick={() => setSelectedMinutes(5)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              selectedMinutes === 5 
                ? 'bg-amber-500 text-black' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            5 min
          </button>
          <button
            onClick={() => setSelectedMinutes(10)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              selectedMinutes === 10 
                ? 'bg-amber-500 text-black' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            10 min
          </button>
          <button
            onClick={() => setSelectedMinutes(15)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              selectedMinutes === 15 
                ? 'bg-amber-500 text-black' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            15 min
          </button>
          <button
            onClick={() => setSelectedMinutes(30)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              selectedMinutes === 30 
                ? 'bg-amber-500 text-black' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            30 min
          </button>
        </div>

        {/* Progress Ring */}
        <div className="relative w-48 h-48 mx-auto mb-6">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background Circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="8"
            />
            {/* Progress Circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - ((selectedMinutes * 60 - timeRemaining) / (selectedMinutes * 60)))}`}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          
          {/* Timer Display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl sm:text-6xl font-bold text-white mb-2">
                {formatTime(timeRemaining)}
              </div>
              <div className="text-base text-gray-300">
                {isReading ? 'Reading...' : 'Ready'}
              </div>
            </div>
          </div>

          {/* Progress Percentage */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="bg-white/20 rounded-full px-4 py-2 text-sm font-medium text-white">
              {Math.round(((selectedMinutes * 60 - timeRemaining) / (selectedMinutes * 60)) * 100)}%
            </div>
          </div>
        </div>

        {/* Timer Action Buttons */}
        <div className="flex justify-center space-x-4">
          {!isReading ? (
            <button
              onClick={() => {
                setTimeRemaining(selectedMinutes * 60);
                setIsReading(true);
              }}
              className="bg-amber-500 text-black px-6 py-3 rounded-xl font-semibold hover:bg-amber-400 transition-all duration-300"
            >
              Start Reading
            </button>
          ) : (
            <button
              onClick={() => setIsReading(false)}
              className="bg-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-400 transition-all duration-300"
            >
              Pause
            </button>
          )}
          
          <button
            onClick={resetReading}
            className="bg-white/10 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 border border-white/20"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Bible Content Section - Now Below Timer */}
      <div className="space-y-6 max-w-4xl w-full">
                 {/* Verse of the Day */}
         <div className="bg-white/10 border border-white/20 rounded-lg p-6">
           <h3 className="text-lg font-semibold text-white mb-3">🎯 Today's Verse</h3>
           <p className="text-white/80 text-sm mb-2">{verseOfTheDay?.reference || 'Psalm 46:10'}</p>
           <p className="text-white text-base leading-relaxed">
             {verseOfTheDay?.text || 'Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth.'}
           </p>
         </div>

         {/* Daily Reading Suggestion */}
         <div className="bg-white/10 border border-white/20 rounded-lg p-6">
           <h3 className="text-lg font-semibold text-white mb-3">📚 Daily Reading</h3>
           <p className="text-white/80 text-sm mb-2">{dailyReading?.reference || 'Psalm 1'}</p>
           <p className="text-white text-base leading-relaxed mb-3">{dailyReading?.description || 'The Way of the Righteous'}</p>
           <p className="text-white/70 text-sm">
             💡 <strong>Available:</strong> Popular verses and readings
           </p>
         </div>

        {/* Bible Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setShowBibleReader(true)}
            className="bg-amber-500 text-black px-8 py-3 rounded-xl text-lg font-semibold hover:bg-amber-400 transition-all duration-300 border-2 border-amber-400"
          >
            📖 Read Full Bible
          </button>
          
          <button
            onClick={() => setShowSearch(true)}
            className="bg-amber-500/20 text-amber-400 px-6 py-3 rounded-xl text-sm hover:bg-amber-500/30 transition-all duration-300 border border-amber-400/30"
          >
            🔍 Search Bible Verses
          </button>
        </div>

                 {/* Status Message */}
         <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-4">
           <div className="flex items-start space-x-3">
             <span className="text-yellow-400 text-xl">📖</span>
             <div>
               <h4 className="text-yellow-400 font-medium mb-2">Content Status</h4>
               <p className="text-yellow-300/80 text-sm leading-relaxed">
                 <strong>✅ Available:</strong> Popular verses, readings, search<br/>
                 <strong>🚧 Coming:</strong> Full Bible chapters<br/>
                 <strong>💡 Tip:</strong> Use curated content for daily inspiration
               </p>
             </div>
           </div>
         </div>
      </div>
    </div>

    {/* Daily Reading Suggestion */}
       {dailyReading && currentBibleContent && (
         <div className="bg-white/10 rounded-2xl p-6 border border-white/20 max-w-3xl w-full mb-8">
           <div className="text-center mb-4">
             <div className="text-sm text-amber-400 mb-2">Today's Reading</div>
             <div className="text-xl font-bold text-white mb-2">{dailyReading.reference}</div>
             <div className="text-base text-gray-300">{dailyReading.description}</div>
           </div>
           
           <div className="bg-white/5 rounded-xl p-4 border border-white/10">
             <div className="text-base text-white leading-relaxed mb-3">
               "{currentBibleContent.text}"
             </div>
             <div className="text-xs text-gray-400 text-right">{currentBibleContent.translation}</div>
           </div>
           
           <div className="flex justify-center mt-4 space-x-2">
             <button
               onClick={() => setShowBibleContent(!showBibleContent)}
               className="bg-amber-500/20 text-amber-400 px-4 py-2 rounded-lg text-sm hover:bg-amber-500/30 transition-all duration-300 border border-amber-400/30"
             >
               {showBibleContent ? 'Hide' : 'Read More'}
             </button>
             <button
               onClick={() => onNavigate?.('community')}
               className="bg-white/10 text-white px-4 py-2 rounded-lg text-sm hover:bg-white/20 transition-all duration-300 border border-white/20"
             >
               Share
             </button>
           </div>
         </div>
       )}

      {/* Mobile Navigation Tabs - Side by Side Compact */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center pb-4">
        <div className="flex items-center space-x-2 bg-[var(--color-neutral-800)]/80 backdrop-blur-xl rounded-2xl p-2 border border-[var(--color-neutral-700)] shadow-2xl">
          {/* Home Tab */}
          <button
            onClick={() => onNavigate?.('dashboard')}
            className="flex flex-col items-center space-y-1 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-neutral-700)]/30 to-[var(--color-neutral-800)]/40 backdrop-blur-xl rounded-xl flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-[var(--color-neutral-600)]/50 border-2 border-[var(--color-neutral-600)]/80 group-hover:border-[var(--color-neutral-500)]">
              <span className="text-lg text-[var(--color-neutral-300)]">🏠</span>
            </div>
            <span className="text-xs font-bold text-[var(--color-neutral-50)] group-hover:text-[var(--color-neutral-300)] transition-colors duration-300">Home</span>
          </button>
          
          {/* Prayer Tab */}
          <button
            onClick={() => onNavigate?.('prayer')}
            className="flex flex-col items-center space-y-1 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-primary-500)]/30 to-[var(--color-info-500)]/40 backdrop-blur-xl rounded-xl flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-[var(--color-primary-500)]/50 border-2 border-blue-500/80 group-hover:border-blue-500">
              <span className="text-lg text-[var(--color-primary-500)]">✨</span>
            </div>
            <span className="text-xs font-bold text-[var(--color-neutral-50)] group-hover:text-[var(--color-primary-500)] transition-colors duration-300">Prayer</span>
          </button>
          
          {/* Bible Tab - Active */}
          <button
            onClick={() => onNavigate?.('bible')}
            className="flex flex-col items-center space-y-1 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-warning-500)]/30 to-[var(--color-warning-600)]/40 backdrop-blur-xl rounded-xl flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-[var(--color-warning-500)]/50 border-2 border-amber-500/80 group-hover:border-amber-500">
              <span className="text-lg text-[var(--color-warning-500)]">📖</span>
            </div>
            <span className="text-xs font-bold text-[var(--color-warning-500)] group-hover:text-[var(--color-warning-400)] transition-colors duration-300">Bible</span>
          </button>
          
          {/* Meditation Tab */}
          <button
            onClick={() => onNavigate?.('meditation')}
            className="flex flex-col items-center space-y-1 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-success-500)]/30 to-[var(--color-info-500)]/40 backdrop-blur-xl rounded-xl flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-[var(--color-success-500)]/50 border-2 border-emerald-500/80 group-hover:border-emerald-500">
              <span className="text-lg text-[var(--color-success-500)]">🧘</span>
            </div>
            <span className="text-xs font-bold text-[var(--color-neutral-50)] group-hover:text-[var(--color-success-500)] transition-colors duration-300">Meditation</span>
          </button>
        </div>
      </div>

      {/* Simple Reminder Popup */}
      {showReminder && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/20 border border-white/30 text-white px-6 py-4 rounded-2xl z-50 max-w-sm text-center">
          <p className="text-sm">{focusReminders[currentReminderIndex]}</p>
        </div>
      )}

      {/* Bible Search Modal */}
      {showSearch && (
        <BibleSearch onClose={() => setShowSearch(false)} />
      )}

      {/* Bible Reader Modal */}
      {showBibleReader && (
        <BibleReader onClose={() => setShowBibleReader(false)} />
      )}
    </div>
  );
};
