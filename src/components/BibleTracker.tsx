import React, { useState, useEffect } from 'react'
import { useSupabaseAuth } from './SupabaseAuthProvider'

interface BibleReading {
  id: string
  date: string
  book: string
  chapter: number
  verseStart: number
  verseEnd: number
  timeSpent: number
  notes: string
  memorized: boolean
  reflection: string
  tags: string[]
}

interface ReadingPlan {
  id: string
  name: string
  description: string
  books: string[]
  totalChapters: number
  completedChapters: number
  startDate: string
  targetDate: string
  dailyGoal: number
}

export const BibleTracker: React.FC = () => {
  const { user } = useSupabaseAuth()
  const [readings, setReadings] = useState<BibleReading[]>([])
  const [readingPlans, setReadingPlans] = useState<ReadingPlan[]>([])
  const [activeTab, setActiveTab] = useState<'tracker' | 'plans' | 'memorization' | 'notes'>('tracker')
  const [showNewReading, setShowNewReading] = useState(false)
  const [showNewPlan, setShowNewPlan] = useState(false)
  const [newReading, setNewReading] = useState({
    book: '',
    chapter: 1,
    verseStart: 1,
    verseEnd: 1,
    timeSpent: 15,
    notes: '',
    reflection: '',
    tags: ''
  })

  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    books: '',
    dailyGoal: 1
  })

  // Load data from localStorage
  useEffect(() => {
    const savedReadings = localStorage.getItem('bibleReadings')
    const savedPlans = localStorage.getItem('bibleReadingPlans')
    
    if (savedReadings) {
      setReadings(JSON.parse(savedReadings))
    }
    if (savedPlans) {
      setReadingPlans(JSON.parse(savedPlans))
    }
  }, [])

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('bibleReadings', JSON.stringify(readings))
  }, [readings])

  useEffect(() => {
    localStorage.setItem('bibleReadingPlans', JSON.stringify(readingPlans))
  }, [readingPlans])

  const handleAddReading = () => {
    if (!newReading.book || !newReading.chapter) return

    const reading: BibleReading = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      book: newReading.book,
      chapter: newReading.chapter,
      verseStart: newReading.verseStart,
      verseEnd: newReading.verseEnd,
      timeSpent: newReading.timeSpent,
      notes: newReading.notes,
      memorized: false,
      reflection: newReading.reflection,
      tags: newReading.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    }

    setReadings([reading, ...readings])
    setNewReading({
      book: '',
      chapter: 1,
      verseStart: 1,
      verseEnd: 1,
      timeSpent: 15,
      notes: '',
      reflection: '',
      tags: ''
    })
    setShowNewReading(false)
  }

  const handleAddPlan = () => {
    if (!newPlan.name || !newPlan.books) return

    const books = newPlan.books.split(',').map(book => book.trim())
    const plan: ReadingPlan = {
      id: Date.now().toString(),
      name: newPlan.name,
      description: newPlan.description,
      books,
      totalChapters: books.length * 50, // Estimate
      completedChapters: 0,
      startDate: new Date().toISOString().split('T')[0],
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days
      dailyGoal: newPlan.dailyGoal
    }

    setReadingPlans([plan, ...readingPlans])
    setNewPlan({
      name: '',
      description: '',
      books: '',
      dailyGoal: 1
    })
    setShowNewPlan(false)
  }

  const toggleMemorized = (readingId: string) => {
    setReadings(readings.map(reading => 
      reading.id === readingId 
        ? { ...reading, memorized: !reading.memorized }
        : reading
    ))
  }

  const calculateStats = () => {
    const totalTime = readings.reduce((sum, reading) => sum + reading.timeSpent, 0)
    const totalVerses = readings.reduce((sum, reading) => sum + (reading.verseEnd - reading.verseStart + 1), 0)
    const memorizedCount = readings.filter(reading => reading.memorized).length
    const uniqueBooks = new Set(readings.map(reading => reading.book)).size

    return { totalTime, totalVerses, memorizedCount, uniqueBooks }
  }

  const stats = calculateStats()

  const tabs = [
    { id: 'tracker', label: 'Reading Tracker', icon: '📖' },
    { id: 'plans', label: 'Reading Plans', icon: '📋' },
    { id: 'memorization', label: 'Verse Memory', icon: '🧠' },
    { id: 'notes', label: 'Study Notes', icon: '✍️' }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tracker':
        return (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-4 border border-neutral-800">
                <div className="text-2xl font-bold text-green-400">{stats.totalTime}</div>
                <div className="text-sm text-gray-400">Minutes Read</div>
              </div>
              <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-4 border border-neutral-800">
                <div className="text-2xl font-bold text-blue-400">{stats.totalVerses}</div>
                <div className="text-sm text-gray-400">Verses Read</div>
              </div>
              <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-4 border border-neutral-800">
                <div className="text-2xl font-bold text-purple-400">{stats.memorizedCount}</div>
                <div className="text-sm text-gray-400">Verses Memorized</div>
              </div>
              <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-4 border border-neutral-800">
                <div className="text-2xl font-bold text-yellow-400">{stats.uniqueBooks}</div>
                <div className="text-sm text-gray-400">Books Studied</div>
              </div>
            </div>

            {/* Add New Reading */}
            <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-100">Add Bible Reading</h3>
                <button
                  onClick={() => setShowNewReading(!showNewReading)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  {showNewReading ? 'Cancel' : '+ Add Reading'}
                </button>
              </div>

              {showNewReading && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Book</label>
                      <input
                        type="text"
                        value={newReading.book}
                        onChange={(e) => setNewReading({...newReading, book: e.target.value})}
                        className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="e.g., John, Psalms"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Chapter</label>
                      <input
                        type="number"
                        value={newReading.chapter}
                        onChange={(e) => setNewReading({...newReading, chapter: parseInt(e.target.value)})}
                        className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                        min="1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Verse Start</label>
                      <input
                        type="number"
                        value={newReading.verseStart}
                        onChange={(e) => setNewReading({...newReading, verseStart: parseInt(e.target.value)})}
                        className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Verse End</label>
                      <input
                        type="number"
                        value={newReading.verseEnd}
                        onChange={(e) => setNewReading({...newReading, verseEnd: parseInt(e.target.value)})}
                        className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Time (minutes)</label>
                      <input
                        type="number"
                        value={newReading.timeSpent}
                        onChange={(e) => setNewReading({...newReading, timeSpent: parseInt(e.target.value)})}
                        className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                        min="1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                    <textarea
                      value={newReading.notes}
                      onChange={(e) => setNewReading({...newReading, notes: e.target.value})}
                      className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                      rows={3}
                      placeholder="What did you learn from this passage?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Reflection</label>
                    <textarea
                      value={newReading.reflection}
                      onChange={(e) => setNewReading({...newReading, reflection: e.target.value})}
                      className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                      rows={3}
                      placeholder="How does this apply to your life?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                    <input
                      type="text"
                      value={newReading.tags}
                      onChange={(e) => setNewReading({...newReading, tags: e.target.value})}
                      className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., love, faith, prayer (comma separated)"
                    />
                  </div>
                  <button
                    onClick={handleAddReading}
                    className="w-full py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium"
                  >
                    Save Reading
                  </button>
                </div>
              )}
            </div>

            {/* Recent Readings */}
            <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-800">
              <h3 className="text-xl font-bold text-gray-100 mb-4">Recent Readings</h3>
              <div className="space-y-3">
                {readings.slice(0, 5).map((reading) => (
                  <div key={reading.id} className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-gray-100">
                          {reading.book} {reading.chapter}:{reading.verseStart}-{reading.verseEnd}
                        </h4>
                        <p className="text-sm text-gray-400">{reading.date} • {reading.timeSpent} minutes</p>
                      </div>
                      <button
                        onClick={() => toggleMemorized(reading.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          reading.memorized
                            ? 'bg-green-500 text-white'
                            : 'bg-neutral-700 text-gray-300 hover:bg-neutral-600'
                        }`}
                      >
                        {reading.memorized ? '✓ Memorized' : 'Mark Memorized'}
                      </button>
                    </div>
                    {reading.notes && (
                      <p className="text-sm text-gray-300 mb-2">{reading.notes}</p>
                    )}
                    {reading.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {reading.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {readings.length === 0 && (
                  <p className="text-gray-400 text-center py-8">No readings recorded yet. Start your Bible study journey!</p>
                )}
              </div>
            </div>
          </div>
        )

      case 'plans':
        return (
          <div className="space-y-6">
            {/* Add New Plan */}
            <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-100">Create Reading Plan</h3>
                <button
                  onClick={() => setShowNewPlan(!showNewPlan)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {showNewPlan ? 'Cancel' : '+ New Plan'}
                </button>
              </div>

              {showNewPlan && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Plan Name</label>
                      <input
                        type="text"
                        value={newPlan.name}
                        onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                        className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="e.g., New Testament in 90 Days"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Daily Goal (chapters)</label>
                      <input
                        type="number"
                        value={newPlan.dailyGoal}
                        onChange={(e) => setNewPlan({...newPlan, dailyGoal: parseInt(e.target.value)})}
                        className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                        min="1"
                        max="10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Books (comma separated)</label>
                    <input
                      type="text"
                      value={newPlan.books}
                      onChange={(e) => setNewPlan({...newPlan, books: e.target.value})}
                      className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., Matthew, Mark, Luke, John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <textarea
                      value={newPlan.description}
                      onChange={(e) => setNewPlan({...newPlan, description: e.target.value})}
                      className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                      rows={3}
                      placeholder="Describe your reading plan goals..."
                    />
                  </div>
                  <button
                    onClick={handleAddPlan}
                    className="w-full py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
                  >
                    Create Plan
                  </button>
                </div>
              )}
            </div>

            {/* Reading Plans */}
            <div className="space-y-4">
              {readingPlans.map((plan) => (
                <div key={plan.id} className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-800">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-100">{plan.name}</h3>
                      <p className="text-gray-400">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-400">
                        {Math.round((plan.completedChapters / plan.totalChapters) * 100)}%
                      </div>
                      <div className="text-sm text-gray-400">Complete</div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="w-full bg-neutral-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(plan.completedChapters / plan.totalChapters) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Books</div>
                      <div className="text-gray-100 font-medium">{plan.books.length}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Chapters</div>
                      <div className="text-gray-100 font-medium">{plan.completedChapters}/{plan.totalChapters}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Daily Goal</div>
                      <div className="text-gray-100 font-medium">{plan.dailyGoal} chapters</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Progress</div>
                      <div className="text-gray-100 font-medium">{plan.completedChapters} completed</div>
                    </div>
                  </div>
                </div>
              ))}
              {readingPlans.length === 0 && (
                <p className="text-gray-400 text-center py-8">No reading plans created yet. Create your first plan!</p>
              )}
            </div>
          </div>
        )

      case 'memorization':
        return (
          <div className="space-y-6">
            <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-800">
              <h3 className="text-xl font-bold text-gray-100 mb-4">Verse Memorization</h3>
              <div className="space-y-4">
                {readings.filter(reading => reading.memorized).map((reading) => (
                  <div key={reading.id} className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                    <h4 className="font-medium text-gray-100 mb-2">
                      {reading.book} {reading.chapter}:{reading.verseStart}-{reading.verseEnd}
                    </h4>
                    {reading.notes && (
                      <p className="text-sm text-gray-300 mb-2">{reading.notes}</p>
                    )}
                    <div className="text-xs text-gray-400">{reading.date}</div>
                  </div>
                ))}
                {readings.filter(reading => reading.memorized).length === 0 && (
                  <p className="text-gray-400 text-center py-8">No verses marked as memorized yet. Start memorizing!</p>
                )}
              </div>
            </div>
          </div>
        )

      case 'notes':
        return (
          <div className="space-y-6">
            <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-800">
              <h3 className="text-xl font-bold text-gray-100 mb-4">Study Notes & Reflections</h3>
              <div className="space-y-4">
                {readings.filter(reading => reading.notes || reading.reflection).map((reading) => (
                  <div key={reading.id} className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                    <h4 className="font-medium text-gray-100 mb-2">
                      {reading.book} {reading.chapter}:{reading.verseStart}-{reading.verseEnd}
                    </h4>
                    {reading.notes && (
                      <div className="mb-3">
                        <div className="text-sm font-medium text-gray-300 mb-1">Notes:</div>
                        <p className="text-sm text-gray-200">{reading.notes}</p>
                      </div>
                    )}
                    {reading.reflection && (
                      <div>
                        <div className="text-sm font-medium text-gray-300 mb-1">Reflection:</div>
                        <p className="text-sm text-gray-200">{reading.reflection}</p>
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-2">{reading.date}</div>
                  </div>
                ))}
                {readings.filter(reading => reading.notes || reading.reflection).length === 0 && (
                  <p className="text-gray-400 text-center py-8">No study notes or reflections yet. Start taking notes!</p>
                )}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center shadow-2xl">
            <span className="text-white text-4xl">📖</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-100 mb-4">
            Bible Tracker
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Track your Bible reading progress, memorize verses, and deepen your understanding
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-2 border border-neutral-800 mb-8">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-neutral-800'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  )
}
