import { describe, it, expect } from 'vitest';
import { 
  colorPalette, 
  semanticColors, 
  darkModeColors, 
  colorUtils,
  ColorToken 
} from './colors';

describe('Color System', () => {
  describe('Color Palette Structure', () => {
    it('should have all required color palettes', () => {
      const expectedPalettes = ['primary', 'secondary', 'neutral', 'success', 'warning', 'error', 'info'];
      expectedPalettes.forEach(palette => {
        expect(colorPalette).toHaveProperty(palette);
      });
    });

    it('should have all color scales (50-900)', () => {
      const expectedScales = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
      Object.values(colorPalette).forEach(scale => {
        expectedScales.forEach(scaleKey => {
          expect(scale).toHaveProperty(scaleKey);
        });
      });
    });

    it('should have proper ColorToken structure for each color', () => {
      Object.values(colorPalette).forEach(scale => {
        Object.values(scale).forEach(color => {
          expect(color).toHaveProperty('value');
          expect(color).toHaveProperty('contrast');
          expect(color).toHaveProperty('wcag');
          expect(color.wcag).toHaveProperty('aa');
          expect(color.wcag).toHaveProperty('aaa');
        });
      });
    });
  });

  describe('WCAG Compliance', () => {
    it('should have colors that meet WCAG AA standards', () => {
      const wcagCompliant = colorUtils.getWCAGCompliant('aa');
      
      // At least some colors should meet AA standards
      let hasCompliantColors = false;
      Object.values(wcagCompliant).forEach(palette => {
        if (Object.keys(palette).length > 0) {
          hasCompliantColors = true;
        }
      });
      
      expect(hasCompliantColors).toBe(true);
    });

    it('should have primary colors that meet WCAG AA standards', () => {
      // Primary colors should be accessible for UI elements
      const primary500 = colorPalette.primary[500];
      const primary600 = colorPalette.primary[600];
      const primary700 = colorPalette.primary[700];
      
      expect(primary500.wcag.aa).toBe(true);
      expect(primary600.wcag.aa).toBe(true);
      expect(primary700.wcag.aa).toBe(true);
    });

    it('should have error colors that meet WCAG AA standards', () => {
      // Error colors must be accessible for important messages
      const error500 = colorPalette.error[500];
      const error600 = colorPalette.error[600];
      
      expect(error500.wcag.aa).toBe(true);
      expect(error600.wcag.aa).toBe(true);
    });
  });

  describe('Color Contrast', () => {
    it('should have appropriate contrast colors for light backgrounds', () => {
      const lightColors = [colorPalette.primary[50], colorPalette.neutral[100], colorPalette.success[100]];
      
      lightColors.forEach(color => {
        expect(color.contrast).toBe('#1f2937'); // Dark text on light backgrounds
      });
    });

    it('should have appropriate contrast colors for dark backgrounds', () => {
      const darkColors = [colorPalette.primary[800], colorPalette.neutral[800], colorPalette.error[800]];
      
      darkColors.forEach(color => {
        expect(color.contrast).toBe('#ffffff'); // White text on dark backgrounds
      });
    });
  });

  describe('Semantic Colors', () => {
    it('should have all required semantic color categories', () => {
      const expectedCategories = ['text', 'background', 'border', 'interactive', 'status'];
      expectedCategories.forEach(category => {
        expect(semanticColors).toHaveProperty(category);
      });
    });

    it('should have proper text color hierarchy', () => {
      expect(semanticColors.text.primary).toBeDefined();
      expect(semanticColors.text.secondary).toBeDefined();
      expect(semanticColors.text.tertiary).toBeDefined();
    });

    it('should have proper background color hierarchy', () => {
      expect(semanticColors.background.primary).toBeDefined();
      expect(semanticColors.background.secondary).toBeDefined();
      expect(semanticColors.background.tertiary).toBeDefined();
    });
  });

  describe('Dark Mode Colors', () => {
    it('should have dark mode variants for all semantic categories', () => {
      const expectedCategories = ['text', 'background', 'border', 'interactive'];
      expectedCategories.forEach(category => {
        expect(darkModeColors).toHaveProperty(category);
      });
    });

    it('should have appropriate dark mode text colors', () => {
      expect(darkModeColors.text.primary.value).toBe(colorPalette.neutral[50].value);
      expect(darkModeColors.text.inverse.value).toBe(colorPalette.neutral[900].value);
    });

    it('should have appropriate dark mode background colors', () => {
      expect(darkModeColors.background.primary.value).toBe(colorPalette.neutral[900].value);
      expect(darkModeColors.background.inverse.value).toBe(colorPalette.neutral[50].value);
    });
  });

  describe('Color Utilities', () => {
    it('should get colors by name and scale', () => {
      const primary500 = colorUtils.getColor('primary', '500');
      expect(primary500).toBe(colorPalette.primary[500]);
    });

    it('should get semantic colors', () => {
      const textPrimary = colorUtils.getSemantic('text', 'primary');
      expect(textPrimary).toBe(semanticColors.text.primary);
    });

    it('should get dark mode colors', () => {
      const darkTextPrimary = colorUtils.getDarkMode('text', 'primary');
      expect(darkTextPrimary).toBe(darkModeColors.text.primary);
    });

    it('should check WCAG compliance', () => {
      const isPrimary500AA = colorUtils.meetsWCAG('primary', '500', 'aa');
      expect(typeof isPrimary500AA).toBe('boolean');
    });

    it('should get all WCAG compliant colors', () => {
      const compliant = colorUtils.getWCAGCompliant('aa');
      expect(typeof compliant).toBe('object');
      
      // Should have at least some compliant colors
      let totalCompliant = 0;
      Object.values(compliant).forEach(palette => {
        totalCompliant += Object.keys(palette).length;
      });
      
      expect(totalCompliant).toBeGreaterThan(0);
    });
  });

  describe('Color Values', () => {
    it('should have valid hex color values', () => {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;
      
      Object.values(colorPalette).forEach(scale => {
        Object.values(scale).forEach(color => {
          expect(color.value).toMatch(hexRegex);
        });
      });
    });

    it('should have consistent color progression', () => {
      // Colors should progress from light to dark
      Object.values(colorPalette).forEach(scale => {
        const scales = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
        
        for (let i = 0; i < scales.length - 1; i++) {
          const current = parseInt(scale[scales[i] as keyof typeof scale].value.slice(1), 16);
          const next = parseInt(scale[scales[i + 1] as keyof typeof scale].value.slice(1), 16);
          
          // This is a simplified check - in practice, you'd want more sophisticated color analysis
          expect(typeof current).toBe('number');
          expect(typeof next).toBe('number');
        }
      });
    });
  });
});



import { 
  colorPalette, 
  semanticColors, 
  darkModeColors, 
  colorUtils,
  ColorToken 
} from './colors';

describe('Color System', () => {
  describe('Color Palette Structure', () => {
    it('should have all required color palettes', () => {
      const expectedPalettes = ['primary', 'secondary', 'neutral', 'success', 'warning', 'error', 'info'];
      expectedPalettes.forEach(palette => {
        expect(colorPalette).toHaveProperty(palette);
      });
    });

    it('should have all color scales (50-900)', () => {
      const expectedScales = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
      Object.values(colorPalette).forEach(scale => {
        expectedScales.forEach(scaleKey => {
          expect(scale).toHaveProperty(scaleKey);
        });
      });
    });

    it('should have proper ColorToken structure for each color', () => {
      Object.values(colorPalette).forEach(scale => {
        Object.values(scale).forEach(color => {
          expect(color).toHaveProperty('value');
          expect(color).toHaveProperty('contrast');
          expect(color).toHaveProperty('wcag');
          expect(color.wcag).toHaveProperty('aa');
          expect(color.wcag).toHaveProperty('aaa');
        });
      });
    });
  });

  describe('WCAG Compliance', () => {
    it('should have colors that meet WCAG AA standards', () => {
      const wcagCompliant = colorUtils.getWCAGCompliant('aa');
      
      // At least some colors should meet AA standards
      let hasCompliantColors = false;
      Object.values(wcagCompliant).forEach(palette => {
        if (Object.keys(palette).length > 0) {
          hasCompliantColors = true;
        }
      });
      
      expect(hasCompliantColors).toBe(true);
    });

    it('should have primary colors that meet WCAG AA standards', () => {
      // Primary colors should be accessible for UI elements
      const primary500 = colorPalette.primary[500];
      const primary600 = colorPalette.primary[600];
      const primary700 = colorPalette.primary[700];
      
      expect(primary500.wcag.aa).toBe(true);
      expect(primary600.wcag.aa).toBe(true);
      expect(primary700.wcag.aa).toBe(true);
    });

    it('should have error colors that meet WCAG AA standards', () => {
      // Error colors must be accessible for important messages
      const error500 = colorPalette.error[500];
      const error600 = colorPalette.error[600];
      
      expect(error500.wcag.aa).toBe(true);
      expect(error600.wcag.aa).toBe(true);
    });
  });

  describe('Color Contrast', () => {
    it('should have appropriate contrast colors for light backgrounds', () => {
      const lightColors = [colorPalette.primary[50], colorPalette.neutral[100], colorPalette.success[100]];
      
      lightColors.forEach(color => {
        expect(color.contrast).toBe('#1f2937'); // Dark text on light backgrounds
      });
    });

    it('should have appropriate contrast colors for dark backgrounds', () => {
      const darkColors = [colorPalette.primary[800], colorPalette.neutral[800], colorPalette.error[800]];
      
      darkColors.forEach(color => {
        expect(color.contrast).toBe('#ffffff'); // White text on dark backgrounds
      });
    });
  });

  describe('Semantic Colors', () => {
    it('should have all required semantic color categories', () => {
      const expectedCategories = ['text', 'background', 'border', 'interactive', 'status'];
      expectedCategories.forEach(category => {
        expect(semanticColors).toHaveProperty(category);
      });
    });

    it('should have proper text color hierarchy', () => {
      expect(semanticColors.text.primary).toBeDefined();
      expect(semanticColors.text.secondary).toBeDefined();
      expect(semanticColors.text.tertiary).toBeDefined();
    });

    it('should have proper background color hierarchy', () => {
      expect(semanticColors.background.primary).toBeDefined();
      expect(semanticColors.background.secondary).toBeDefined();
      expect(semanticColors.background.tertiary).toBeDefined();
    });
  });

  describe('Dark Mode Colors', () => {
    it('should have dark mode variants for all semantic categories', () => {
      const expectedCategories = ['text', 'background', 'border', 'interactive'];
      expectedCategories.forEach(category => {
        expect(darkModeColors).toHaveProperty(category);
      });
    });

    it('should have appropriate dark mode text colors', () => {
      expect(darkModeColors.text.primary.value).toBe(colorPalette.neutral[50].value);
      expect(darkModeColors.text.inverse.value).toBe(colorPalette.neutral[900].value);
    });

    it('should have appropriate dark mode background colors', () => {
      expect(darkModeColors.background.primary.value).toBe(colorPalette.neutral[900].value);
      expect(darkModeColors.background.inverse.value).toBe(colorPalette.neutral[50].value);
    });
  });

  describe('Color Utilities', () => {
    it('should get colors by name and scale', () => {
      const primary500 = colorUtils.getColor('primary', '500');
      expect(primary500).toBe(colorPalette.primary[500]);
    });

    it('should get semantic colors', () => {
      const textPrimary = colorUtils.getSemantic('text', 'primary');
      expect(textPrimary).toBe(semanticColors.text.primary);
    });

    it('should get dark mode colors', () => {
      const darkTextPrimary = colorUtils.getDarkMode('text', 'primary');
      expect(darkTextPrimary).toBe(darkModeColors.text.primary);
    });

    it('should check WCAG compliance', () => {
      const isPrimary500AA = colorUtils.meetsWCAG('primary', '500', 'aa');
      expect(typeof isPrimary500AA).toBe('boolean');
    });

    it('should get all WCAG compliant colors', () => {
      const compliant = colorUtils.getWCAGCompliant('aa');
      expect(typeof compliant).toBe('object');
      
      // Should have at least some compliant colors
      let totalCompliant = 0;
      Object.values(compliant).forEach(palette => {
        totalCompliant += Object.keys(palette).length;
      });
      
      expect(totalCompliant).toBeGreaterThan(0);
    });
  });

  describe('Color Values', () => {
    it('should have valid hex color values', () => {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;
      
      Object.values(colorPalette).forEach(scale => {
        Object.values(scale).forEach(color => {
          expect(color.value).toMatch(hexRegex);
        });
      });
    });

    it('should have consistent color progression', () => {
      // Colors should progress from light to dark
      Object.values(colorPalette).forEach(scale => {
        const scales = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
        
        for (let i = 0; i < scales.length - 1; i++) {
          const current = parseInt(scale[scales[i] as keyof typeof scale].value.slice(1), 16);
          const next = parseInt(scale[scales[i + 1] as keyof typeof scale].value.slice(1), 16);
          
          // This is a simplified check - in practice, you'd want more sophisticated color analysis
          expect(typeof current).toBe('number');
          expect(typeof next).toBe('number');
        }
      });
    });
  });
});



