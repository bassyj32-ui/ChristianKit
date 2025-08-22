import React from 'react'
import { 
  OsmoCard, 
  OsmoButton, 
  OsmoSectionHeader, 
  OsmoGrid, 
  OsmoBadge, 
  OsmoContainer,
  OsmoGradientText 
} from '../theme/osmoComponents'

export const OsmoLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navigation - Osmo Style */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/50 border-b border-white/10">
        <OsmoContainer>
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-lg flex items-center justify-center">
                <span className="text-[var(--text-inverse)] font-bold text-lg">✝</span>
              </div>
              <span className="text-xl font-bold">ChristianKit</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
              <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
            </div>
            
            <div className="flex items-center space-x-4">
              <OsmoButton variant="ghost" size="sm">Sign In</OsmoButton>
              <OsmoButton variant="primary" size="sm">Get Started</OsmoButton>
            </div>
          </div>
        </OsmoContainer>
      </nav>

      {/* Hero Section - Osmo Inspired */}
      <section className="pt-32 pb-20">
        <OsmoContainer>
          <div className="text-center max-w-4xl mx-auto">
            <OsmoBadge variant="spiritual" className="mb-6">
              ⭐ Trusted by 2,847 believers worldwide
            </OsmoBadge>
            
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
              Start building{' '}
              <OsmoGradientText gradient="gold">
                spiritual habits
              </OsmoGradientText>{' '}
              people remember.
            </h1>
            
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              ChristianKit helps believers grow in faith through daily prayer, Bible reading, and community connection. 
              Join thousands building consistent spiritual practices.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <OsmoButton variant="primary" size="lg">
                🚀 Start Your Journey - Free
              </OsmoButton>
              <OsmoButton variant="secondary" size="lg">
                📖 Watch Demo
              </OsmoButton>
            </div>
            
            {/* User Avatars */}
            <div className="flex justify-center items-center space-x-2 mb-4">
              {['S', 'M', 'J', 'A', 'D', 'L'].map((initial, index) => (
                <div 
                  key={index}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 border-2 border-white/20 flex items-center justify-center text-sm font-bold"
                >
                  {initial}
                </div>
              ))}
              <span className="text-gray-400 text-sm ml-4">+2,841 more believers</span>
            </div>
          </div>
        </OsmoContainer>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <OsmoContainer>
          <OsmoSectionHeader
            title="The spiritual toolkit behind faith-building apps"
            subtitle="Built by believers, for believers. Our platform gives you access to the tools, community, and guidance needed for consistent spiritual growth."
          />
          
          <OsmoGrid columns={3} gap="lg">
            {/* Daily Re-Engagement */}
            <OsmoCard hover glow>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">📧</span>
                </div>
                <h3 className="text-xl font-bold mb-4">Daily Re-Engagement</h3>
                <p className="text-gray-400 leading-relaxed">
                  Uplifting messages and encouraging reminders to stay consistent in your spiritual journey.
                </p>
              </div>
            </OsmoCard>
            
            {/* Advanced Analytics */}
            <OsmoCard hover glow>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-bold mb-4">Advanced Analytics</h3>
                <p className="text-gray-400 leading-relaxed">
                  Detailed insights and beautiful visualizations of your spiritual growth and consistency.
                </p>
              </div>
            </OsmoCard>
            
            {/* Monthly Themes */}
            <OsmoCard hover glow>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-xl font-bold mb-4">Monthly Themes</h3>
                <p className="text-gray-400 leading-relaxed">
                  Focus on one spiritual habit each month with guided practices and community support.
                </p>
              </div>
            </OsmoCard>
            
            {/* Prayer Community */}
            <OsmoCard hover glow>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">🙏</span>
                </div>
                <h3 className="text-xl font-bold mb-4">Prayer Community</h3>
                <p className="text-gray-400 leading-relaxed">
                  Share prayer requests and encourage others with the "I Prayed" feature.
                </p>
              </div>
            </OsmoCard>
            
            {/* Bible Tracking */}
            <OsmoCard hover glow>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">📖</span>
                </div>
                <h3 className="text-xl font-bold mb-4">Bible Tracking</h3>
                <p className="text-gray-400 leading-relaxed">
                  Track your daily Bible reading with progress visualization and streak tracking.
                </p>
              </div>
            </OsmoCard>
            
            {/* Spiritual Reset */}
            <OsmoCard hover glow>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">✨</span>
                </div>
                <h3 className="text-xl font-bold mb-4">Spiritual Reset</h3>
                <p className="text-gray-400 leading-relaxed">
                  Grace-filled restart options when life gets busy. No guilt, just encouragement.
                </p>
              </div>
            </OsmoCard>
          </OsmoGrid>
        </OsmoContainer>
      </section>

      {/* Testimonials - Osmo Style */}
      <section className="py-20">
        <OsmoContainer>
          <OsmoSectionHeader
            title="Trusted by believers worldwide"
            subtitle="See how ChristianKit is helping thousands grow in their faith daily."
          />
          
          <OsmoGrid columns={2} gap="lg">
            <OsmoCard>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                    S
                  </div>
                  <div>
                    <div className="font-semibold">Sarah M.</div>
                    <div className="text-gray-400 text-sm">Youth Pastor</div>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  "ChristianKit has transformed my daily spiritual routine. The monthly themes help me focus 
                  on specific areas of growth, and the community support is incredible."
                </p>
              </div>
            </OsmoCard>
            
            <OsmoCard>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                    M
                  </div>
                  <div>
                    <div className="font-semibold">Michael K.</div>
                    <div className="text-gray-400 text-sm">Seminary Student</div>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  "The analytics feature helps me see my spiritual growth patterns. It's encouraging to 
                  see progress over time and know that consistency really does matter."
                </p>
              </div>
            </OsmoCard>
          </OsmoGrid>
        </OsmoContainer>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <OsmoContainer>
          <OsmoCard className="text-center">
            <OsmoSectionHeader
              title="Start building spiritual habits people remember"
              subtitle="Join thousands of believers who are growing their faith daily with ChristianKit."
            />
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <OsmoButton variant="primary" size="lg">
                🚀 Start Free Today
              </OsmoButton>
              <OsmoButton variant="secondary" size="lg">
                💬 Talk to Support
              </OsmoButton>
            </div>
            
            <p className="text-gray-400 text-sm mt-6">
              Free forever plan available • No credit card required • Join 2,847+ believers
            </p>
          </OsmoCard>
        </OsmoContainer>
      </section>

      {/* Footer - Minimal like Osmo */}
      <footer className="py-12 border-t border-white/10">
        <OsmoContainer>
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-to-r from-amber-400 to-yellow-500 rounded flex items-center justify-center">
                <span className="text-[var(--text-inverse)] font-bold text-sm">✝</span>
              </div>
              <span className="font-semibold">ChristianKit</span>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
            
            <div className="text-gray-400 text-sm mt-4 md:mt-0">
              © 2024 ChristianKit. Built with ❤️ for believers.
            </div>
          </div>
        </OsmoContainer>
      </footer>
    </div>
  )
}
