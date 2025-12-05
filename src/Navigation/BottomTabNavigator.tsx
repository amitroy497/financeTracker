import { useAuth } from '@/hooks';
import { useTheme } from '@/theme'; // Add this import
import {
	DarkTheme,
	DefaultTheme,
	NavigationContainer,
} from '@react-navigation/native';
import React from 'react';
import { AdminTabNavigator } from './AdminTabNavigator';
import { UserTabNavigator } from './UserTabNavigator';

export const BottomTabNavigator: React.FC = () => {
	const { user } = useAuth();
	const { theme, colors } = useTheme(); // Get theme and colors

	// Create theme-aware navigation theme
	const navigationTheme = theme === 'dark' ? DarkTheme : DefaultTheme;

	// Customize the navigation theme with your colors
	const customTheme = {
		...navigationTheme,
		colors: {
			...navigationTheme.colors,
			primary: colors.primary,
			background: colors.background,
			card: colors.cardBackground,
			text: colors.text,
			border: colors.border,
			notification: colors.primary,
		},
	};

	return (
		<NavigationContainer theme={customTheme}>
			{user?.isAdmin ? <AdminTabNavigator /> : <UserTabNavigator />}
		</NavigationContainer>
	);
};
