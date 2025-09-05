# CSS Variables and Styling Backup

## Complete CSS Custom Properties for ChristianKit

### Root Variables (Critical for Recreation):
```css
:root {
  /* Background Colors */
  --bg-primary: #000000;
  --bg-secondary: #111111;
  --bg-tertiary: #1a1a1a;
  
  /* Text Colors */
  --text-primary: #ffffff;
  --text-secondary: #a1a1aa;
  --text-muted: #737373;
  
  /* Accent Colors */
  --accent-primary: #f59e0b;
  --accent-secondary: #d97706;
  --accent-tertiary: #b45309;
  
  /* Primary Colors */
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  
  /* Success Colors */
  --color-success-500: #10b981;
  --color-success-600: #059669;
  --color-success-700: #047857;
  
  /* Warning Colors */
  --color-warning-500: #f59e0b;
  --color-warning-600: #d97706;
  --color-warning-700: #b45309;
  
  /* Info Colors */
  --color-info-500: #06b6d4;
  --color-info-600: #0891b2;
  --color-info-700: #0e7490;
  
  /* Error Colors */
  --color-error-500: #ef4444;
  --color-error-600: #dc2626;
  --color-error-700: #b91c1c;
  
  /* Neutral Colors */
  --color-neutral-50: #fafafa;
  --color-neutral-100: #f5f5f5;
  --color-neutral-200: #e5e5e5;
  --color-neutral-300: #d4d4d4;
  --color-neutral-400: #a3a3a3;
  --color-neutral-500: #737373;
  --color-neutral-600: #525252;
  --color-neutral-700: #404040;
  --color-neutral-800: #262626;
  --color-neutral-900: #171717;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  
  /* Border Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
  --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  
  /* Backdrop Blur */
  --blur-sm: 4px;
  --blur-md: 8px;
  --blur-lg: 16px;
  --blur-xl: 24px;
  --blur-2xl: 40px;
  --blur-3xl: 64px;
}
```

### Key Tailwind Classes Used:

#### Background Gradients:
```css
/* Main Background */
bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)]

/* Accent Overlays */
bg-gradient-to-r from-[var(--accent-primary)]/3 via-transparent to-[var(--accent-primary)]/3

/* Text Gradients */
bg-gradient-to-r from-[var(--color-warning-500)] via-[var(--color-warning-600)] to-[var(--color-warning-500)] bg-clip-text text-transparent
```

#### Glassmorphism Effects:
```css
/* Cards */
bg-[var(--color-neutral-800)]/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-[var(--color-neutral-700)]/10

/* Hover States */
hover:border-[var(--color-neutral-700)]/20 transition-all duration-300

/* Active States */
bg-amber-400/20 text-amber-400
```

#### Navigation Styling:
```css
/* Desktop Top Bar */
hidden lg:block fixed top-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-xl border-b border-amber-400/20

/* Mobile Bottom Bar */
lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-t border-amber-400/20

/* Navigation Items */
flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300
```

#### Animation Classes:
```css
/* Hover Effects */
group-hover:scale-105 transition-transform duration-300
group-hover:scale-110 transition-transform duration-300

/* Pulse Animations */
animate-pulse (with custom durations)
animate-bounce (with custom durations)

/* Transitions */
transition-all duration-300
transition-all duration-500
transition-all duration-700
```

#### Responsive Design:
```css
/* Mobile First */
text-sm md:text-lg
p-2 md:p-6
h-16 sm:h-20 md:h-28 lg:h-32

/* Grid Layouts */
grid-cols-3 sm:grid-cols-2 lg:grid-cols-3
grid-cols-2 lg:grid-cols-4

/* Spacing */
gap-1 md:gap-3 xl:gap-4
px-4 sm:px-6 lg:px-8 xl:px-12
```

### Critical Image URLs:
```css
/* Prayer Card Images */
background-image: url('https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=400&h=200&fit=crop&crop=center');
background-image: url('https://images.unsplash.com/photo-1507692049790-de58290a4334?w=400&h=200&fit=crop&crop=center');
background-image: url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=200&fit=crop&crop=center');

/* Bible Card Images */
background-image: url('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=200&fit=crop&crop=center');
background-image: url('https://images.unsplash.com/photo-1519491050282-cf00c82424b4?w=400&h=200&fit=crop&crop=center');
background-image: url('https://images.unsplash.com/photo-1571043733612-d5444db4e10b?w=400&h=200&fit=crop&crop=faces');
background-image: url('https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=400&h=200&fit=crop&crop=center');

/* Reflection Card Images */
background-image: url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop&crop=center');
background-image: url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=200&fit=crop&crop=center');
background-image: url('https://images.unsplash.com/photo-1545389336-cf090694435e?w=400&h=200&fit=crop&crop=faces');
background-image: url('https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=400&h=200&fit=crop&crop=center');
```

### Animation Keyframes:
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
  50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); }
}

/* Custom Animation Durations */
.animate-pulse { animation-duration: 4s; }
.animate-bounce { animation-duration: 3s; }
```

### Z-Index Layers:
```css
/* Navigation */
z-40 (desktop top bar)
z-50 (mobile bottom bar, dropdowns)

/* Content */
z-10 (main content)
z-20 (modals, overlays)

/* Background */
z-0 (background elements)
```

### Last Updated:
December 2024 - Complete styling system for ChristianKit recreation
