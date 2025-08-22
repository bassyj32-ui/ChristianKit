// Christian Kit Color System
// Implements semantic color tokens with WCAG AA compliance

export interface ColorToken {
  value: string;
  contrast: string; // Contrast color for text/icons
  wcag: {
    aa: boolean;
    aaa: boolean;
  };
}

export interface ColorScale {
  50: ColorToken;
  100: ColorToken;
  200: ColorToken;
  300: ColorToken;
  400: ColorToken;
  500: ColorToken;
  600: ColorToken;
  700: ColorToken;
  800: ColorToken;
  900: ColorToken;
}

export interface ColorPalette {
  primary: ColorScale;
  secondary: ColorScale;
  neutral: ColorScale;
  success: ColorScale;
  warning: ColorScale;
  error: ColorScale;
  info: ColorScale;
}

// Base color values (hex codes)
const colors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
} as const;

// Calculate contrast ratios and determine text colors
function calculateContrast(backgroundColor: string): ColorToken {
  // Improved contrast calculation for better WCAG compliance
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate relative luminance using sRGB formula
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;
  
  const rL = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gL = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bL = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
  
  const luminance = 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
  
  // Determine contrast color (black or white)
  const contrast = luminance > 0.179 ? '#000000' : '#ffffff';
  
  // Calculate contrast ratio
  const contrastLuminance = contrast === '#000000' ? 0 : 1;
  const ratio = (Math.max(luminance, contrastLuminance) + 0.05) / (Math.min(luminance, contrastLuminance) + 0.05);
  
  return {
    value: backgroundColor,
    contrast,
    wcag: {
      aa: ratio >= 4.5, // WCAG AA standard
      aaa: ratio >= 7,  // WCAG AAA standard
    }
  };
}

// Create color scales with contrast information
function createColorScale(baseColors: Record<string, string>): ColorScale {
  const result: Partial<ColorScale> = {};
  
  Object.entries(baseColors).forEach(([key, color]) => {
    if (key === '50' || key === '100' || key === '200' || key === '300' || 
        key === '400' || key === '500' || key === '600' || key === '700' || 
        key === '800' || key === '900') {
      result[key as keyof ColorScale] = calculateContrast(color as string);
    }
  });
  
  return result as ColorScale;
}

// Generate the complete color palette
export const colorPalette: ColorPalette = {
  primary: createColorScale(colors.primary),
  secondary: createColorScale(colors.secondary),
  neutral: createColorScale(colors.secondary), // Using secondary as neutral
  success: createColorScale(colors.success),
  warning: createColorScale(colors.warning),
  error: createColorScale(colors.error),
  info: createColorScale(colors.info),
};

// Semantic color mappings
export const semanticColors = {
  // Text colors
  text: {
    primary: colorPalette.neutral[900],
    secondary: colorPalette.neutral[600],
    tertiary: colorPalette.neutral[400],
    inverse: colorPalette.neutral[50],
    disabled: colorPalette.neutral[300],
  },
  
  // Background colors
  background: {
    primary: colorPalette.neutral[50],
    secondary: colorPalette.neutral[100],
    tertiary: colorPalette.neutral[200],
    inverse: colorPalette.neutral[900],
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Border colors
  border: {
    primary: colorPalette.neutral[200],
    secondary: colorPalette.neutral[300],
    focus: colorPalette.primary[500],
    error: colorPalette.error[500],
    success: colorPalette.success[500],
    warning: colorPalette.warning[500],
  },
  
  // Interactive colors
  interactive: {
    primary: colorPalette.primary[600],
    primaryHover: colorPalette.primary[700],
    primaryActive: colorPalette.primary[800],
    secondary: colorPalette.neutral[600],
    secondaryHover: colorPalette.neutral[700],
    secondaryActive: colorPalette.neutral[800],
  },
  
  // Status colors
  status: {
    success: colorPalette.success[500],
    warning: colorPalette.warning[500],
    error: colorPalette.error[500],
    info: colorPalette.info[500],
  },
} as const;

// Dark mode color overrides
export const darkModeColors = {
  text: {
    primary: colorPalette.neutral[50],
    secondary: colorPalette.neutral[300],
    tertiary: colorPalette.neutral[400],
    inverse: colorPalette.neutral[900],
    disabled: colorPalette.neutral[600],
  },
  
  background: {
    primary: colorPalette.neutral[900],
    secondary: colorPalette.neutral[800],
    tertiary: colorPalette.neutral[700],
    inverse: colorPalette.neutral[50],
    overlay: 'rgba(255, 255, 255, 0.1)',
  },
  
  border: {
    primary: colorPalette.neutral[700],
    secondary: colorPalette.neutral[600],
    focus: colorPalette.primary[400],
    error: colorPalette.error[400],
    success: colorPalette.success[400],
    warning: colorPalette.warning[400],
  },
  
  interactive: {
    primary: colorPalette.primary[400],
    primaryHover: colorPalette.primary[500],
    primaryActive: colorPalette.primary[600],
    secondary: colorPalette.neutral[400],
    secondaryHover: colorPalette.neutral[500],
    secondaryActive: colorPalette.neutral[600],
  },
} as const;

// Export color utilities
export const colorUtils = {
  // Get color by name and scale
  getColor: (name: keyof ColorPalette, scale: keyof ColorScale) => 
    colorPalette[name][scale],
  
  // Get semantic color
  getSemantic: (category: keyof typeof semanticColors, variant: string) =>
    semanticColors[category][variant as keyof typeof semanticColors[typeof category]],
  
  // Get dark mode color
  getDarkMode: (category: keyof typeof darkModeColors, variant: string) =>
    darkModeColors[category][variant as keyof typeof darkModeColors[typeof category]],
  
  // Check if color meets WCAG standards
  meetsWCAG: (name: keyof ColorPalette, scale: keyof ColorScale, level: 'aa' | 'aaa' = 'aa') =>
    colorPalette[name][scale].wcag[level],
  
  // Get all colors that meet WCAG standards
  getWCAGCompliant: (level: 'aa' | 'aaa' = 'aa') => {
    const compliant: Record<string, Record<string, ColorToken>> = {};
    
    Object.entries(colorPalette).forEach(([paletteName, palette]) => {
      compliant[paletteName] = {};
      Object.entries(palette).forEach(([scaleName, color]) => {
        if (color.wcag[level]) {
          compliant[paletteName][scaleName] = color as ColorToken;
        }
      });
    });
    
    return compliant;
  },
};

export default colorPalette;
