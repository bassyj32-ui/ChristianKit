// CSS Custom Properties Generator for Christian Kit Color System
// Generates CSS variables for all colors with dark mode support

import { colorPalette, semanticColors, darkModeColors } from './colors';

// Generate CSS custom properties for color scales
function generateColorScaleVariables(paletteName: string, scale: Record<string, any>): string {
  return Object.entries(scale)
    .map(([key, color]) => `--color-${paletteName}-${key}: ${color.value};`)
    .join('\n  ');
}

// Generate CSS custom properties for semantic colors
function generateSemanticVariables(): string {
  const variables: string[] = [];
  
  Object.entries(semanticColors).forEach(([category, variants]) => {
    Object.entries(variants).forEach(([variant, color]) => {
      if (typeof color === 'object' && 'value' in color) {
        variables.push(`--color-${category}-${variant}: ${color.value};`);
      } else {
        variables.push(`--color-${category}-${variant}: ${color};`);
      }
    });
  });
  
  return variables.join('\n  ');
}

// Generate dark mode CSS custom properties
function generateDarkModeVariables(): string {
  const variables: string[] = [];
  
  Object.entries(darkModeColors).forEach(([category, variants]) => {
    Object.entries(variants).forEach(([variant, color]) => {
      if (typeof color === 'object' && 'value' in color) {
        variables.push(`--color-${category}-${variant}: ${color.value};`);
      } else {
        variables.push(`--color-${category}-${variant}: ${color};`);
      }
    });
  });
  
  return variables.join('\n  ');
}

// Generate complete CSS variables string
export function generateCSSVariables(): string {
  const colorScaleVars = Object.entries(colorPalette)
    .map(([name, scale]) => generateColorScaleVariables(name, scale))
    .join('\n  ');
  
  const semanticVars = generateSemanticVariables();
  
  return `/* Christian Kit Color System - CSS Custom Properties */
:root {
  /* Color Scale Variables */
  ${colorScaleVars}
  
  /* Semantic Color Variables */
  ${semanticVars}
}

/* Dark Mode Overrides */
@media (prefers-color-scheme: dark) {
  :root {
    ${generateDarkModeVariables()}
  }
}

/* Dark Mode Class Override */
[data-theme="dark"] {
  ${generateDarkModeVariables()}
}

/* Light Mode Class Override */
[data-theme="light"] {
  /* Use default light mode colors */
}`;
}

// Generate Tailwind CSS configuration
export function generateTailwindConfig(): string {
  const colorConfig: Record<string, Record<string, string>> = {};
  
  // Add color scales
  Object.entries(colorPalette).forEach(([paletteName, scale]) => {
    colorConfig[paletteName] = {};
    Object.entries(scale).forEach(([key, color]) => {
      colorConfig[paletteName][key] = `var(--color-${paletteName}-${key})`;
    });
  });
  
  // Add semantic colors
  Object.entries(semanticColors).forEach(([category, variants]) => {
    colorConfig[category] = {};
    Object.entries(variants).forEach(([variant, color]) => {
      if (typeof color === 'object' && 'value' in color) {
        colorConfig[category][variant] = `var(--color-${category}-${variant})`;
      } else {
        colorConfig[category][variant] = `var(--color-${category}-${variant})`;
      }
    });
  });
  
  return `// Tailwind CSS Configuration for Christian Kit Colors
module.exports = {
  theme: {
    extend: {
      colors: ${JSON.stringify(colorConfig, null, 2)}
    }
  }
}`;
}

// Generate CSS utility classes
export function generateCSSUtilities(): string {
  return `/* Christian Kit Color Utilities */

/* Background Colors */
.bg-primary { background-color: var(--color-primary-500); }
.bg-primary-light { background-color: var(--color-primary-100); }
.bg-primary-dark { background-color: var(--color-primary-700); }

.bg-secondary { background-color: var(--color-secondary-500); }
.bg-secondary-light { background-color: var(--color-secondary-100); }
.bg-secondary-dark { background-color: var(--color-secondary-700); }

.bg-success { background-color: var(--color-success-500); }
.bg-warning { background-color: var(--color-warning-500); }
.bg-error { background-color: var(--color-error-500); }
.bg-info { background-color: var(--color-info-500); }

/* Text Colors */
.text-primary { color: var(--color-primary-600); }
.text-secondary { color: var(--color-secondary-600); }
.text-success { color: var(--color-success-600); }
.text-warning { color: var(--color-warning-600); }
.text-error { color: var(--color-error-600); }
.text-info { color: var(--color-info-600); }

/* Border Colors */
.border-primary { border-color: var(--color-primary-500); }
.border-secondary { border-color: var(--color-secondary-500); }
.border-success { border-color: var(--color-success-500); }
.border-warning { border-color: var(--color-warning-500); }
.border-error { border-color: var(--color-error-500); }
.border-info { border-color: var(--color-info-500); }

/* Focus States */
.focus\\:ring-primary:focus { --tw-ring-color: var(--color-primary-500); }
.focus\\:ring-secondary:focus { --tw-ring-color: var(--color-secondary-500); }
.focus\\:ring-success:focus { --tw-ring-color: var(--color-success-500); }
.focus\\:ring-warning:focus { --tw-ring-color: var(--color-warning-500); }
.focus\\:ring-error:focus { --tw-ring-color: var(--color-error-500); }
.focus\\:ring-info:focus { --tw-ring-color: var(--color-info-500); }

/* Hover States */
.hover\\:bg-primary:hover { background-color: var(--color-primary-600); }
.hover\\:bg-secondary:hover { background-color: var(--color-secondary-600); }
.hover\\:bg-success:hover { background-color: var(--color-success-600); }
.hover\\:bg-warning:hover { background-color: var(--color-warning-600); }
.hover\\:bg-error:hover { background-color: var(--color-error-600); }
.hover\\:bg-info:hover { background-color: var(--color-info-600); }

/* Active States */
.active\\:bg-primary:active { background-color: var(--color-primary-700); }
.active\\:bg-secondary:active { background-color: var(--color-secondary-700); }
.active\\:bg-success:active { background-color: var(--color-success-700); }
.active\\:bg-warning:active { background-color: var(--color-warning-700); }
.active\\:bg-error:active { background-color: var(--color-error-700); }
.active\\:bg-info:active { background-color: var(--color-info-700); }`;
}

// Export all generators
export const cssGenerators = {
  variables: generateCSSVariables,
  tailwind: generateTailwindConfig,
  utilities: generateCSSUtilities,
};



// Generates CSS variables for all colors with dark mode support

import { colorPalette, semanticColors, darkModeColors } from './colors';

// Generate CSS custom properties for color scales
function generateColorScaleVariables(paletteName: string, scale: Record<string, any>): string {
  return Object.entries(scale)
    .map(([key, color]) => `--color-${paletteName}-${key}: ${color.value};`)
    .join('\n  ');
}

// Generate CSS custom properties for semantic colors
function generateSemanticVariables(): string {
  const variables: string[] = [];
  
  Object.entries(semanticColors).forEach(([category, variants]) => {
    Object.entries(variants).forEach(([variant, color]) => {
      if (typeof color === 'object' && 'value' in color) {
        variables.push(`--color-${category}-${variant}: ${color.value};`);
      } else {
        variables.push(`--color-${category}-${variant}: ${color};`);
      }
    });
  });
  
  return variables.join('\n  ');
}

// Generate dark mode CSS custom properties
function generateDarkModeVariables(): string {
  const variables: string[] = [];
  
  Object.entries(darkModeColors).forEach(([category, variants]) => {
    Object.entries(variants).forEach(([variant, color]) => {
      if (typeof color === 'object' && 'value' in color) {
        variables.push(`--color-${category}-${variant}: ${color.value};`);
      } else {
        variables.push(`--color-${category}-${variant}: ${color};`);
      }
    });
  });
  
  return variables.join('\n  ');
}

// Generate complete CSS variables string
export function generateCSSVariables(): string {
  const colorScaleVars = Object.entries(colorPalette)
    .map(([name, scale]) => generateColorScaleVariables(name, scale))
    .join('\n  ');
  
  const semanticVars = generateSemanticVariables();
  
  return `/* Christian Kit Color System - CSS Custom Properties */
:root {
  /* Color Scale Variables */
  ${colorScaleVars}
  
  /* Semantic Color Variables */
  ${semanticVars}
}

/* Dark Mode Overrides */
@media (prefers-color-scheme: dark) {
  :root {
    ${generateDarkModeVariables()}
  }
}

/* Dark Mode Class Override */
[data-theme="dark"] {
  ${generateDarkModeVariables()}
}

/* Light Mode Class Override */
[data-theme="light"] {
  /* Use default light mode colors */
}`;
}

// Generate Tailwind CSS configuration
export function generateTailwindConfig(): string {
  const colorConfig: Record<string, Record<string, string>> = {};
  
  // Add color scales
  Object.entries(colorPalette).forEach(([paletteName, scale]) => {
    colorConfig[paletteName] = {};
    Object.entries(scale).forEach(([key, color]) => {
      colorConfig[paletteName][key] = `var(--color-${paletteName}-${key})`;
    });
  });
  
  // Add semantic colors
  Object.entries(semanticColors).forEach(([category, variants]) => {
    colorConfig[category] = {};
    Object.entries(variants).forEach(([variant, color]) => {
      if (typeof color === 'object' && 'value' in color) {
        colorConfig[category][variant] = `var(--color-${category}-${variant})`;
      } else {
        colorConfig[category][variant] = `var(--color-${category}-${variant})`;
      }
    });
  });
  
  return `// Tailwind CSS Configuration for Christian Kit Colors
module.exports = {
  theme: {
    extend: {
      colors: ${JSON.stringify(colorConfig, null, 2)}
    }
  }
}`;
}

// Generate CSS utility classes
export function generateCSSUtilities(): string {
  return `/* Christian Kit Color Utilities */

/* Background Colors */
.bg-primary { background-color: var(--color-primary-500); }
.bg-primary-light { background-color: var(--color-primary-100); }
.bg-primary-dark { background-color: var(--color-primary-700); }

.bg-secondary { background-color: var(--color-secondary-500); }
.bg-secondary-light { background-color: var(--color-secondary-100); }
.bg-secondary-dark { background-color: var(--color-secondary-700); }

.bg-success { background-color: var(--color-success-500); }
.bg-warning { background-color: var(--color-warning-500); }
.bg-error { background-color: var(--color-error-500); }
.bg-info { background-color: var(--color-info-500); }

/* Text Colors */
.text-primary { color: var(--color-primary-600); }
.text-secondary { color: var(--color-secondary-600); }
.text-success { color: var(--color-success-600); }
.text-warning { color: var(--color-warning-600); }
.text-error { color: var(--color-error-600); }
.text-info { color: var(--color-info-600); }

/* Border Colors */
.border-primary { border-color: var(--color-primary-500); }
.border-secondary { border-color: var(--color-secondary-500); }
.border-success { border-color: var(--color-success-500); }
.border-warning { border-color: var(--color-warning-500); }
.border-error { border-color: var(--color-error-500); }
.border-info { border-color: var(--color-info-500); }

/* Focus States */
.focus\\:ring-primary:focus { --tw-ring-color: var(--color-primary-500); }
.focus\\:ring-secondary:focus { --tw-ring-color: var(--color-secondary-500); }
.focus\\:ring-success:focus { --tw-ring-color: var(--color-success-500); }
.focus\\:ring-warning:focus { --tw-ring-color: var(--color-warning-500); }
.focus\\:ring-error:focus { --tw-ring-color: var(--color-error-500); }
.focus\\:ring-info:focus { --tw-ring-color: var(--color-info-500); }

/* Hover States */
.hover\\:bg-primary:hover { background-color: var(--color-primary-600); }
.hover\\:bg-secondary:hover { background-color: var(--color-secondary-600); }
.hover\\:bg-success:hover { background-color: var(--color-success-600); }
.hover\\:bg-warning:hover { background-color: var(--color-warning-600); }
.hover\\:bg-error:hover { background-color: var(--color-error-600); }
.hover\\:bg-info:hover { background-color: var(--color-info-600); }

/* Active States */
.active\\:bg-primary:active { background-color: var(--color-primary-700); }
.active\\:bg-secondary:active { background-color: var(--color-secondary-700); }
.active\\:bg-success:active { background-color: var(--color-success-700); }
.active\\:bg-warning:active { background-color: var(--color-warning-700); }
.active\\:bg-error:active { background-color: var(--color-error-700); }
.active\\:bg-info:active { background-color: var(--color-info-700); }`;
}

// Export all generators
export const cssGenerators = {
  variables: generateCSSVariables,
  tailwind: generateTailwindConfig,
  utilities: generateCSSUtilities,
};



