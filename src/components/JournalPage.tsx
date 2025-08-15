import React, { useState } from 'react'

interface JournalEntry {
  id: number
  date: string
  title: string
  content: string
  mood: string
  tags: string[]
}

const mockEntries: JournalEntry[] = [
  {
    id: 1,
    date: "2024-01-15",
    title: "God's Faithfulness in Trials",
    content: "Today I was reminded of how God never leaves us alone in our struggles. Even when I feel overwhelmed, His peace surpasses all understanding.",
    mood: "Grateful",
    tags: ["faith", "trials", "peace"]
  },
  {
    id: 2,
    date: "2024-01-14",
    title: "Morning Prayer Reflection",
    content: "Started my day with prayer and felt such a deep connection with God. His presence was so tangible this morning.",
    mood: "Blessed",
    tags: ["prayer", "morning", "presence"]
  },
  {
    id: 3,
    date: "2024-01-13",
    title: "Bible Study Insights",
    content: "Studying John 3:16 today. The depth of God's love is truly amazing. He gave His only Son for us!",
    mood: "Inspired",
    tags: ["bible", "love", "sacrifice"]
  }
]

export const JournalPage: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>(mockEntries)
  const [showNewEntry, setShowNewEntry] = useState(false)
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    mood: 'Blessed',
    tags: ''
  })

  const handleSaveEntry = () => {
    if (newEntry.title && newEntry.content) {
      const entry: JournalEntry = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        title: newEntry.title,
        content: newEntry.content,
        mood: newEntry.mood,
        tags: newEntry.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      }
      setEntries([entry, ...entries])
      setNewEntry({ title: '', content: '', mood: 'Blessed', tags: '' })
      setShowNewEntry(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-2xl">
            <span className="text-white text-4xl">📝</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Spiritual Journal
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Document your spiritual journey and reflect on God's work in your life
          </p>
        </div>

        {/* New Entry Button */}
        <div className="text-center mb-8">
          <button
            onClick={() => setShowNewEntry(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            ✍️ Write New Entry
          </button>
        </div>

        {/* New Entry Form */}
        {showNewEntry && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-green-200 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">New Journal Entry</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newEntry.title}
                  onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                  className="w-full p-4 border border-green-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="What's on your heart today?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <textarea
                  value={newEntry.content}
                  onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                  className="w-full p-4 border border-green-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={6}
                  placeholder="Share your thoughts, prayers, and reflections..."
                />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mood</label>
                  <select
                    value={newEntry.mood}
                    onChange={(e) => setNewEntry({ ...newEntry, mood: e.target.value })}
                    className="w-full p-4 border border-green-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="Blessed">Blessed</option>
                    <option value="Grateful">Grateful</option>
                    <option value="Inspired">Inspired</option>
                    <option value="Peaceful">Peaceful</option>
                    <option value="Challenged">Challenged</option>
                    <option value="Seeking">Seeking</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={newEntry.tags}
                    onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })}
                    className="w-full p-4 border border-green-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="prayer, faith, gratitude"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowNewEntry(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEntry}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105"
                >
                  Save Entry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Journal Entries */}
        <div className="space-y-6">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-green-200 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{entry.title}</h3>
                  <p className="text-sm text-gray-500">{entry.date}</p>
                </div>
                <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  {entry.mood}
                </span>
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">{entry.content}</p>
              <div className="flex flex-wrap gap-2">
                {entry.tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
