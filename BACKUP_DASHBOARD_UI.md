# Dashboard UI Backup - Complete Recreation Guide

## Current Dashboard Design (December 2024)

### Key Features:
- **Osmo-inspired design** with dark theme and subtle gradients
- **Clean hero section** with "Grow Closer to God Every Day with ChristianKit" heading
- **Three main action cards**: Prayer, Bible Study, and Reflection
- **Animated image slideshows** for each card with hover effects
- **Weekly Progress section** with embedded progress tracking
- **Pro Features showcase** with pricing ($2.50/month) and feature grid
- **Community engagement** with user avatars and social proof
- **Mobile-responsive** with proper spacing and scaling
- **No duplicate navigation** - bottom nav hidden on desktop (lg:hidden)

### Design Elements:
- **Background**: Dark gradient with subtle glow effects and floating particles
- **Cards**: Glassmorphism with backdrop-blur and subtle borders
- **Colors**: Amber/yellow accents, neutral grays, and CSS custom properties
- **Animations**: Pulse effects, hover scaling, and smooth transitions
- **Typography**: Large headings with gradient text effects

### Navigation Structure:
- **Desktop**: Top app bar only (no bottom navigation)
- **Mobile**: Bottom navigation bar with Home, Prayer, Community, Game, More
- **Clean separation**: No duplicate navigation elements

### Critical CSS Classes for Recreation:
```css
/* Main Container */
min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative overflow-hidden font-sans

/* Background Layers */
bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)]
bg-gradient-to-r from-[var(--accent-primary)]/3 via-transparent to-[var(--accent-primary)]/3

/* Cards */
bg-[var(--color-neutral-800)]/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-[var(--color-neutral-700)]/10 hover:border-[var(--color-neutral-700)]/20 transition-all duration-300 group cursor-pointer

/* Text Gradients */
bg-gradient-to-r from-[var(--color-warning-500)] via-[var(--color-warning-600)] to-[var(--color-warning-500)] bg-clip-text text-transparent

/* Floating Particles */
absolute inset-0 pointer-events-none with animate-bounce effects

/* Mobile Navigation Hidden on Desktop */
lg:hidden fixed bottom-0 left-0 right-0 z-50
```

### Key Image URLs for Cards:
- **Prayer Card**: 
  - Golden light: `https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=400&h=200&fit=crop&crop=center`
  - Prayer hands: `https://images.unsplash.com/photo-1507692049790-de58290a4334?w=400&h=200&fit=crop&crop=center`
  - Heavenly clouds: `https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=200&fit=crop&crop=center`

- **Bible Card**:
  - Ancient scrolls: `https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=200&fit=crop&crop=center`
  - Golden Bible: `https://images.unsplash.com/photo-1519491050282-cf00c82424b4?w=400&h=200&fit=crop&crop=center`
  - Sacred texts: `https://images.unsplash.com/photo-1571043733612-d5444db4e10b?w=400&h=200&fit=crop&crop=faces`
  - Divine wisdom: `https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=400&h=200&fit=crop&crop=center`

- **Reflection Card**:
  - Heavenly light: `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop&crop=center`
  - Divine peace: `https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=200&fit=crop&crop=center`
  - Angelic space: `https://images.unsplash.com/photo-1545389336-cf090694435e?w=400&h=200&fit=crop&crop=faces`
  - Sacred garden: `https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=400&h=200&fit=crop&crop=center`

### Animation Timing:
- **Image Slideshow**: 4s, 6s, 8s, 10s, 11s, 12s with various delays
- **Pulse Effects**: 2s, 3s, 4s, 5s with different delays
- **Hover Effects**: scale-105, scale-110 transforms
- **Transitions**: duration-300, duration-500, duration-700

### File Location:
`src/components/Dashboard.tsx`

### Dependencies Required:
- React with hooks (useState, useEffect)
- Tailwind CSS with custom CSS variables
- Unsplash images for card backgrounds
- WeeklyProgress component
- CommunitySection component
- WeeklyProgressBot component
- ProgressService for session tracking

### Last Updated:
December 2024 - After removing duplicate navigation and implementing Osmo design
