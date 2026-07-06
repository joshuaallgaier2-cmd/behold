import React, { createContext, ReactNode, useContext, useState } from 'react';

/**
 * Interface defining the color structure for the Behold application.
 */
export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  accent: string;
  border: string;
  error: string;
  isDark: boolean;
}

/**
 * Interface defining the properties provided by the Theme Context.
 */
interface ThemeContextProps {
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
}

/**
 * Exact values for the Dark and Light themes as per engineering requirements.
 */
const darkTheme: ThemeColors = {
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF',
  accent: '#FFD700',
  border: '#2C2C2C',
  error: '#EF5350',
  isDark: true,
};

const lightTheme: ThemeColors = {
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  accent: '#D4AF37',
  border: '#E5E5E5',
  error: '#D32F2F',
  isDark: false,
};

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

/**
 * Provider component that wraps the application and manages the theme state.
 */
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>('dark');

  const toggleTheme = () => {
    setCurrentTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const colors = currentTheme === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ colors, isDark: currentTheme === 'dark', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to access Behold's theme colors and toggle functionality.
 */
export const useBeholdTheme = (): ThemeContextProps => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useBeholdTheme must be used within a ThemeProvider');
  }
  return context;
};