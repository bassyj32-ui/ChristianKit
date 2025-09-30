import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme, useColors, useThemeMode } from './ThemeProvider';

// Single TestComponent definition
const TestComponent = () => {
  const theme = useTheme();
  const colors = useColors();
  const themeMode = useThemeMode();
  return (
    <div>
      <div data-testid="mode">{theme.mode}</div>
      <div data-testid="isDark">{theme.isDark.toString()}</div>
      <div data-testid="primary-color">{colors.colors.primary[500].value}</div>
      <button onClick={() => theme.setMode('dark')}>Set Dark</button>
      <button onClick={() => theme.setMode('light')}>Set Light</button>
      <button onClick={() => theme.setMode('system')}>Set System</button>
      <button onClick={theme.toggleMode}>Toggle</button>
    </div>
  );
};

describe('ThemeProvider', () => {
  beforeEach(() => {
    // Reset document attributes
    document.documentElement.removeAttribute('data-theme');
    
    // Clear localStorage to ensure clean state
    localStorage.clear();
    
    // Clear any existing CSS custom properties
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    const cssVars = Array.from(computedStyle).filter(prop => prop.startsWith('--color-'));
    cssVars.forEach(varName => root.style.removeProperty(varName));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Theme Context', () => {
    it('should provide theme context to children', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('mode')).toHaveTextContent('system');
      expect(screen.getByTestId('isDark')).toHaveTextContent('false');
    });

    it('should provide color palette', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const primaryColor = screen.getByTestId('primary-color');
      expect(primaryColor).toHaveTextContent('#3b82f6'); // primary-500
    });

    it('should provide theme mode management', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const setDarkButton = screen.getByText('Set Dark');
      const setLightButton = screen.getByText('Set Light');
      const setSystemButton = screen.getByText('Set System');
      const toggleButton = screen.getByText('Toggle');

      expect(setDarkButton).toBeInTheDocument();
      expect(setLightButton).toBeInTheDocument();
      expect(setSystemButton).toBeInTheDocument();
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('Theme Mode Switching', () => {
    it('should switch to light mode', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const setLightButton = screen.getByText('Set Light');
      fireEvent.click(setLightButton);

      expect(screen.getByTestId('mode')).toHaveTextContent('light');
      expect(screen.getByTestId('isDark')).toHaveTextContent('false');
    });

    it('should switch to dark mode', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const setDarkButton = screen.getByText('Set Dark');
      fireEvent.click(setDarkButton);

      expect(screen.getByTestId('mode')).toHaveTextContent('dark');
      expect(screen.getByTestId('isDark')).toHaveTextContent('true');
    });

    it('should switch to system mode', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const setSystemButton = screen.getByText('Set System');
      fireEvent.click(setSystemButton);

      expect(screen.getByTestId('mode')).toHaveTextContent('system');
    });

    it('should toggle between light and dark mode', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Start with light mode
      const setLightButton = screen.getByText('Set Light');
      fireEvent.click(setLightButton);
      expect(screen.getByTestId('isDark')).toHaveTextContent('false');

      // Toggle to dark mode
      const toggleButton = screen.getByText('Toggle');
      fireEvent.click(toggleButton);
      expect(screen.getByTestId('isDark')).toHaveTextContent('true');

      // Toggle back to light mode
      fireEvent.click(toggleButton);
      expect(screen.getByTestId('isDark')).toHaveTextContent('false');
    });
  });

  describe('System Theme Detection', () => {
    it('should detect system light mode by default', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('isDark')).toHaveTextContent('false');
    });
  });

  describe('CSS Custom Properties', () => {
    it('should set data-theme attribute', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Default should be light mode
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('should update data-theme attribute when switching themes', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Switch to dark mode
      const setDarkButton = screen.getByText('Set Dark');
      fireEvent.click(setDarkButton);

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should set CSS custom properties for colors', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      
      // Check that some color variables are set
      expect(computedStyle.getPropertyValue('--color-primary-500')).toBeTruthy();
      expect(computedStyle.getPropertyValue('--color-neutral-900')).toBeTruthy();
    });
  });

  describe('Default Mode', () => {
    it('should use system mode by default', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('mode')).toHaveTextContent('system');
    });

    it('should accept custom default mode', () => {
      render(
        <ThemeProvider defaultMode="dark">
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('mode')).toHaveTextContent('dark');
      expect(screen.getByTestId('isDark')).toHaveTextContent('true');
    });
  });

  describe('Hook Usage', () => {
    it('should throw error when useTheme is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => render(<TestComponent />)).toThrow(
        'useTheme must be used within a ThemeProvider'
      );
      
      consoleSpy.mockRestore();
    });

    it('should provide useColors hook', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // The component should render without errors
      expect(screen.getByTestId('primary-color')).toBeInTheDocument();
    });

    it('should provide useThemeMode hook', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // The component should render without errors
      expect(screen.getByText('Toggle')).toBeInTheDocument();
    });
  });
});