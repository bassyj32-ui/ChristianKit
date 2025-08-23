// Bible Gateway API Configuration
// You'll need to get credentials from: https://www.biblegateway.com/developers/

export const BIBLE_CONFIG = {
  // API Credentials (you need to get these from Bible Gateway)
  username: process.env.REACT_APP_BIBLE_USERNAME || '',
  password: process.env.REACT_APP_BIBLE_PASSWORD || '',
  
  // Default translation
  defaultTranslation: 'niv',
  
  // Available translations
  translations: {
    NIV: 'niv',
    KJV: 'kjv', 
    ESV: 'esv',
    NKJV: 'nkjv',
    NLT: 'nlt'
  },
  
  // Search settings
  searchLimit: 20,
  
  // Reminder intervals (in seconds)
  reminderInterval: 30,
  
  // Fallback content settings
  enableFallbackContent: true,
  
  // Cache settings
  cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
};

// Instructions for setup:
// 1. Go to https://www.biblegateway.com/developers/
// 2. Sign up for a free developer account
// 3. Get your username and password
// 4. Create a .env file in your project root with:
//    REACT_APP_BIBLE_USERNAME=your_username
//    REACT_APP_BIBLE_PASSWORD=your_password
// 5. Restart your development server

export default BIBLE_CONFIG;
