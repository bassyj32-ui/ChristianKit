import React, { useState } from 'react'

interface StoreItem {
  id: number
  name: string
  description: string
  price: number
  category: string
  image: string
  rating: number
  reviews: number
}

const mockItems: StoreItem[] = [
  {
    id: 1,
    name: "Prayer Journal Premium",
    description: "Beautiful leather-bound journal with guided prayer prompts and scripture references",
    price: 29.99,
    category: "Books",
    image: "📖",
    rating: 4.8,
    reviews: 127
  },
  {
    id: 2,
    name: "Meditation Candle Set",
    description: "Handcrafted soy candles with calming scents for prayer and meditation",
    price: 24.99,
    category: "Accessories",
    image: "🕯️",
    rating: 4.6,
    reviews: 89
  },
  {
    id: 3,
    name: "Scripture Memory Cards",
    description: "52 beautifully designed cards with key Bible verses for daily memorization",
    price: 19.99,
    category: "Books",
    image: "🎴",
    rating: 4.9,
    reviews: 203
  },
  {
    id: 4,
    name: "Prayer Beads",
    description: "Traditional prayer beads made from natural materials for contemplative prayer",
    price: 34.99,
    category: "Accessories",
    image: "📿",
    rating: 4.7,
    reviews: 156
  },
  {
    id: 5,
    name: "Bible Study Planner",
    description: "Comprehensive planner with study guides, note sections, and reading plans",
    price: 39.99,
    category: "Books",
    image: "📅",
    rating: 4.8,
    reviews: 94
  },
  {
    id: 6,
    name: "Worship Music Collection",
    description: "Curated collection of contemporary Christian music for daily worship",
    price: 14.99,
    category: "Digital",
    image: "🎵",
    rating: 4.5,
    reviews: 312
  }
]

export const StorePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [cart, setCart] = useState<StoreItem[]>([])

  const categories = ['All', 'Books', 'Accessories', 'Digital']

  const filteredItems = selectedCategory === 'All' 
    ? mockItems 
    : mockItems.filter(item => item.category === selectedCategory)

  const addToCart = (item: StoreItem) => {
    setCart([...cart, item])
  }

  const removeFromCart = (itemId: number) => {
    setCart(cart.filter(item => item.id !== itemId))
  }

  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-400 via-pink-500 to-rose-600 rounded-full flex items-center justify-center shadow-2xl">
            <span className="text-white text-4xl">🛍️</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Christian Store
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover tools and resources to deepen your faith journey
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2 bg-white/80 backdrop-blur-sm rounded-2xl p-2 border border-purple-200">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-purple-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Store Items Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="text-center mb-4">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center text-3xl mb-4">
                  {item.image}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h3>
                <p className="text-gray-600 mb-4">{item.description}</p>
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400">
                        {i < Math.floor(item.rating) ? '⭐' : '☆'}
                      </span>
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">({item.reviews})</span>
                </div>
                <div className="text-2xl font-bold text-purple-600 mb-4">${item.price}</div>
                <button
                  onClick={() => addToCart(item)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Shopping Cart */}
        {cart.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-purple-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart</h2>
            <div className="space-y-4 mb-6">
              {cart.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center text-xl">
                      {item.image}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{item.name}</h3>
                      <p className="text-gray-600">${item.price}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    ❌
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-purple-200 pt-4">
              <span className="text-xl font-bold text-gray-900">Total: ${totalPrice.toFixed(2)}</span>
              <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105">
                Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
