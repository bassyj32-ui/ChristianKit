# Complete ChristianKit System Backup - Full Recreation Guide

## System Overview (December 2024)

### Architecture:
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS with custom CSS variables
- **State Management**: Zustand
- **Authentication**: Supabase
- **Database**: Supabase PostgreSQL
- **Icons**: SVG-based throughout
- **Images**: Unsplash integration

### Key Components:

#### 1. App Structure (`src/App.tsx`):
- **Main Router**: Handles all page navigation
- **State Management**: Uses Zustand store for global state
- **Authentication**: Supabase integration
- **Layout**: Persistent navigation + main content area
- **Error Boundaries**: Comprehensive error handling

#### 2. Navigation System (`src/components/PersistentNavigation.tsx`):
- **Desktop**: Top app bar with logo, main nav, More dropdown, user info
- **Mobile**: Bottom navigation bar with main tabs + More button
- **Responsive**: Different layouts for desktop/mobile
- **Icons**: All SVG-based with consistent styling

#### 3. Dashboard (`src/components/Dashboard.tsx`):
- **Hero Section**: "Grow Closer to God Every Day with ChristianKit"
- **Action Cards**: Prayer, Bible Study, Reflection with animated images
- **Progress Tracking**: Weekly progress integration
- **Pro Features**: Pricing showcase ($2.50/month)
- **Community**: User avatars and social proof
- **Mobile-First**: Responsive design with proper scaling

#### 4. Prayer Page (`src/components/UnifiedTimerPage.tsx`):
- **Timer Interface**: Large, prominent timer display
- **Time Selection**: 5min, 10min, 30min tabs
- **Bottom Navigation**: Community, Bible Quest, Home (SVG icons)
- **Dark Theme**: Osmo-inspired with subtle gradients
- **Glassmorphism**: Backdrop blur effects

#### 5. Faith Runner Game (`src/components/FaithRunner.tsx`):
- **Game Type**: T-Rex style endless runner
- **Character**: Male soldier
- **Obstacles**: Dark clouds, rocks, spikes
- **Collectibles**: Crosses, Wings, Shield power-ups
- **Features**: Streak system, combo messages, particle effects
- **Mobile-Friendly**: Touch controls and responsive canvas

### CSS Custom Properties (Critical for Recreation):
```css
:root {
  --bg-primary: #000000;
  --bg-secondary: #111111;
  --text-primary: #ffffff;
  --text-secondary: #a1a1aa;
  --accent-primary: #f59e0b;
  --color-primary-500: #3b82f6;
  --color-success-500: #10b981;
  --color-warning-500: #f59e0b;
  --color-warning-600: #d97706;
  --color-info-500: #06b6d4;
  --color-error-500: #ef4444;
  --color-neutral-50: #fafafa;
  --color-neutral-400: #a3a3a3;
  --color-neutral-500: #737373;
  --color-neutral-700: #404040;
  --color-neutral-800: #262626;
}
```

### Critical Dependencies:
```json
{
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "typescript": "^5.0.0",
  "vite": "^5.0.0",
  "tailwindcss": "^3.0.0",
  "zustand": "^4.0.0",
  "@supabase/supabase-js": "^2.0.0",
  "react-router-dom": "^6.0.0"
}
```

### File Structure:
```
src/
├── components/
│   ├── App.tsx (Main router)
│   ├── PersistentNavigation.tsx (Navigation system)
│   ├── Dashboard.tsx (Main dashboard)
│   ├── UnifiedTimerPage.tsx (Prayer/Bible/Meditation)
│   ├── FaithRunner.tsx (Game component)
│   ├── CommunityPage.tsx (Community feed)
│   └── [other components]
├── store/
│   └── appStore.ts (Zustand state management)
├── services/
│   ├── authService.ts (Authentication)
│   ├── cloudSyncService.ts (Data sync)
│   └── [other services]
├── utils/
│   └── supabase.ts (Supabase client)
└── [other directories]
```

### Key Features Implemented:
1. **Persistent Navigation Bar** - Single source of truth
2. **Proper State Management** - Zustand integration
3. **Fixed Authentication Flow** - Supabase integration
4. **Cloud Data Sync** - Bidirectional sync with offline support
5. **Consolidated Components** - Unified timer page
6. **Mobile Responsiveness** - Mobile-first design
7. **Error Boundaries** - Comprehensive error handling
8. **Offline Support** - Queue operations when offline
9. **User Profile Management** - Complete user system
10. **Faith Runner Community Integration** - Game leaderboard

### Design Principles:
- **Osmo Aesthetic**: Clean, modern, playful design
- **Dark Theme**: Black backgrounds with amber accents
- **Glassmorphism**: Backdrop blur effects throughout
- **Consistent Icons**: SVG-based iconography
- **Mobile-First**: Responsive design principles
- **Smooth Animations**: Hover effects and transitions
- **Accessibility**: Proper contrast and touch targets

### Recreation Steps:
1. Set up React + TypeScript + Vite project
2. Install Tailwind CSS and configure custom properties
3. Install Zustand for state management
4. Set up Supabase for authentication and database
5. Create component structure as outlined
6. Implement navigation system with responsive design
7. Build dashboard with animated cards and glassmorphism
8. Create unified timer page with dark theme
9. Implement Faith Runner game with canvas API
10. Add community features and user management
11. Integrate all services and error handling
12. Test responsive design and mobile functionality

### Last Updated:
December 2024 - Complete system with Osmo design and all features implemented
