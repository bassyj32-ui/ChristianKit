import React, { createContext, useContext, useEffect, useState } from 'react';
import { colorPalette, semanticColors, darkModeColors, colorUtils } from './colors';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  colors: typeof colorPalette;
  semanticColors: typeof semanticColors;
  darkModeColors: typeof darkModeColors;
  colorUtils: typeof colorUtils;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultMode = 'dark' // Default to dark mode (Osmo theme)
}) => {
  // Load theme mode from localStorage on mount
  const [mode, setMode] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem('themeMode') as ThemeMode;
    return savedMode || defaultMode;
  });
  const [isDark, setIsDark] = useState(false);

  // Determine if dark mode should be active
  const getIsDark = (): boolean => {
    if (mode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return mode === 'dark';
  };

  // Update theme based on mode
  useEffect(() => {
    const dark = getIsDark();
    setIsDark(dark);
    
    // Update data-theme attribute
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    
    // Update CSS custom properties
    updateCSSVariables(dark);
  }, [mode]);

  // Listen for system theme changes
  useEffect(() => {
    if (mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const dark = mediaQuery.matches;
        setIsDark(dark);
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        updateCSSVariables(dark);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [mode]);

  // Update CSS custom properties with Osmo theme colors
  const updateCSSVariables = (dark: boolean) => {
    const root = document.documentElement;
    
    // Toggle Tailwind dark mode class
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Update color scale variables
    Object.entries(colorPalette).forEach(([paletteName, scale]) => {
      Object.entries(scale).forEach(([key, color]) => {
        root.style.setProperty(`--color-${paletteName}-${key}`, color.value);
      });
    });

    // Update semantic color variables
    if (dark) {
      // Dark mode colors (Osmo theme)
      Object.entries(darkModeColors).forEach(([category, variants]) => {
        Object.entries(variants).forEach(([variant, color]: [string, any]) => {
          if (typeof color === 'object' && color !== null && 'value' in color) {
            root.style.setProperty(`--color-${category}-${variant}`, (color as { value: string }).value);
          } else {
            root.style.setProperty(`--color-${category}-${variant}`, color as string);
          }
        });
      });
    } else {
      // Light mode colors
      Object.entries(semanticColors).forEach(([category, variants]) => {
        Object.entries(variants).forEach(([variant, color]: [string, any]) => {
          if (typeof color === 'object' && color !== null && 'value' in color) {
            root.style.setProperty(`--color-${category}-${variant}`, (color as { value: string }).value);
          } else {
            root.style.setProperty(`--color-${category}-${variant}`, color as string);
          }
        });
      });
    }
  };

  // Save theme mode to localStorage and update theme
  const handleSetMode = (newMode: ThemeMode) => {
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  // Toggle between light and dark mode
  const toggleMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    handleSetMode(newMode);
  };

  const value: ThemeContextType = {
    mode,
    isDark,
    setMode: handleSetMode,
    toggleMode,
    colors: colorPalette,
    semanticColors,
    darkModeColors,
    colorUtils,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook for color access
export const useColors = () => {
  const { colors, semanticColors, darkModeColors, colorUtils } = useTheme();
  return { colors, semanticColors, darkModeColors, colorUtils };
};

// Hook for theme mode management
export const useThemeMode = () => {
  const { mode, isDark, setMode, toggleMode } = useTheme();
  return { mode, isDark, setMode, toggleMode };
};



