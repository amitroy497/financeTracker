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
import { AppState, useColorScheme } from 'react-native';

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
	const [appState, setAppState] = useState(AppState.currentState);
	const [isInitialized, setIsInitialized] = useState(false);

	// Load saved theme settings on mount
	useEffect(() => {
		loadThemeSettings();
	}, []);

	// Listen for app state changes to detect when app comes to foreground
	useEffect(() => {
		const subscription = AppState.addEventListener('change', (nextAppState) => {
			if (appState.match(/inactive|background/) && nextAppState === 'active') {
				// When app becomes active, check if auto theme is enabled and sync
				if (autoTheme) {
					console.log('App became active, syncing theme with system...');
					syncWithSystemTheme();
				}
			}
			setAppState(nextAppState);
		});

		return () => {
			subscription.remove();
		};
	}, [autoTheme, appState]);

	// Listen for system theme changes
	useEffect(() => {
		if (autoTheme && systemColorScheme && isInitialized) {
			console.log('System theme changed to:', systemColorScheme);
			syncWithSystemTheme();
		}
	}, [systemColorScheme, autoTheme, isInitialized]);

	// Load theme settings from AsyncStorage
	const loadThemeSettings = async (): Promise<void> => {
		try {
			const [savedTheme, savedAutoTheme] = await Promise.all([
				AsyncStorage.getItem('app_theme'),
				AsyncStorage.getItem('auto_theme'),
			]);

			console.log('Loading theme settings:', { savedTheme, savedAutoTheme });

			// Parse auto theme setting
			const isAutoTheme = savedAutoTheme === 'true';
			setAutoTheme(isAutoTheme);

			if (isAutoTheme && systemColorScheme) {
				// If auto theme is enabled, use system theme
				const initialTheme = systemColorScheme === 'dark' ? 'dark' : 'light';
				console.log('Auto theme enabled, using system theme:', initialTheme);
				setThemeState(initialTheme);
				setColors(initialTheme === 'light' ? lightColors : darkColors);
				await AsyncStorage.setItem('app_theme', initialTheme);
			} else if (savedTheme === 'light' || savedTheme === 'dark') {
				// Use saved theme if auto theme is disabled
				console.log('Using saved theme:', savedTheme);
				setThemeState(savedTheme);
				setColors(savedTheme === 'light' ? lightColors : darkColors);
			} else {
				// Default to light theme
				console.log('Using default light theme');
				setThemeState('light');
				setColors(lightColors);
				await Promise.all([
					AsyncStorage.setItem('app_theme', 'light'),
					AsyncStorage.setItem('auto_theme', 'false'),
				]);
			}

			setIsInitialized(true);
		} catch (error) {
			console.error('Error loading theme settings:', error);
			setAutoTheme(false);
			setThemeState('light');
			setColors(lightColors);
			setIsInitialized(true);
		}
	};

	// Sync theme with current system theme
	const syncWithSystemTheme = useCallback(() => {
		if (systemColorScheme && autoTheme) {
			const newTheme = systemColorScheme === 'dark' ? 'dark' : 'light';
			console.log('Syncing theme with system:', newTheme);

			if (theme !== newTheme) {
				setThemeState(newTheme);
				setColors(newTheme === 'light' ? lightColors : darkColors);
				AsyncStorage.setItem('app_theme', newTheme).catch(console.error);
			}
		}
	}, [systemColorScheme, autoTheme, theme]);

	// Save theme settings to AsyncStorage
	const saveThemeSettings = async (
		newTheme: Theme,
		auto: boolean
	): Promise<void> => {
		try {
			console.log('Saving theme settings:', { newTheme, auto });
			await Promise.all([
				AsyncStorage.setItem('app_theme', newTheme),
				AsyncStorage.setItem('auto_theme', auto ? 'true' : 'false'),
			]);
		} catch (error) {
			console.error('Error saving theme settings:', error);
		}
	};

	const setTheme = useCallback((newTheme: Theme): void => {
		console.log('Setting manual theme:', newTheme);
		setThemeState(newTheme);
		setColors(newTheme === 'light' ? lightColors : darkColors);
		saveThemeSettings(newTheme, false); // Disable auto theme when manually setting
		setAutoTheme(false);
	}, []);

	const toggleTheme = useCallback((): void => {
		const newTheme = theme === 'light' ? 'dark' : 'light';
		console.log('Toggling theme to:', newTheme);
		setTheme(newTheme);
	}, [theme, setTheme]);

	const toggleAutoTheme = useCallback(async (): Promise<void> => {
		const newAutoTheme = !autoTheme;
		console.log('Toggling auto theme to:', newAutoTheme);
		setAutoTheme(newAutoTheme);

		if (newAutoTheme && systemColorScheme) {
			// If enabling auto theme, sync with system theme
			const systemTheme = systemColorScheme === 'dark' ? 'dark' : 'light';
			console.log('Enabling auto theme, syncing with system:', systemTheme);
			setThemeState(systemTheme);
			setColors(systemTheme === 'light' ? lightColors : darkColors);
			await saveThemeSettings(systemTheme, newAutoTheme);
		} else {
			// If disabling auto theme, keep current theme
			console.log('Disabling auto theme, keeping:', theme);
			await saveThemeSettings(theme, newAutoTheme);
		}
	}, [autoTheme, systemColorScheme, theme]);

	const value: ThemeContextType = {
		theme,
		colors,
		autoTheme,
		toggleTheme,
		setTheme,
		toggleAutoTheme,
		setAutoTheme: (enabled: boolean) => {
			if (enabled !== autoTheme) {
				toggleAutoTheme();
			}
		},
	};

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
};

export const useTheme = (): ThemeContextType => {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
};
