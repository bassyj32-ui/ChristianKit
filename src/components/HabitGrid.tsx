import React, { useState } from 'react'

interface Habit {
  id: number
  name: string
  description: string
  category: string
  frequency: string
  streak: number
  completed: boolean
  icon: string
  color: string
}

const initialHabits: Habit[] = [
    {
      id: 1,
    name: "Morning Prayer",
    description: "Start each day with prayer and gratitude",
    category: "Prayer",
    frequency: "Daily",
    streak: 7,
      completed: true,
    icon: "🙏",
    color: "green"
    },
    {
      id: 2,
    name: "Bible Reading",
    description: "Read and reflect on scripture daily",
    category: "Study",
    frequency: "Daily",
      streak: 5,
    completed: false,
    icon: "📖",
    color: "blue"
    },
    {
      id: 3,
    name: "Gratitude Journal",
    description: "Write down three things you're thankful for",
    category: "Reflection",
    frequency: "Daily",
    streak: 12,
    completed: true,
    icon: "📝",
    color: "purple"
  },
  {
    id: 4,
    name: "Meditation",
    description: "Spend time in quiet reflection and meditation",
    category: "Mindfulness",
    frequency: "Daily",
    streak: 3,
    completed: false,
    icon: "🧘",
    color: "indigo"
  },
  {
    id: 5,
    name: "Acts of Kindness",
    description: "Perform one act of kindness each day",
    category: "Service",
    frequency: "Daily",
    streak: 8,
    completed: true,
    icon: "❤️",
    color: "red"
  },
  {
    id: 6,
    name: "Worship Music",
    description: "Listen to worship music and sing praises",
    category: "Worship",
    frequency: "Daily",
    streak: 15,
      completed: false,
    icon: "🎵",
    color: "yellow"
  }
]

export const HabitGrid: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>(initialHabits)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const toggleHabit = (id: number) => {
    setHabits(habits.map(habit => 
      habit.id === id 
        ? { 
            ...habit, 
            completed: !habit.completed,
            streak: !habit.completed ? habit.streak + 1 : Math.max(0, habit.streak - 1)
          }
        : habit
    ))
  }

  const addHabit = (newHabit: Omit<Habit, 'id' | 'streak' | 'completed'>) => {
    const habit: Habit = {
      ...newHabit,
      id: Date.now(),
      streak: 0,
      completed: false
    }
    setHabits([...habits, habit])
    setShowAddForm(false)
  }

  const updateHabit = (updatedHabit: Habit) => {
    setHabits(habits.map(habit => 
      habit.id === updatedHabit.id ? updatedHabit : habit
    ))
    setEditingHabit(null)
  }

  const deleteHabit = (id: number) => {
    setHabits(habits.filter(habit => habit.id !== id))
  }

  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: string } = {
      green: 'from-green-400 to-emerald-500',
      blue: 'from-blue-400 to-cyan-500',
      purple: 'from-purple-400 to-violet-500',
      indigo: 'from-indigo-400 to-blue-500',
      red: 'from-red-400 to-pink-500',
      yellow: 'from-yellow-400 to-orange-500'
    }
    return colorMap[color] || 'from-gray-400 to-gray-500'
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-4">Spiritual Habits</h2>
        <p className="text-gray-400 mb-6">Build daily practices</p>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 sm:px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          ➕ Add Habit
        </button>
            </div>

      {/* Habits Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {habits.map((habit) => (
          <div 
            key={habit.id}
            className={`bg-neutral-900/90 backdrop-blur-sm rounded-3xl p-4 sm:p-6 shadow-xl border transition-all duration-300 transform hover:scale-105 ${
              habit.completed 
                ? 'border-green-500/30 shadow-green-500/20' 
                : 'border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r ${getColorClasses(habit.color)} rounded-2xl flex items-center justify-center text-xl sm:text-2xl text-white shadow-lg`}>
                {habit.icon}
              </div>
              <div className="flex space-x-2">
              <button
                  onClick={() => setEditingHabit(habit)}
                  className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
              >
                ✏️
              </button>
              <button
                  onClick={() => deleteHabit(habit.id)}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
              >
                🗑️
              </button>
            </div>
                  </div>

            <h3 className="text-lg sm:text-xl font-bold text-gray-100 mb-2">{habit.name}</h3>
            <p className="text-gray-400 mb-4 text-sm">{habit.description}</p>

            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-neutral-800 text-gray-300 rounded-full text-xs sm:text-sm font-medium">
                {habit.category}
              </span>
              <span className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full text-xs sm:text-sm font-medium">
                {habit.frequency}
              </span>
                  </div>

            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-400">{habit.streak}</div>
                <div className="text-xs text-gray-500">Day Streak</div>
                  </div>
              <button
                onClick={() => toggleHabit(habit.id)}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                      habit.completed 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                    : 'bg-neutral-800 text-gray-300 border border-neutral-700 hover:bg-neutral-700'
                }`}
              >
                {habit.completed ? '✓ Completed' : 'Mark Complete'}
              </button>
            </div>
          </div>
        ))}
                </div>

      {/* Add Habit Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Add New Habit</h3>
            <AddHabitForm onSave={addHabit} onCancel={() => setShowAddForm(false)} />
              </div>
            </div>
          )}

      {/* Edit Habit Form */}
      {editingHabit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Edit Habit</h3>
            <EditHabitForm habit={editingHabit} onSave={updateHabit} onCancel={() => setEditingHabit(null)} />
          </div>
        </div>
      )}
    </div>
  )
}

interface AddHabitFormProps {
  onSave: (habit: Omit<Habit, 'id' | 'streak' | 'completed'>) => void
  onCancel: () => void
}

const AddHabitForm: React.FC<AddHabitFormProps> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Prayer',
    frequency: 'Daily',
    icon: '🙏',
    color: 'green'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.description) {
      onSave(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Habit Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="e.g., Morning Prayer"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          rows={3}
          placeholder="Describe your habit..."
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="Prayer">Prayer</option>
            <option value="Study">Study</option>
            <option value="Reflection">Reflection</option>
            <option value="Mindfulness">Mindfulness</option>
            <option value="Service">Service</option>
            <option value="Worship">Worship</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
          <select
            value={formData.frequency}
            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
        >
          Cancel
        </button>
              <button
          type="submit"
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700"
        >
          Add Habit
              </button>
            </div>
    </form>
  )
}

interface EditHabitFormProps {
  habit: Habit
  onSave: (habit: Habit) => void
  onCancel: () => void
}

const EditHabitForm: React.FC<EditHabitFormProps> = ({ habit, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: habit.name,
    description: habit.description,
    category: habit.category,
    frequency: habit.frequency,
    icon: habit.icon,
    color: habit.color
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.description) {
      onSave({ ...habit, ...formData })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Habit Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="Prayer">Prayer</option>
            <option value="Study">Study</option>
            <option value="Reflection">Reflection</option>
            <option value="Mindfulness">Mindfulness</option>
            <option value="Service">Service</option>
            <option value="Worship">Worship</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
          <select
            value={formData.frequency}
            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700"
        >
          Save Changes
        </button>
      </div>
    </form>
  )
}
