// Osmo-inspired theme configuration for ChristianKit
export const osmoTheme = {
  colors: {
    // Background colors (Osmo-inspired dark theme)
    background: {
      primary: '#0a0a0a',        // Deep black like Osmo
      secondary: '#111111',      // Slightly lighter black
      tertiary: '#1a1a1a',       // Card backgrounds
      accent: '#ffffff0a',       // Subtle white overlay
    },
    
    // Text colors
    text: {
      primary: '#ffffff',        // Pure white
      secondary: '#a1a1aa',      // Muted gray
      tertiary: '#71717a',       // Darker gray
      inverse: '#000000',        // Black text on light backgrounds
    },
    
    // Spiritual/Christian accent colors
    accent: {
      primary: '#fbbf24',        // Warm gold (like Osmo's yellow)
      secondary: '#f59e0b',      // Deeper gold
      tertiary: '#d97706',       // Dark gold
      light: '#fef3c7',          // Very light gold
    },
    
    // Spiritual theme colors
    spiritual: {
      blue: '#3b82f6',           // Trust, faith
      purple: '#8b5cf6',         // Royalty, worship
      green: '#10b981',          // Growth, life
      rose: '#f43f5e',           // Love, sacrifice
      indigo: '#6366f1',         // Wisdom, depth
    },
    
    // Semantic colors
    semantic: {
      success: '#10b981',        // Green
      warning: '#f59e0b',        // Amber
      error: '#ef4444',          // Red
      info: '#3b82f6',           // Blue
    },
    
    // Border and divider colors
    border: {
      primary: '#27272a',        // Dark gray
      secondary: '#3f3f46',      // Medium gray
      accent: '#fbbf24',         // Gold accent borders
      subtle: '#ffffff0f',       // Very subtle white
    },
    
    // Glass-morphism effects
    glass: {
      light: '#ffffff08',        // Light glass overlay
      medium: '#ffffff10',       // Medium glass overlay
      dark: '#00000020',         // Dark glass overlay
      border: '#ffffff15',       // Glass border
    },
  },

  typography: {
    // Font families (similar to Osmo)
    fonts: {
      sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
      display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    },
    
    // Font sizes
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
      '6xl': '3.75rem',  // 60px
    },
    
    // Font weights
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    
    // Line heights
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
      loose: '2',
    },
  },

  spacing: {
    // Generous spacing like Osmo
    xs: '0.5rem',      // 8px
    sm: '0.75rem',     // 12px
    md: '1rem',        // 16px
    lg: '1.5rem',      // 24px
    xl: '2rem',        // 32px
    '2xl': '2.5rem',   // 40px
    '3xl': '3rem',     // 48px
    '4xl': '4rem',     // 64px
    '5xl': '5rem',     // 80px
    '6xl': '6rem',     // 96px
  },

  borderRadius: {
    // Modern rounded corners
    none: '0',
    sm: '0.375rem',    // 6px
    md: '0.5rem',      // 8px
    lg: '0.75rem',     // 12px
    xl: '1rem',        // 16px
    '2xl': '1.5rem',   // 24px
    '3xl': '2rem',     // 32px
    full: '9999px',
  },

  shadows: {
    // Subtle shadows like Osmo
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    glow: '0 0 20px rgb(251 191 36 / 0.15)', // Gold glow
    spiritual: '0 0 30px rgb(139 92 246 / 0.2)', // Purple spiritual glow
  },

  // Animation and transitions
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Component-specific styles
  components: {
    // Card styling (like Osmo's clean cards)
    card: {
      background: '#ffffff08',
      border: '1px solid #ffffff15',
      borderRadius: '1rem',
      backdropFilter: 'blur(12px)',
      padding: '1.5rem',
    },
    
    // Button styling
    button: {
      primary: {
        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
        color: '#000000',
        borderRadius: '0.75rem',
        fontWeight: '600',
        padding: '0.75rem 1.5rem',
      },
      secondary: {
        background: '#ffffff08',
        color: '#ffffff',
        border: '1px solid #ffffff15',
        borderRadius: '0.75rem',
        fontWeight: '500',
        padding: '0.75rem 1.5rem',
      },
    },
    
    // Input styling
    input: {
      background: '#ffffff05',
      border: '1px solid #ffffff15',
      borderRadius: '0.5rem',
      color: '#ffffff',
      padding: '0.75rem 1rem',
      placeholder: '#a1a1aa',
    },
  },
}

// CSS Custom Properties for easy theming
export const osmoThemeCSSVars = `
:root {
  /* Colors */
  --bg-primary: ${osmoTheme.colors.background.primary};
  --bg-secondary: ${osmoTheme.colors.background.secondary};
  --bg-tertiary: ${osmoTheme.colors.background.tertiary};
  
  --text-primary: ${osmoTheme.colors.text.primary};
  --text-secondary: ${osmoTheme.colors.text.secondary};
  --text-tertiary: ${osmoTheme.colors.text.tertiary};
  
  --accent-primary: ${osmoTheme.colors.accent.primary};
  --accent-secondary: ${osmoTheme.colors.accent.secondary};
  
  --border-primary: ${osmoTheme.colors.border.primary};
  --border-secondary: ${osmoTheme.colors.border.secondary};
  
  --glass-light: ${osmoTheme.colors.glass.light};
  --glass-medium: ${osmoTheme.colors.glass.medium};
  --glass-border: ${osmoTheme.colors.glass.border};
  
  /* Typography */
  --font-sans: ${osmoTheme.typography.fonts.sans.join(', ')};
  --font-mono: ${osmoTheme.typography.fonts.mono.join(', ')};
  
  /* Spacing */
  --spacing-xs: ${osmoTheme.spacing.xs};
  --spacing-sm: ${osmoTheme.spacing.sm};
  --spacing-md: ${osmoTheme.spacing.md};
  --spacing-lg: ${osmoTheme.spacing.lg};
  --spacing-xl: ${osmoTheme.spacing.xl};
  
  /* Border Radius */
  --radius-sm: ${osmoTheme.borderRadius.sm};
  --radius-md: ${osmoTheme.borderRadius.md};
  --radius-lg: ${osmoTheme.borderRadius.lg};
  --radius-xl: ${osmoTheme.borderRadius.xl};
  
  /* Shadows */
  --shadow-sm: ${osmoTheme.shadows.sm};
  --shadow-md: ${osmoTheme.shadows.md};
  --shadow-lg: ${osmoTheme.shadows.lg};
  --shadow-glow: ${osmoTheme.shadows.glow};
}
`
