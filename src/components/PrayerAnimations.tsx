import React, { useEffect, useRef } from 'react';

interface PrayerAnimationsProps {
  progress: number; // 0-100
  isComplete: boolean;
  showConfetti: boolean;
  onConfettiComplete?: () => void;
}

export const PrayerAnimations: React.FC<PrayerAnimationsProps> = ({
  progress,
  isComplete,
  showConfetti,
  onConfettiComplete
}) => {
  const confettiRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Progress animation
  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.height = `${progress}%`;
    }
  }, [progress]);

  // Confetti animation
  useEffect(() => {
    if (showConfetti && confettiRef.current) {
      createConfetti();
    }
  }, [showConfetti]);

  const createConfetti = () => {
    if (!confettiRef.current) return;

    const colors = ['#10B981', '#059669', '#047857', '#065F46', '#064E3B'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'absolute w-2 h-2 rounded-full animate-bounce';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.animationDelay = `${Math.random() * 2}s`;
      confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
      
      confettiRef.current.appendChild(confetti);

      // Remove confetti after animation
      setTimeout(() => {
        if (confetti.parentNode) {
          confetti.parentNode.removeChild(confetti);
        }
      }, 4000);
    }

    // Call completion callback
    setTimeout(() => {
      onConfettiComplete?.();
    }, 4000);
  };

  return (
    <>
      {/* Progress Bar Animation */}
      <div className="relative w-full h-full overflow-hidden rounded-3xl">
        <div
          ref={progressRef}
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-400 to-emerald-500 transition-all duration-1000 ease-out"
          style={{ height: '0%' }}
        />
        
        {/* Glow effect when complete */}
        {isComplete && (
          <div className="absolute inset-0 bg-gradient-to-t from-green-400 to-emerald-500 opacity-20 animate-pulse rounded-3xl" />
        )}
      </div>

      {/* Confetti Container */}
      {showConfetti && (
        <div
          ref={confettiRef}
          className="fixed inset-0 pointer-events-none z-50"
        />
      )}

      {/* Breathing Animation */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={`w-32 h-32 border-4 border-green-300 rounded-full transition-all duration-3000 ease-in-out ${
          isComplete ? 'scale-150 opacity-0' : 'scale-100 opacity-30 animate-pulse'
        }`} />
      </div>

      {/* Completion Glow */}
      {isComplete && (
        <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 opacity-20 animate-pulse rounded-3xl" />
      )}
    </>
  );
};

// Breathing Guide Component
interface BreathingGuideProps {
  isActive: boolean;
  onComplete?: () => void;
}

export const BreathingGuide: React.FC<BreathingGuideProps> = ({
  isActive,
  onComplete
}) => {
  const [phase, setPhase] = React.useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [count, setCount] = React.useState(4);

  React.useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          if (phase === 'inhale') {
            setPhase('hold');
            return 4;
          } else if (phase === 'hold') {
            setPhase('exhale');
            return 6;
          } else {
            setPhase('inhale');
            return 4;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, phase]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-12 text-center shadow-2xl border-4 border-green-300">
        <div className="text-6xl mb-6">🫁</div>
        <h3 className="text-3xl font-bold text-gray-800 mb-4 capitalize">
          {phase}
        </h3>
        <div className="text-8xl font-bold text-green-600 mb-6">
          {count}
        </div>
        <p className="text-xl text-gray-600 mb-6">
          Follow the rhythm of your breath
        </p>
        <button
          onClick={onComplete}
          className="bg-green-500 text-white px-8 py-3 rounded-2xl font-bold hover:bg-green-600 transition-all duration-300"
        >
          Continue Prayer
        </button>
      </div>
    </div>
  );
};

// Scripture Display Component
interface ScriptureDisplayProps {
  verse: string;
  reference: string;
  isVisible: boolean;
  onClose?: () => void;
}

export const ScriptureDisplay: React.FC<ScriptureDisplayProps> = ({
  verse,
  reference,
  isVisible,
  onClose
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-12 max-w-2xl mx-4 text-center shadow-2xl border-4 border-blue-300">
        <div className="text-6xl mb-6">📖</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Scripture</h3>
        <div className="bg-blue-50 rounded-2xl p-6 mb-6">
          <p className="text-xl text-gray-700 italic mb-4">"{verse}"</p>
          <p className="text-lg font-semibold text-blue-600">{reference}</p>
        </div>
        <button
          onClick={onClose}
          className="bg-blue-500 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-600 transition-all duration-300"
        >
          Continue Prayer
        </button>
      </div>
    </div>
  );
};

// Focus Reminder Component
interface FocusReminderProps {
  message: string;
  isVisible: boolean;
  onClose?: () => void;
}

export const FocusReminder: React.FC<FocusReminderProps> = ({
  message,
  isVisible,
  onClose
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-12 max-w-2xl mx-4 text-center shadow-2xl border-4 border-green-300">
        <div className="text-6xl mb-6">🎯</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Focus Reminder</h3>
        <div className="bg-green-50 rounded-2xl p-6 mb-6">
          <p className="text-xl text-gray-700">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="bg-green-500 text-white px-8 py-3 rounded-2xl font-bold hover:bg-green-600 transition-all duration-300"
        >
          Continue Prayer
        </button>
      </div>
    </div>
  );
};

// Timer Completion Celebration
interface TimerCompletionProps {
  isVisible: boolean;
  onContinue?: () => void;
}

export const TimerCompletion: React.FC<TimerCompletionProps> = ({
  isVisible,
  onContinue
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-12 text-center shadow-2xl border-4 border-green-300 animate-bounce">
        <div className="text-8xl mb-6">🎉</div>
        <h3 className="text-4xl font-bold text-gray-800 mb-4">Prayer Complete!</h3>
        <p className="text-xl text-gray-600 mb-8">
          Well done! You've spent time with God.
        </p>
        <div className="flex gap-4">
          <button
            onClick={onContinue}
            className="bg-green-500 text-white px-8 py-3 rounded-2xl font-bold hover:bg-green-600 transition-all duration-300"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};
