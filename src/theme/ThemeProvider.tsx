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

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
	children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
	const [theme, setThemeState] = useState<Theme>('light');
	const [colors, setColors] = useState<typeof lightColors | typeof darkColors>(
		lightColors
	);

	useEffect(() => {
		loadTheme();
	}, []);

	const updateColors = useCallback(() => {
		setColors(theme === 'light' ? lightColors : darkColors);
	}, [theme]);

	useEffect(() => {
		updateColors();
	}, [theme, updateColors]);

	const loadTheme = async (): Promise<void> => {
		try {
			const savedTheme = await AsyncStorage.getItem('app_theme');
			if (savedTheme === 'light' || savedTheme === 'dark') {
				setThemeState(savedTheme);
			} else {
				// Default to light theme
				setThemeState('light');
				await AsyncStorage.setItem('app_theme', 'light');
			}
		} catch (error) {
			console.error('Error loading theme:', error);
			setThemeState('light');
		}
	};

	const saveTheme = async (newTheme: Theme): Promise<void> => {
		try {
			await AsyncStorage.setItem('app_theme', newTheme);
		} catch (error) {
			console.error('Error saving theme:', error);
		}
	};

	const setTheme = (newTheme: Theme): void => {
		setThemeState(newTheme);
		saveTheme(newTheme);
	};

	const toggleTheme = (): void => {
		const newTheme = theme === 'light' ? 'dark' : 'light';
		setTheme(newTheme);
	};

	const value: ThemeContextType = {
		theme,
		colors,
		toggleTheme,
		setTheme,
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
