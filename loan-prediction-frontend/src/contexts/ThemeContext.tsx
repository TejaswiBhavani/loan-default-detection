import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'blue' | 'green' | 'purple';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  availableThemes: { value: Theme; label: string; colors: string[] }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('light');

  // Available themes with their color previews
  const availableThemes = [
    { 
      value: 'light' as Theme, 
      label: 'Light Theme',
      colors: ['#ffffff', '#f8fafc', '#e2e8f0', '#3182ce']
    },
    { 
      value: 'dark' as Theme, 
      label: 'Dark Theme',
      colors: ['#1a202c', '#2d3748', '#4a5568', '#63b3ed']
    },
    { 
      value: 'blue' as Theme, 
      label: 'Ocean Blue',
      colors: ['#ebf8ff', '#bee3f8', '#3182ce', '#2c5282']
    },
    { 
      value: 'green' as Theme, 
      label: 'Nature Green',
      colors: ['#f0fff4', '#c6f6d5', '#38a169', '#2f855a']
    },
    { 
      value: 'purple' as Theme, 
      label: 'Royal Purple',
      colors: ['#faf5ff', '#e9d8fd', '#805ad5', '#553c9a']
    }
  ];

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme') as Theme;
    if (savedTheme && availableThemes.some(t => t.value === savedTheme)) {
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    } else {
      applyTheme('light');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty dependency array - only run once on mount

  // Apply theme to document
  const applyTheme = (themeName: Theme) => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('theme-light', 'theme-dark', 'theme-blue', 'theme-green', 'theme-purple');
    
    // Add new theme class
    root.classList.add(`theme-${themeName}`);

    // Apply CSS custom properties based on theme
    switch (themeName) {
      case 'light':
        root.style.setProperty('--bg-primary', '#ffffff');
        root.style.setProperty('--bg-secondary', '#f8fafc');
        root.style.setProperty('--bg-tertiary', '#e2e8f0');
        root.style.setProperty('--text-primary', '#1a202c');
        root.style.setProperty('--text-secondary', '#4a5568');
        root.style.setProperty('--accent-primary', '#3182ce');
        root.style.setProperty('--accent-secondary', '#63b3ed');
        root.style.setProperty('--border-color', '#e2e8f0');
        root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.1)');
        break;
      case 'dark':
        root.style.setProperty('--bg-primary', '#1a202c');
        root.style.setProperty('--bg-secondary', '#2d3748');
        root.style.setProperty('--bg-tertiary', '#4a5568');
        root.style.setProperty('--text-primary', '#f7fafc');
        root.style.setProperty('--text-secondary', '#e2e8f0');
        root.style.setProperty('--accent-primary', '#63b3ed');
        root.style.setProperty('--accent-secondary', '#3182ce');
        root.style.setProperty('--border-color', '#4a5568');
        root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.3)');
        break;
      case 'blue':
        root.style.setProperty('--bg-primary', '#ebf8ff');
        root.style.setProperty('--bg-secondary', '#bee3f8');
        root.style.setProperty('--bg-tertiary', '#90cdf4');
        root.style.setProperty('--text-primary', '#1a365d');
        root.style.setProperty('--text-secondary', '#2c5282');
        root.style.setProperty('--accent-primary', '#3182ce');
        root.style.setProperty('--accent-secondary', '#2c5282');
        root.style.setProperty('--border-color', '#90cdf4');
        root.style.setProperty('--shadow-color', 'rgba(49, 130, 206, 0.2)');
        break;
      case 'green':
        root.style.setProperty('--bg-primary', '#f0fff4');
        root.style.setProperty('--bg-secondary', '#c6f6d5');
        root.style.setProperty('--bg-tertiary', '#9ae6b4');
        root.style.setProperty('--text-primary', '#1a202c');
        root.style.setProperty('--text-secondary', '#2f855a');
        root.style.setProperty('--accent-primary', '#38a169');
        root.style.setProperty('--accent-secondary', '#2f855a');
        root.style.setProperty('--border-color', '#9ae6b4');
        root.style.setProperty('--shadow-color', 'rgba(56, 161, 105, 0.2)');
        break;
      case 'purple':
        root.style.setProperty('--bg-primary', '#faf5ff');
        root.style.setProperty('--bg-secondary', '#e9d8fd');
        root.style.setProperty('--bg-tertiary', '#d6bcfa');
        root.style.setProperty('--text-primary', '#1a202c');
        root.style.setProperty('--text-secondary', '#553c9a');
        root.style.setProperty('--accent-primary', '#805ad5');
        root.style.setProperty('--accent-secondary', '#553c9a');
        root.style.setProperty('--border-color', '#d6bcfa');
        root.style.setProperty('--shadow-color', 'rgba(128, 90, 213, 0.2)');
        break;
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('app_theme', newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, availableThemes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
