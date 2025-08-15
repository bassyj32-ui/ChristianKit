import React, { useState, useEffect } from 'react';
import { PrayerSettings as PrayerSettingsType } from '../types/prayer';
import { prayerService } from '../services/prayerService';

interface PrayerSettingsProps {
  onNavigate?: (page: string) => void;
}

export const PrayerSettings: React.FC<PrayerSettingsProps> = ({ onNavigate }) => {
  const [settings, setSettings] = useState<PrayerSettingsType>({
    defaultDuration: 10,
    defaultMode: 'guided',
    enableReminders: true,
    reminderInterval: 30,
    ambientSound: 'none',
    autoSave: true,
    showScripture: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await prayerService.getPrayerSettings();
      setSettings(savedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await prayerService.savePrayerSettings(settings);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof PrayerSettingsType>(
    key: K,
    value: PrayerSettingsType[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const ambientSounds = [
    { value: 'none', label: 'None', description: 'No background sound' },
    { value: 'nature', label: 'Nature Sounds', description: 'Gentle rain, birds, forest' },
    { value: 'ocean', label: 'Ocean Waves', description: 'Calming ocean waves' },
    { value: 'worship', label: 'Worship Music', description: 'Soft instrumental worship' },
    { value: 'meditation', label: 'Meditation', description: 'Peaceful meditation music' }
  ];

  const prayerModes = [
    { value: 'guided', label: 'Guided Prayer', description: 'Step-by-step prayer prompts' },
    { value: 'silent', label: 'Silent Prayer', description: 'Just timer with minimal distractions' },
    { value: 'scripture', label: 'Scripture Prayer', description: 'Bible verses appear during prayer' },
    { value: 'worship', label: 'Worship Prayer', description: 'Background worship music' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 pt-20">
      <div className="max-w-4xl mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">Prayer Settings</h1>
          <p className="text-xl text-gray-600">Customize your prayer experience</p>
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

        {/* Settings Form */}
        <div className="space-y-8">
          
          {/* Default Duration */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-green-200 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">⏰ Default Prayer Duration</h2>
            
            <div className="mb-6">
              <label className="block text-lg font-semibold text-gray-700 mb-4">
                Choose your preferred prayer duration
              </label>
              <div className="flex flex-wrap justify-center gap-4">
                {[5, 10, 15, 20, 30].map((minutes) => (
                  <button
                    key={minutes}
                    onClick={() => updateSetting('defaultDuration', minutes)}
                    className={`p-6 rounded-2xl font-black text-2xl transition-all duration-300 hover:scale-105 border-4 ${
                      settings.defaultDuration === minutes
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-xl border-green-300'
                        : 'bg-white/80 text-gray-700 hover:bg-green-100 border-green-300'
                    }`}
                  >
                    {minutes}
                    <div className="text-sm font-medium mt-1">MINUTES</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Default Prayer Mode */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-green-200 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🙏 Default Prayer Mode</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              {prayerModes.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => updateSetting('defaultMode', mode.value as any)}
                  className={`p-6 rounded-2xl text-left transition-all duration-300 hover:scale-105 border-4 ${
                    settings.defaultMode === mode.value
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-xl border-green-300'
                      : 'bg-white/80 text-gray-700 hover:bg-green-100 border-green-300'
                  }`}
                >
                  <h3 className="text-xl font-bold mb-2">{mode.label}</h3>
                  <p className="text-sm opacity-80">{mode.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Reminder Settings */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-green-200 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🎯 Reminder Settings</h2>
            
            <div className="space-y-6">
              {/* Enable Reminders */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">Enable Focus Reminders</h3>
                  <p className="text-gray-600">Show gentle prompts during prayer</p>
                </div>
                <button
                  onClick={() => updateSetting('enableReminders', !settings.enableReminders)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.enableReminders ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.enableReminders ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Reminder Interval */}
              {settings.enableReminders && (
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-3">
                    Reminder Interval (seconds)
                  </label>
                  <input
                    type="range"
                    min="15"
                    max="120"
                    step="15"
                    value={settings.reminderInterval}
                    onChange={(e) => updateSetting('reminderInterval', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>15s</span>
                    <span className="font-semibold">{settings.reminderInterval}s</span>
                    <span>120s</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ambient Sound */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-green-200 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🔊 Ambient Sound</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              {ambientSounds.map((sound) => (
                <button
                  key={sound.value}
                  onClick={() => updateSetting('ambientSound', sound.value)}
                  className={`p-6 rounded-2xl text-left transition-all duration-300 hover:scale-105 border-4 ${
                    settings.ambientSound === sound.value
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-xl border-green-300'
                      : 'bg-white/80 text-gray-700 hover:bg-green-100 border-green-300'
                  }`}
                >
                  <h3 className="text-xl font-bold mb-2">{sound.label}</h3>
                  <p className="text-sm opacity-80">{sound.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Additional Settings */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-green-200 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">⚙️ Additional Settings</h2>
            
            <div className="space-y-6">
              {/* Auto Save */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">Auto Save Sessions</h3>
                  <p className="text-gray-600">Automatically save prayer sessions</p>
                </div>
                <button
                  onClick={() => updateSetting('autoSave', !settings.autoSave)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.autoSave ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.autoSave ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Show Scripture */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">Show Scripture Verses</h3>
                  <p className="text-gray-600">Display Bible verses during prayer</p>
                </div>
                <button
                  onClick={() => updateSetting('showScripture', !settings.showScripture)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.showScripture ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.showScripture ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-2xl text-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? '💾 Saving...' : '💾 Save Settings'}
            </button>
            
            <button
              onClick={loadSettings}
              className="flex-1 bg-white/80 backdrop-blur-sm border-4 border-green-300 text-green-700 px-8 py-4 rounded-2xl text-xl font-bold hover:bg-green-50 transition-all duration-300"
            >
              🔄 Reset to Defaults
            </button>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-2xl">
              ✅ Settings saved successfully!
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="mt-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-3xl p-6 border border-green-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">💡 Settings Tips</h3>
          <ul className="text-gray-700 space-y-2">
            <li>• Choose a duration that fits your schedule and energy level</li>
            <li>• Different prayer modes can help with different spiritual needs</li>
            <li>• Ambient sounds can help create a peaceful prayer environment</li>
            <li>• Reminders help keep you focused during longer prayer sessions</li>
            <li>• You can always change these settings later</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
