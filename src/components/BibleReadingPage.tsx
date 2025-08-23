import React, { useState, useEffect, useRef } from 'react'
import { useSupabaseAuth } from './SupabaseAuthProvider'
import { DailyProgressReminder } from './DailyProgressReminder'
import { bibleService, BibleVerse } from '../services/BibleService'
import { BibleSearch } from './BibleSearch'
import { BibleReader } from './BibleReader'

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
  const [isReading, setIsReading] = useState(true) // Start with timer running automatically
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

  // Define completeReading function before using it in useEffect
  const completeReading = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (reminderIntervalRef.current) {
      clearInterval(reminderIntervalRef.current);
    }
    
    // Save reading session (simplified)
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
    
    setIsReading(false);
    setReadingCompleted(true);
    setShowReminder(false);
    
    // Call timer completion handler
    onTimerComplete?.();
  };

  useEffect(() => {
    // Start timer immediately when component mounts
    console.log('Component mounted, starting timer with:', selectedMinutes, 'minutes');
    
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
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isReading, selectedMinutes]);

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
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4">
      {/* Simple Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-6xl font-bold text-white mb-4">
          Bible Reading Time
        </h1>
        <p className="text-lg sm:text-xl text-gray-300 mb-6">
          Dive into God's Word with focused reading
        </p>
        
        {/* Bible Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
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
        
        {/* Bible Content Section */}
        <div className="space-y-6">
          {/* Verse of the Day */}
          <div className="bg-white/10 border border-white/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-3">🎯 Verse of the Day</h3>
            <p className="text-white/80 text-sm mb-2">{verseOfTheDay?.reference || 'Psalm 46:10'}</p>
            <p className="text-white text-base leading-relaxed">
              {verseOfTheDay?.text || 'Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth.'}
            </p>
          </div>

          {/* Daily Reading Suggestion */}
          <div className="bg-white/10 border border-white/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-3">📚 Daily Reading Suggestion</h3>
            <p className="text-white/80 text-sm mb-2">{dailyReading?.reference || 'Psalm 1'}</p>
            <p className="text-white text-base leading-relaxed mb-3">{dailyReading?.description || 'The Way of the Righteous'}</p>
            <p className="text-white/70 text-sm">
              💡 <strong>Available Now:</strong> Popular verses and daily readings
            </p>
          </div>

          {/* Bible Access Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setShowSearch(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <span>🔍</span>
              <span>Search Bible Verses</span>
            </button>
            
            <button
              onClick={() => setShowBibleReader(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <span>📖</span>
              <span>Browse Bible Books</span>
            </button>
          </div>

          {/* Status Message */}
          <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <span className="text-yellow-400 text-xl">📖</span>
              <div>
                <h4 className="text-yellow-400 font-medium mb-2">Bible Content Status</h4>
                <p className="text-yellow-300/80 text-sm leading-relaxed">
                  <strong>✅ Available Now:</strong> Popular verses, daily readings, and search functionality<br/>
                  <strong>🚧 Coming Soon:</strong> Complete Bible chapters and full book content<br/>
                  <strong>💡 Tip:</strong> Use our curated content for daily inspiration while we expand the library
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Timer Container */}
      <div className="bg-white/10 rounded-3xl p-8 sm:p-12 border border-white/20 max-w-md w-full mb-8">
        {/* Simple Progress Ring */}
        <div className="relative w-48 h-48 mx-auto mb-8">
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
              {showBibleContent ? 'Hide Full Text' : 'Read Full Chapter'}
            </button>
            <button
              onClick={() => onNavigate?.('community')}
              className="bg-white/10 text-white px-4 py-2 rounded-lg text-sm hover:bg-white/20 transition-all duration-300 border border-white/20"
            >
              Share Reflection
            </button>
          </div>
        </div>
      )}

      {/* Simple Bottom Navigation */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="bg-white/10 rounded-2xl p-3 border border-white/20">
          <div className="flex items-center space-x-3">
            {/* Home Tab */}
            <button
              onClick={() => {
                if (isFirstTimeUser) {
                  onStartQuestionnaire?.();
                } else {
                  onNavigate?.('dashboard');
                }
              }}
              className="flex flex-col items-center space-y-1 px-4 py-2 rounded-xl text-white hover:bg-white/20 transition-all duration-300"
            >
              <span className="text-xl">🏠</span>
              <span className="text-sm">Home</span>
            </button>
            
            {/* Restart Tab */}
            <button
              onClick={resetReading}
              className="flex flex-col items-center space-y-1 px-4 py-2 rounded-xl text-white hover:bg-white/20 transition-all duration-300"
            >
              <span className="text-xl">🔄</span>
              <span className="text-sm">Restart</span>
            </button>
            
            {/* Share Tab */}
            <button
              onClick={() => onNavigate?.('community')}
              className="flex flex-col items-center space-y-1 px-4 py-2 rounded-xl text-white hover:bg-white/20 transition-all duration-300"
            >
              <span className="text-xl">🌟</span>
              <span className="text-sm">Share</span>
            </button>
          </div>
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
