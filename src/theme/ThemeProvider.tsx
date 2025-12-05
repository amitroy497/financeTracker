import { darkColors, lightColors, Theme, ThemeContextType } from '@/styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
	createContext,
	ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
	children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
	const systemColorScheme = useColorScheme();
	const [theme, setThemeState] = useState<Theme>('light');
	const [autoTheme, setAutoTheme] = useState<boolean>(false);
	const [colors, setColors] = useState<typeof lightColors | typeof darkColors>(
		lightColors
	);

	// Load saved theme settings on mount
	useEffect(() => {
		loadThemeSettings();
	}, []);

	// Load theme settings from AsyncStorage
	const loadThemeSettings = async (): Promise<void> => {
		try {
			const savedTheme = await AsyncStorage.getItem('app_theme');
			const savedAutoTheme = await AsyncStorage.getItem('auto_theme');

			if (savedAutoTheme === 'true') {
				setAutoTheme(true);
				// If auto theme is enabled, use system theme
				setThemeState(systemColorScheme === 'dark' ? 'dark' : 'light');
			} else if (savedTheme === 'light' || savedTheme === 'dark') {
				setAutoTheme(false);
				setThemeState(savedTheme);
			} else {
				// Default to light theme with auto theme off
				setAutoTheme(false);
				setThemeState('light');
				await AsyncStorage.setItem('app_theme', 'light');
				await AsyncStorage.setItem('auto_theme', 'false');
			}
		} catch (error) {
			console.error('Error loading theme settings:', error);
			setAutoTheme(false);
			setThemeState('light');
		}
	};

	// Update colors when theme changes
	useEffect(() => {
		setColors(theme === 'light' ? lightColors : darkColors);
	}, [theme]);

	// Watch for system theme changes when auto theme is enabled
	useEffect(() => {
		if (autoTheme && systemColorScheme) {
			setThemeState(systemColorScheme === 'dark' ? 'dark' : 'light');
			saveThemeSettings(
				systemColorScheme === 'dark' ? 'dark' : 'light',
				autoTheme
			);
		}
	}, [systemColorScheme, autoTheme]);

	// Save theme settings to AsyncStorage
	const saveThemeSettings = async (
		newTheme: Theme,
		auto: boolean
	): Promise<void> => {
		try {
			await AsyncStorage.setItem('app_theme', newTheme);
			await AsyncStorage.setItem('auto_theme', auto ? 'true' : 'false');
		} catch (error) {
			console.error('Error saving theme settings:', error);
		}
	};

	const setTheme = useCallback(
		(newTheme: Theme): void => {
			setThemeState(newTheme);
			saveThemeSettings(newTheme, autoTheme);
		},
		[autoTheme]
	);

	const toggleTheme = useCallback((): void => {
		const newTheme = theme === 'light' ? 'dark' : 'light';
		setTheme(newTheme);
	}, [theme, setTheme]);

	const toggleAutoTheme = useCallback(async (): Promise<void> => {
		const newAutoTheme = !autoTheme;
		setAutoTheme(newAutoTheme);

		if (newAutoTheme) {
			// If enabling auto theme, use system theme
			const systemTheme = systemColorScheme === 'dark' ? 'dark' : 'light';
			setThemeState(systemTheme);
			await saveThemeSettings(systemTheme, newAutoTheme);
		} else {
			// If disabling auto theme, keep current theme
			await saveThemeSettings(theme, newAutoTheme);
		}
	}, [autoTheme, systemColorScheme, theme]);

	const setManualTheme = useCallback((newTheme: Theme): void => {
		setAutoTheme(false);
		setThemeState(newTheme);
		saveThemeSettings(newTheme, false);
	}, []);

	const value: ThemeContextType = {
		theme,
		colors,
		autoTheme,
		toggleTheme,
		setTheme: setManualTheme, // Override setTheme to disable auto theme
		toggleAutoTheme,
		setAutoTheme: toggleAutoTheme, // Alias for consistency
	};

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
};

// Custom hook to use theme
export const useTheme = (): ThemeContextType => {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
};
