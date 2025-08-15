import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../theme/ThemeProvider';
import ThemeToggle from './ThemeToggle';

// Wrapper component to provide theme context
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('ThemeToggle', () => {
  beforeEach(() => {
    // Reset document attributes
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with labels by default', () => {
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      expect(screen.getByText('Theme:')).toBeInTheDocument();
      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('System')).toBeInTheDocument();
      expect(screen.getByText('Dark')).toBeInTheDocument();
      expect(screen.getByText('Toggle')).toBeInTheDocument();
    });

    it('should render without labels when showLabels is false', () => {
      render(
        <TestWrapper>
          <ThemeToggle showLabels={false} />
        </TestWrapper>
      );

      expect(screen.queryByText('Theme:')).not.toBeInTheDocument();
      expect(screen.queryByText('Light')).not.toBeInTheDocument();
      expect(screen.queryByText('System')).not.toBeInTheDocument();
      expect(screen.queryByText('Dark')).not.toBeInTheDocument();
      expect(screen.queryByText('Toggle')).not.toBeInTheDocument();

      // Should show emojis instead
      expect(screen.getByText('☀️')).toBeInTheDocument();
      expect(screen.getByText('💻')).toBeInTheDocument();
      expect(screen.getByText('🌙')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <TestWrapper>
          <ThemeToggle className="custom-class" />
        </TestWrapper>
      );

      const container = screen.getByText('Theme:').parentElement;
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Theme Switching', () => {
    it('should switch to light mode when Light button is clicked', () => {
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      const lightButton = screen.getByText('Light');
      fireEvent.click(lightButton);

      // Check that data-theme attribute is updated
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('should switch to dark mode when Dark button is clicked', () => {
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      const darkButton = screen.getByText('Dark');
      fireEvent.click(darkButton);

      // Check that data-theme attribute is updated
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should switch to system mode when System button is clicked', () => {
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      const systemButton = screen.getByText('System');
      fireEvent.click(systemButton);

      // Check that data-theme attribute is updated based on system preference
      // Since we mocked matchMedia to return false, it should be light
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('should toggle theme when Toggle button is clicked', () => {
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      // Start with light mode
      const lightButton = screen.getByText('Light');
      fireEvent.click(lightButton);
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');

      // Toggle to dark mode
      const toggleButton = screen.getByText('Toggle');
      fireEvent.click(toggleButton);
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

      // Toggle back to light mode
      fireEvent.click(toggleButton);
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  describe('Button States', () => {
    it('should highlight active theme button', () => {
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      // Click light mode button
      const lightButton = screen.getByText('Light');
      fireEvent.click(lightButton);

      // Light button should have active styling
      expect(lightButton).toHaveClass('bg-white', 'text-gray-900', 'shadow-sm', 'border');
    });

    it('should show inactive state for non-active theme buttons', () => {
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      // Click light mode button
      const lightButton = screen.getByText('Light');
      fireEvent.click(lightButton);

      // Other buttons should have inactive styling
      const systemButton = screen.getByText('System');
      const darkButton = screen.getByText('Dark');

      expect(systemButton).toHaveClass('text-gray-600', 'hover:text-gray-900');
      expect(darkButton).toHaveClass('text-gray-600', 'hover:text-gray-900');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Light mode')).toBeInTheDocument();
      expect(screen.getByLabelText('System theme')).toBeInTheDocument();
      expect(screen.getByLabelText('Dark mode')).toBeInTheDocument();
      expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument();
    });

    it('should have proper button roles', () => {
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4); // Light, System, Dark, Toggle
    });
  });

  describe('Responsive Design', () => {
    it('should have proper spacing and layout classes', () => {
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      const container = screen.getByText('Theme:').parentElement;
      expect(container).toHaveClass('flex', 'items-center', 'space-x-2');

      const buttonContainer = screen.getByText('Light').closest('div');
      expect(buttonContainer).toHaveClass('flex', 'rounded-lg', 'border', 'p-1');
    });

    it('should have proper button sizing', () => {
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // Check that each button has the required sizing classes
        expect(button).toHaveClass('px-3');
        expect(button).toHaveClass('py-1');
        expect(button).toHaveClass('text-sm');
        expect(button).toHaveClass('rounded-md');
      });
    });
  });

  describe('Dark Mode Styling', () => {
    it('should apply dark mode classes when theme is dark', () => {
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      // Switch to dark mode
      const darkButton = screen.getByText('Dark');
      fireEvent.click(darkButton);

      // Check that dark mode classes are applied
      const themeLabel = screen.getByText('Theme:');
      expect(themeLabel).toHaveClass('dark:text-gray-300');
    });
  });

  describe('Integration with ThemeProvider', () => {
    it('should work with ThemeProvider context', () => {
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      // Should render without errors
      expect(screen.getByText('Theme:')).toBeInTheDocument();

      // Should be able to change themes
      const lightButton = screen.getByText('Light');
      fireEvent.click(lightButton);
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('should maintain theme state across re-renders', () => {
      const { rerender } = render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      // Switch to dark mode
      const darkButton = screen.getByText('Dark');
      fireEvent.click(darkButton);
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

      // Re-render the component
      rerender(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      // Theme should still be dark
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });
});

import { ThemeProvider } from '../theme/ThemeProvider';
import ThemeToggle from './ThemeToggle';

// Wrapper component to provide theme context
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('ThemeToggle', () => {
  beforeEach(() => {
    // Reset document attributes
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with labels by default', () => {
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      expect(screen.getByText('Theme:')).toBeInTheDocument();
      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('System')).toBeInTheDocument();
      expect(screen.getByText('Dark')).toBeInTheDocument();
      expect(screen.getByText('Toggle')).toBeInTheDocument();
    });

    it('should render without labels when showLabels is false', () => {
      render(
        <TestWrapper>
          <ThemeToggle showLabels={false} />
        </TestWrapper>
      );

      expect(screen.queryByText('Theme:')).not.toBeInTheDocument();
      expect(screen.queryByText('Light')).not.toBeInTheDocument();
      expect(screen.queryByText('System')).not.toBeInTheDocument();
      expect(screen.queryByText('Dark')).not.toBeInTheDocument();
      expect(screen.queryByText('Toggle')).not.toBeInTheDocument();

      // Should show emojis instead
      expect(screen.getByText('☀️')).toBeInTheDocument();
      expect(screen.getByText('💻')).toBeInTheDocument();
      expect(screen.getByText('🌙')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <TestWrapper>
          <ThemeToggle className="custom-class" />
        </TestWrapper>
      );

      const container = screen.getByText('Theme:').parentElement;
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Theme Switching', () => {
    it('should switch to light mode when Light button is clicked', () => {
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      const lightButton = screen.getByText('Light');
      fireEvent.click(lightButton);

      // Check that data-theme attribute is updated
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('should switch to dark mode when Dark button is clicked', () => {
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      const darkButton = screen.getByText('Dark');
      fireEvent.click(darkButton);

      // Check that data-theme attribute is updated
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should switch to system mode when System button is clicked', () => {
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      const systemButton = screen.getByText('System');
      fireEvent.click(systemButton);

      // Check that data-theme attribute is updated based on system preference
      // Since we mocked matchMedia to return false, it should be light
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('should toggle theme when Toggle button is clicked', () => {
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      // Start with light mode
      const lightButton = screen.getByText('Light');
      fireEvent.click(lightButton);
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');

      // Toggle to dark mode
      const toggleButton = screen.getByText('Toggle');
      fireEvent.click(toggleButton);
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

      // Toggle back to light mode
      fireEvent.click(toggleButton);
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  describe('Button States', () => {
    it('should highlight active theme button', () => {
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      // Click light mode button
      const lightButton = screen.getByText('Light');
      fireEvent.click(lightButton);

      // Light button should have active styling
      expect(lightButton).toHaveClass('bg-white', 'text-gray-900', 'shadow-sm', 'border');
    });

    it('should show inactive state for non-active theme buttons', () => {
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      // Click light mode button
      const lightButton = screen.getByText('Light');
      fireEvent.click(lightButton);

      // Other buttons should have inactive styling
      const systemButton = screen.getByText('System');
      const darkButton = screen.getByText('Dark');

      expect(systemButton).toHaveClass('text-gray-600', 'hover:text-gray-900');
      expect(darkButton).toHaveClass('text-gray-600', 'hover:text-gray-900');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Light mode')).toBeInTheDocument();
      expect(screen.getByLabelText('System theme')).toBeInTheDocument();
      expect(screen.getByLabelText('Dark mode')).toBeInTheDocument();
      expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument();
    });

    it('should have proper button roles', () => {
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4); // Light, System, Dark, Toggle
    });
  });

  describe('Responsive Design', () => {
    it('should have proper spacing and layout classes', () => {
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      const container = screen.getByText('Theme:').parentElement;
      expect(container).toHaveClass('flex', 'items-center', 'space-x-2');

      const buttonContainer = screen.getByText('Light').closest('div');
      expect(buttonContainer).toHaveClass('flex', 'rounded-lg', 'border', 'p-1');
    });

    it('should have proper button sizing', () => {
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // Check that each button has the required sizing classes
        expect(button).toHaveClass('px-3');
        expect(button).toHaveClass('py-1');
        expect(button).toHaveClass('text-sm');
        expect(button).toHaveClass('rounded-md');
      });
    });
  });

  describe('Dark Mode Styling', () => {
    it('should apply dark mode classes when theme is dark', () => {
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      // Switch to dark mode
      const darkButton = screen.getByText('Dark');
      fireEvent.click(darkButton);

      // Check that dark mode classes are applied
      const themeLabel = screen.getByText('Theme:');
      expect(themeLabel).toHaveClass('dark:text-gray-300');
    });
  });

  describe('Integration with ThemeProvider', () => {
    it('should work with ThemeProvider context', () => {
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      // Should render without errors
      expect(screen.getByText('Theme:')).toBeInTheDocument();

      // Should be able to change themes
      const lightButton = screen.getByText('Light');
      fireEvent.click(lightButton);
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('should maintain theme state across re-renders', () => {
      const { rerender } = render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      // Switch to dark mode
      const darkButton = screen.getByText('Dark');
      fireEvent.click(darkButton);
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

      // Re-render the component
      rerender(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      // Theme should still be dark
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });
});
