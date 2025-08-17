// client/src/context/ThemeContext.jsx

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

// Create the ThemeContext
const ThemeContext = createContext(null);

// Custom hook to use the ThemeContext easily
export const useTheme = () => useContext(ThemeContext);

// ThemeProvider component
export const ThemeProvider = ({ children }) => {
    // Initialize theme from localStorage or default to 'light'
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        // Check user's system preference if no theme is saved
        if (savedTheme) {
            return savedTheme;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    // Effect to apply the theme class to the documentElement (html tag)
    // and save the preference to localStorage
    useEffect(() => {
        const root = window.document.documentElement;
        // Remove existing theme classes
        root.classList.remove('light', 'dark');
        // Add the current theme class
        root.classList.add(theme);
        // Save to localStorage
        localStorage.setItem('theme', theme);
    }, [theme]); // Re-run whenever theme changes

    // Function to toggle between 'light' and 'dark' themes
    const toggleTheme = useCallback(() => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    }, []);

    const themeContextValue = {
        theme,
        toggleTheme,
    };

    return (
        <ThemeContext.Provider value={themeContextValue}>
            {children}
        </ThemeContext.Provider>
    );
};
 
