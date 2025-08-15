import React, { useState, useEffect } from 'react';
import { PrayerReminder } from '../types/prayer';
import { prayerService } from '../services/prayerService';

interface PrayerRemindersProps {
  onNavigate?: (page: string) => void;
}

export const PrayerReminders: React.FC<PrayerRemindersProps> = ({ onNavigate }) => {
  const [reminders, setReminders] = useState<PrayerReminder[]>([]);
  const [newReminder, setNewReminder] = useState('');
  const [newTiming, setNewTiming] = useState(30);
  const [newType, setNewType] = useState<'focus' | 'scripture' | 'breathing' | 'intention'>('focus');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const data = await prayerService.getPrayerReminders();
      setReminders(data);
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const addReminder = async () => {
    if (!newReminder.trim()) return;

    const reminder: PrayerReminder = {
      id: Date.now().toString(),
      message: newReminder.trim(),
      timing: newTiming,
      type: newType,
      enabled: true
    };

    try {
      const updatedReminders = [...reminders, reminder];
      await prayerService.savePrayerReminders(updatedReminders);
      setReminders(updatedReminders);
      setNewReminder('');
      setNewTiming(30);
      setNewType('focus');
    } catch (error) {
      console.error('Error adding reminder:', error);
    }
  };

  const toggleReminder = async (id: string) => {
    try {
      const updatedReminders = reminders.map(r => 
        r.id === id ? { ...r, enabled: !r.enabled } : r
      );
      await prayerService.savePrayerReminders(updatedReminders);
      setReminders(updatedReminders);
    } catch (error) {
      console.error('Error toggling reminder:', error);
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      const updatedReminders = reminders.filter(r => r.id !== id);
      await prayerService.savePrayerReminders(updatedReminders);
      setReminders(updatedReminders);
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  const startEditing = (reminder: PrayerReminder) => {
    setEditingId(reminder.id);
    setEditingText(reminder.message);
  };

  const saveEdit = async () => {
    if (!editingId || !editingText.trim()) return;

    try {
      const updatedReminders = reminders.map(r => 
        r.id === editingId ? { ...r, message: editingText.trim() } : r
      );
      await prayerService.savePrayerReminders(updatedReminders);
      setReminders(updatedReminders);
      setEditingId(null);
      setEditingText('');
    } catch (error) {
      console.error('Error saving edit:', error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      focus: '🎯',
      scripture: '📖',
      breathing: '🫁',
      intention: '💭'
    };
    return icons[type] || '📝';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      focus: 'from-green-400 to-emerald-500',
      scripture: 'from-blue-400 to-indigo-500',
      breathing: 'from-purple-400 to-pink-500',
      intention: 'from-orange-400 to-red-500'
    };
    return colors[type] || 'from-gray-400 to-gray-500';
  };

  const formatTiming = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    } else if (remainingSeconds === 0) {
      return `${minutes}m`;
    } else {
      return `${minutes}m ${remainingSeconds}s`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 pt-20">
      <div className="max-w-4xl mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">Prayer Reminders</h1>
          <p className="text-xl text-gray-600">Set gentle prompts to guide your prayer time</p>
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

        {/* Add New Reminder */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-green-200 shadow-2xl mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Reminder</h2>
          
          <div className="space-y-6">
            {/* Message Input */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                Reminder Message
              </label>
              <textarea
                value={newReminder}
                onChange={(e) => setNewReminder(e.target.value)}
                placeholder="e.g., Take a deep breath and center yourself in God's presence..."
                className="w-full p-4 text-lg border-2 border-green-300 rounded-2xl bg-white/80 backdrop-blur-sm focus:border-green-500 focus:outline-none transition-all duration-300 resize-none"
                rows={3}
              />
            </div>

            {/* Type and Timing */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-3">
                  Reminder Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full p-4 text-lg border-2 border-green-300 rounded-2xl bg-white/80 backdrop-blur-sm focus:border-green-500 focus:outline-none transition-all duration-300"
                >
                  <option value="focus">🎯 Focus</option>
                  <option value="scripture">📖 Scripture</option>
                  <option value="breathing">🫁 Breathing</option>
                  <option value="intention">💭 Intention</option>
                </select>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-3">
                  Show After (seconds)
                </label>
                <input
                  type="number"
                  value={newTiming}
                  onChange={(e) => setNewTiming(parseInt(e.target.value) || 30)}
                  min="10"
                  max="600"
                  className="w-full p-4 text-lg border-2 border-green-300 rounded-2xl bg-white/80 backdrop-blur-sm focus:border-green-500 focus:outline-none transition-all duration-300"
                />
              </div>
            </div>

            {/* Add Button */}
            <div className="text-center">
              <button
                onClick={addReminder}
                disabled={!newReminder.trim()}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-2xl text-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                ➕ Add Reminder
              </button>
            </div>
          </div>
        </div>

        {/* Existing Reminders */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Reminders</h2>
          
          {reminders.length === 0 ? (
            <div className="text-center py-12 bg-white/90 backdrop-blur-sm rounded-3xl border border-green-200">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">No reminders yet</h3>
              <p className="text-gray-600">Add your first reminder to guide your prayer time</p>
            </div>
          ) : (
            reminders.map((reminder) => (
              <div key={reminder.id} className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-green-200 shadow-xl hover:shadow-2xl transition-all duration-300">
                
                {/* Reminder Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${getTypeColor(reminder.type)} rounded-full flex items-center justify-center`}>
                      <span className="text-white text-xl">{getTypeIcon(reminder.type)}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 capitalize">
                        {reminder.type} Reminder
                      </h3>
                      <p className="text-gray-600">
                        Shows after {formatTiming(reminder.timing)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Toggle Switch */}
                    <button
                      onClick={() => toggleReminder(reminder.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        reminder.enabled ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          reminder.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    
                    <span className={`text-sm font-medium ${
                      reminder.enabled ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {reminder.enabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                
                {/* Reminder Message */}
                <div className="mb-4">
                  {editingId === reminder.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full p-3 border-2 border-green-300 rounded-xl bg-white/80 backdrop-blur-sm focus:border-green-500 focus:outline-none transition-all duration-300 resize-none"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="bg-green-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-600 transition-all duration-300"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="bg-gray-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-gray-600 transition-all duration-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <p className="text-gray-700">{reminder.message}</p>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditing(reminder)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-600 transition-all duration-300"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => deleteReminder(reminder.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-600 transition-all duration-300"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    ID: {reminder.id.slice(-6)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tips Section */}
        <div className="mt-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-3xl p-6 border border-green-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">💡 Reminder Tips</h3>
          <ul className="text-gray-700 space-y-2">
            <li>• Keep reminders gentle and encouraging</li>
            <li>• Space reminders 30-60 seconds apart for longer prayers</li>
            <li>• Use scripture reminders to include God's Word</li>
            <li>• Breathing reminders help center your focus</li>
            <li>• Intention reminders keep you focused on your prayer goals</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
