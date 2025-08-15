import React, { useState, useEffect } from 'react';
import { PrayerSession } from '../types/prayer';
import { prayerService } from '../services/prayerService';

interface PrayerReflectionProps {
  session?: PrayerSession;
  onNavigate?: (page: string) => void;
  onSave?: (reflection: string) => void;
}

export const PrayerReflection: React.FC<PrayerReflectionProps> = ({ 
  session, 
  onNavigate, 
  onSave 
}) => {
  const [reflection, setReflection] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [insights, setInsights] = useState('');
  const [prayerRequests, setPrayerRequests] = useState('');
  const [mood, setMood] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (session?.reflection) {
      setReflection(session.reflection);
    }
  }, [session]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const fullReflection = {
        reflection,
        gratitude,
        insights,
        prayerRequests,
        mood,
        timestamp: new Date().toISOString()
      };

      if (onSave) {
        onSave(JSON.stringify(fullReflection));
      }

      // Show success message
      setTimeout(() => {
        setIsSaving(false);
        // Navigate to next step
        onNavigate?.('community');
      }, 1000);
    } catch (error) {
      console.error('Error saving reflection:', error);
      setIsSaving(false);
    }
  };

  const reflectionPrompts = [
    "What did you sense God saying to you during prayer?",
    "How did you feel God's presence today?",
    "What scripture or thought stood out to you?",
    "What would you like to remember from this prayer time?",
    "How did this prayer time impact your heart?"
  ];

  const gratitudePrompts = [
    "What are you thankful for today?",
    "What blessings did you notice?",
    "Who are you grateful for?",
    "What answered prayers can you celebrate?",
    "What simple joys did you experience?"
  ];

  const insightPrompts = [
    "What new understanding did you gain?",
    "What pattern or theme did you notice?",
    "How did God reveal Himself to you?",
    "What truth became clearer today?",
    "What did you learn about yourself or God?"
  ];

  const getMoodEmoji = (selectedMood: string) => {
    const emojis: Record<string, string> = {
      peaceful: '😌',
      grateful: '🙏',
      joyful: '😊',
      hopeful: '🤗',
      refreshed: '✨',
      comforted: '🤱',
      inspired: '💫',
      humbled: '🙇',
      thankful: '🙌',
      centered: '🧘'
    };
    return emojis[selectedMood] || '🙏';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 pt-20">
      <div className="max-w-4xl mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">Prayer Reflection</h1>
          <p className="text-xl text-gray-600">Capture what God placed on your heart</p>
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

        {/* Reflection Form */}
        <div className="space-y-8">
          
          {/* Main Reflection */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-green-200 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📝 Your Reflection</h2>
            
            <div className="mb-6">
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                What did you experience during prayer?
              </label>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Share what God placed on your heart, any insights you received, or how you felt His presence..."
                className="w-full p-4 text-lg border-2 border-green-300 rounded-2xl bg-white/80 backdrop-blur-sm focus:border-green-500 focus:outline-none transition-all duration-300 resize-none"
                rows={4}
              />
            </div>

            {/* Reflection Prompts */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">💭 Reflection Prompts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reflectionPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setReflection(prev => prev ? `${prev}\n\n${prompt}` : prompt)}
                    className="text-left p-3 bg-gray-50 hover:bg-green-50 rounded-xl border-2 border-transparent hover:border-green-300 transition-all duration-300"
                  >
                    <p className="text-gray-700 text-sm">{prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Gratitude */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-green-200 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🙏 Gratitude</h2>
            
            <div className="mb-6">
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                What are you thankful for?
              </label>
              <textarea
                value={gratitude}
                onChange={(e) => setGratitude(e.target.value)}
                placeholder="List the things you're grateful for today..."
                className="w-full p-4 text-lg border-2 border-green-300 rounded-2xl bg-white/80 backdrop-blur-sm focus:border-green-500 focus:outline-none transition-all duration-300 resize-none"
                rows={3}
              />
            </div>

            {/* Gratitude Prompts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {gratitudePrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setGratitude(prev => prev ? `${prev}\n\n${prompt}` : prompt)}
                  className="text-left p-3 bg-yellow-50 hover:bg-yellow-100 rounded-xl border-2 border-transparent hover:border-yellow-300 transition-all duration-300"
                >
                  <p className="text-gray-700 text-sm">{prompt}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-green-200 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">💡 Insights & Learnings</h2>
            
            <div className="mb-6">
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                What did you learn or understand?
              </label>
              <textarea
                value={insights}
                onChange={(e) => setInsights(e.target.value)}
                placeholder="Share any new understanding, revelations, or lessons from your prayer time..."
                className="w-full p-4 text-lg border-2 border-green-300 rounded-2xl bg-white/80 backdrop-blur-sm focus:border-green-500 focus:outline-none transition-all duration-300 resize-none"
                rows={3}
              />
            </div>

            {/* Insight Prompts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insightPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setInsights(prev => prev ? `${prev}\n\n${prompt}` : prompt)}
                  className="text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-xl border-2 border-transparent hover:border-blue-300 transition-all duration-300"
                >
                  <p className="text-gray-700 text-sm">{prompt}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Prayer Requests */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-green-200 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🤲 Prayer Requests</h2>
            
            <div className="mb-6">
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                What prayer requests came to mind?
              </label>
              <textarea
                value={prayerRequests}
                onChange={(e) => setPrayerRequests(e.target.value)}
                placeholder="Note any prayer requests for yourself, others, or situations that came to mind..."
                className="w-full p-4 text-lg border-2 border-green-300 rounded-2xl bg-white/80 backdrop-blur-sm focus:border-green-500 focus:outline-none transition-all duration-300 resize-none"
                rows={3}
              />
            </div>
          </div>

          {/* Current Mood */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-green-200 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">😊 How are you feeling now?</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                'peaceful', 'grateful', 'joyful', 'hopeful', 'refreshed',
                'comforted', 'inspired', 'humbled', 'thankful', 'centered'
              ].map((moodOption) => (
                <button
                  key={moodOption}
                  onClick={() => setMood(moodOption)}
                  className={`p-4 rounded-2xl font-medium transition-all duration-300 border-2 ${
                    mood === moodOption
                      ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white border-transparent shadow-lg'
                      : 'bg-white/80 text-gray-700 border-green-300 hover:bg-green-50'
                  }`}
                >
                  <div className="text-2xl mb-2">{getMoodEmoji(moodOption)}</div>
                  <div className="text-sm capitalize">{moodOption}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-2xl text-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? '💾 Saving...' : '💾 Save Reflection'}
            </button>
            
            <button
              onClick={() => onNavigate?.('community')}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-4 rounded-2xl text-xl font-bold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105 shadow-2xl"
            >
              🌟 Share with Community
            </button>
          </div>

          {/* Skip Option */}
          <div className="text-center">
            <button
              onClick={() => onNavigate?.('community')}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip reflection and continue
            </button>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-3xl p-6 border border-green-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">💡 Reflection Tips</h3>
          <ul className="text-gray-700 space-y-2">
            <li>• There's no right or wrong way to reflect - be honest with yourself</li>
            <li>• Even brief notes can help you remember God's work in your life</li>
            <li>• Regular reflection helps you see patterns in your spiritual journey</li>
            <li>• You can always come back and add more later</li>
            <li>• Sharing reflections can encourage others in their faith</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
